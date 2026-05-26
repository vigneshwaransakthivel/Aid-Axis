require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

async function test() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        maxOutputTokens: 1024,
      }
    });

    // We'll create a dummy 1x1 base64 image (PNG)
    const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
    const mimeType = 'image/png';
    const prompt = 'Return {}';

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
    console.log("Success:", text);
  } catch (err) {
    console.error("Analysis error exactly:", err.message, err);
  }
}

test();
