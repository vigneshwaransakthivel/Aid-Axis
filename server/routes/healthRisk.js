const express = require('express');
const { prepare } = require('../database');

const router = express.Router();

// Calculate health risk
function calculateRisk(age, bmi, systolic, diastolic, fastingGlucose) {
  let riskScore = 0;
  const recommendations = [];

  // Age factor
  if (age > 60) riskScore += 20;
  else if (age > 45) riskScore += 10;
  else if (age > 35) riskScore += 5;

  // BMI factor
  if (bmi >= 30) {
    riskScore += 25;
    recommendations.push('Consider a weight management program. A BMI of 30+ indicates obesity.');
  } else if (bmi >= 25) {
    riskScore += 15;
    recommendations.push('Your BMI indicates overweight. Regular exercise and balanced diet recommended.');
  } else if (bmi < 18.5) {
    riskScore += 10;
    recommendations.push('Your BMI is below normal. Consider consulting a nutritionist.');
  }

  // Blood pressure factor
  if (systolic >= 140 || diastolic >= 90) {
    riskScore += 25;
    recommendations.push('High blood pressure detected. Reduce sodium intake and consult a doctor.');
  } else if (systolic >= 130 || diastolic >= 80) {
    riskScore += 15;
    recommendations.push('Elevated blood pressure. Monitor regularly and reduce stress.');
  }

  // Fasting glucose factor
  if (fastingGlucose >= 126) {
    riskScore += 25;
    recommendations.push('High fasting glucose indicates diabetes risk. Consult an endocrinologist.');
  } else if (fastingGlucose >= 100) {
    riskScore += 15;
    recommendations.push('Pre-diabetic glucose levels. Reduce sugar intake and exercise regularly.');
  }

  // Determine risk level
  let riskLevel;
  if (riskScore >= 60) riskLevel = 'High';
  else if (riskScore >= 35) riskLevel = 'Moderate';
  else riskLevel = 'Low';

  if (recommendations.length === 0) {
    recommendations.push('Your health metrics look good! Continue maintaining a healthy lifestyle.');
  }

  return { riskScore: Math.min(riskScore, 100), riskLevel, recommendations };
}

// Analyze health risk
router.post('/analyze', (req, res) => {
  try {
    const { age, bmi, systolic, diastolic, fastingGlucose } = req.body;
    
    const { riskScore, riskLevel, recommendations } = calculateRisk(
      parseFloat(age),
      parseFloat(bmi),
      parseFloat(systolic),
      parseFloat(diastolic),
      parseFloat(fastingGlucose)
    );

    // Save assessment
    const result = prepare(`
      INSERT INTO health_assessments (age, bmi, systolic, diastolic, fasting_glucose, risk_level, risk_score, recommendations)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(age, bmi, systolic, diastolic, fastingGlucose, riskLevel, riskScore, JSON.stringify(recommendations));

    res.json({
      id: result.lastInsertRowid,
      riskScore,
      riskLevel,
      recommendations,
      metrics: { age, bmi, systolic, diastolic, fastingGlucose }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get assessment history
router.get('/history', (req, res) => {
  try {
    const assessments = prepare(`
      SELECT * FROM health_assessments ORDER BY created_at DESC LIMIT 20
    `).all();
    
    res.json(assessments.map(a => ({
      ...a,
      recommendations: JSON.parse(a.recommendations || '[]')
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get latest assessment
router.get('/latest', (req, res) => {
  try {
    const assessment = prepare(`
      SELECT * FROM health_assessments ORDER BY created_at DESC LIMIT 1
    `).get();
    
    if (assessment) {
      assessment.recommendations = JSON.parse(assessment.recommendations || '[]');
    }
    
    res.json(assessment || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
