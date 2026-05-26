const express = require('express');
const { prepare } = require('../database');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const router = express.Router();

// Get all meals
router.get('/meals', (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    let meals;

    if (date) {
      meals = prepare('SELECT * FROM meals WHERE date(created_at) = ? ORDER BY created_at DESC').all(date);
    } else if (startDate && endDate) {
      meals = prepare('SELECT * FROM meals WHERE date(created_at) BETWEEN ? AND ? ORDER BY created_at DESC').all(startDate, endDate);
    } else {
      meals = prepare('SELECT * FROM meals ORDER BY created_at DESC LIMIT 50').all();
    }

    res.json(meals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add meal
router.post('/meals', (req, res) => {
  try {
    const { name, calories, protein, carbs, fat, sugar, meal_type } = req.body;
    const result = prepare(`
      INSERT INTO meals (name, calories, protein, carbs, fat, sugar, meal_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, calories || 0, protein || 0, carbs || 0, fat || 0, sugar || 0, meal_type);

    const meal = prepare('SELECT * FROM meals WHERE id = ?').get(result.lastInsertRowid);
    res.json(meal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete meal
router.delete('/meals/:id', (req, res) => {
  try {
    prepare('DELETE FROM meals WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analytics
router.get('/analytics', (req, res) => {
  try {
    const { period = 'weekly' } = req.query;
    const days = period === 'monthly' ? 30 : 7;

    const dailyData = prepare(`
      SELECT 
        date(created_at) as date,
        SUM(calories) as calories,
        SUM(protein) as protein,
        SUM(carbs) as carbs,
        SUM(fat) as fat,
        SUM(sugar) as sugar
      FROM meals 
      WHERE created_at >= date('now', '-${days} days')
      GROUP BY date(created_at)
      ORDER BY date
    `).all();

    const averages = prepare(`
      SELECT 
        AVG(daily_calories) as avgCalories,
        AVG(daily_protein) as avgProtein,
        AVG(daily_fat) as avgFat,
        AVG(daily_sugar) as avgSugar
      FROM (
        SELECT 
          date(created_at) as day,
          SUM(calories) as daily_calories,
          SUM(protein) as daily_protein,
          SUM(fat) as daily_fat,
          SUM(sugar) as daily_sugar
        FROM meals 
        WHERE created_at >= date('now', '-${days} days')
        GROUP BY date(created_at)
      )
    `).get();

    res.json({ dailyData, averages: averages || {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analyze food image
router.post('/analyze', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing. Please add it to .env' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // gemini-1.5-flash: fastest, most reliable model for vision tasks
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 1024,
        responseMimeType: "application/json"
      }
    });

    const base64Data = image.split(',')[1];
    const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';

    if (!base64Data) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    const prompt = `You are a professional nutritionist. Analyze this food image carefully and identify all visible food items.
Return ONLY a valid JSON object with no markdown, no code fences, no extra text. Use this exact schema:
{
  "name": "Short descriptive meal name",
  "calories": 500,
  "protein": 20,
  "carbs": 60,
  "fat": 15,
  "sugar": 10,
  "items": [
    {
      "name": "Food item name with quantity (e.g., 2 Idlis, 1 bowl Sambar)",
      "description": "Simple description of the quantity, ingredients, and key nutrients.",
      "suggest_avoid": true/false,
      "reason": "If suggest_avoid is true, explain exactly why (e.g., deep-fried, high sugar). If false, leave empty."
    }
  ]
}
All numeric values must be integers. Identify every individual dish or ingredient visible. Be realistic with portion sizes. 
CRITICAL: Be extremely strict about health. ANY deep-fried foods, high-sugar items, heavy refined carbs, or processed foods MUST be flagged with "suggest_avoid": true.`;

    // Retry up to 3 times with exponential backoff
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await model.generateContent([
          { text: prompt },
          {
            inlineData: {
              data: base64Data,
              mimeType
            }
          }
        ]);

        let text = result.response.text().trim();
        // Strip any accidental markdown fences
        text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        // Extract JSON object if there's surrounding text
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('No valid JSON in response');

        const parsed = JSON.parse(match[0]);
        return res.json(parsed);
      } catch (err) {
        lastError = err;
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, attempt * 2000));
        }
      }
    }

    throw lastError;
  } catch (error) {
    console.error('Analysis error:', error.message);
    res.status(500).json({ error: 'Failed to analyze image. Please try again.' });
  }
});

router.post('/daily-review', async (req, res) => {
  try {
    const { totals, meals } = req.body;
    const mealSummaries = meals.map(m => `${m.name} (${m.calories} kcal)`).join(', ');

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 }
    });

    const prompt = `Act as a warm, encouraging nutritionist. The user exceeded their daily dietary limits today.
    Totals: Calories: ${totals.calories} kcal, Protein: ${totals.protein}g, Fat: ${totals.fat}g, Sugar: ${totals.sugar}g.
    Meals: ${mealSummaries}
    
    Provide a highly actionable, short, and friendly "Clinical Recovery Plan".
    Keep it extremely simple. Give EXACTLY 3 short bullet points of immediate things they can do today or tomorrow to recover (like drinking water, a short walk, etc).
    FORMAT AS SHORT BULLET POINTS (start each with a dash -). Do NOT sound robotic, do NOT use the word "AI", no markdown, and do NOT write paragraphs.`;

    const result = await model.generateContent([prompt]);
    const response = await result.response;
    res.json({ review: response.text().trim() });
  } catch (error) {
    console.error('Review Error:', error.message);
    res.status(500).json({ error: 'Failed to generate daily review' });
  }
});

module.exports = router;
