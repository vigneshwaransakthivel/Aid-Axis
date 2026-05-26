import { useState, useEffect } from 'react';

// Simple localStorage-based store for Vercel deployment
const STORAGE_KEYS = {
  meals: 'aidaxis_meals',
  medications: 'aidaxis_medications',
  medicationLogs: 'aidaxis_medication_logs',
  healthAssessments: 'aidaxis_health_assessments',
  bloodRequests: 'aidaxis_blood_requests',
  healthDocuments: 'aidaxis_health_documents',
};

function getFromStorage(key, defaultValue = []) {
  if (typeof window === 'undefined') return defaultValue;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
}

function saveToStorage(key, data) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// Meals Store
export function useMeals() {
  const [meals, setMeals] = useState([]);

  useEffect(() => {
    setMeals(getFromStorage(STORAGE_KEYS.meals));
  }, []);

  const addMeal = (meal) => {
    const newMeal = { ...meal, id: Date.now(), created_at: new Date().toISOString() };
    const updated = [newMeal, ...meals];
    setMeals(updated);
    saveToStorage(STORAGE_KEYS.meals, updated);
    return newMeal;
  };

  const deleteMeal = (id) => {
    const updated = meals.filter(m => m.id !== id);
    setMeals(updated);
    saveToStorage(STORAGE_KEYS.meals, updated);
  };

  const getMealsByDate = (date) => {
    return meals.filter(m => m.created_at.split('T')[0] === date);
  };

  return { meals, addMeal, deleteMeal, getMealsByDate };
}

// Medications Store
export function useMedications() {
  const [medications, setMedications] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    setMedications(getFromStorage(STORAGE_KEYS.medications));
    setLogs(getFromStorage(STORAGE_KEYS.medicationLogs));
  }, []);

  const addMedication = (med) => {
    const newMed = { ...med, id: Date.now(), active: 1, created_at: new Date().toISOString() };
    const updated = [newMed, ...medications];
    setMedications(updated);
    saveToStorage(STORAGE_KEYS.medications, updated);
    return newMed;
  };

  const deleteMedication = (id) => {
    const updated = medications.filter(m => m.id !== id);
    setMedications(updated);
    saveToStorage(STORAGE_KEYS.medications, updated);
  };

  const logMedication = (medId, taken) => {
    const log = { id: Date.now(), medication_id: medId, taken, scheduled_time: new Date().toISOString() };
    const updated = [log, ...logs];
    setLogs(updated);
    saveToStorage(STORAGE_KEYS.medicationLogs, updated);
  };

  return { medications, logs, addMedication, deleteMedication, logMedication };
}

// Health Assessments Store
export function useHealthAssessments() {
  const [assessments, setAssessments] = useState([]);

  useEffect(() => {
    setAssessments(getFromStorage(STORAGE_KEYS.healthAssessments));
  }, []);

  const addAssessment = (data) => {
    const { riskScore, riskLevel, recommendations } = calculateRisk(data);
    const assessment = {
      ...data,
      id: Date.now(),
      risk_score: riskScore,
      risk_level: riskLevel,
      recommendations,
      created_at: new Date().toISOString()
    };
    const updated = [assessment, ...assessments];
    setAssessments(updated);
    saveToStorage(STORAGE_KEYS.healthAssessments, updated);
    return { ...assessment, riskScore, riskLevel, recommendations };
  };

  return { assessments, addAssessment };
}

function calculateRisk({ age, bmi, systolic, diastolic, fastingGlucose }) {
  let riskScore = 0;
  const recommendations = [];

  if (age > 60) riskScore += 20;
  else if (age > 45) riskScore += 10;
  else if (age > 35) riskScore += 5;

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

  if (systolic >= 140 || diastolic >= 90) {
    riskScore += 25;
    recommendations.push('High blood pressure detected. Reduce sodium intake and consult a doctor.');
  } else if (systolic >= 130 || diastolic >= 80) {
    riskScore += 15;
    recommendations.push('Elevated blood pressure. Monitor regularly and reduce stress.');
  }

  if (fastingGlucose >= 126) {
    riskScore += 25;
    recommendations.push('High fasting glucose indicates diabetes risk. Consult an endocrinologist.');
  } else if (fastingGlucose >= 100) {
    riskScore += 15;
    recommendations.push('Pre-diabetic glucose levels. Reduce sugar intake and exercise regularly.');
  }

  let riskLevel = riskScore >= 60 ? 'High' : riskScore >= 35 ? 'Moderate' : 'Low';

  if (recommendations.length === 0) {
    recommendations.push('Your health metrics look good! Continue maintaining a healthy lifestyle.');
  }

  return { riskScore: Math.min(riskScore, 100), riskLevel, recommendations };
}

// Blood Requests Store
export function useBloodRequests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    setRequests(getFromStorage(STORAGE_KEYS.bloodRequests));
  }, []);

  const addRequest = (req) => {
    const newReq = { ...req, id: Date.now(), status: 'active', created_at: new Date().toISOString() };
    const updated = [newReq, ...requests];
    setRequests(updated);
    saveToStorage(STORAGE_KEYS.bloodRequests, updated);
    return newReq;
  };

  const updateStatus = (id, status) => {
    const updated = requests.map(r => r.id === id ? { ...r, status } : r);
    setRequests(updated);
    saveToStorage(STORAGE_KEYS.bloodRequests, updated);
  };

  const deleteRequest = (id) => {
    const updated = requests.filter(r => r.id !== id);
    setRequests(updated);
    saveToStorage(STORAGE_KEYS.bloodRequests, updated);
  };

  const getStats = () => ({
    active: requests.filter(r => r.status === 'active').length,
    fulfilled: requests.filter(r => r.status === 'fulfilled').length,
    critical: requests.filter(r => r.urgency === 'critical' && r.status === 'active').length,
    total: requests.length
  });

  return { requests, addRequest, updateStatus, deleteRequest, getStats };
}

// Health Documents Store
export function useHealthDocuments() {
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    setDocuments(getFromStorage(STORAGE_KEYS.healthDocuments));
  }, []);

  const addDocument = (doc) => {
    const newDoc = { ...doc, id: Date.now(), created_at: new Date().toISOString() };
    const updated = [newDoc, ...documents];
    setDocuments(updated);
    saveToStorage(STORAGE_KEYS.healthDocuments, updated);
    return newDoc;
  };

  const deleteDocument = (id) => {
    const updated = documents.filter(d => d.id !== id);
    setDocuments(updated);
    saveToStorage(STORAGE_KEYS.healthDocuments, updated);
  };

  const getStats = () => {
    const stats = { prescription: 0, lab_report: 0, xray_scan: 0, ct_mri_scan: 0, vaccination: 0, other: 0 };
    documents.forEach(d => {
      if (stats.hasOwnProperty(d.category)) stats[d.category]++;
    });
    return stats;
  };

  return { documents, addDocument, deleteDocument, getStats };
}

// Dashboard Stats
export function useDashboardStats() {
  const [stats, setStats] = useState({
    todayCalories: 0,
    medicationAdherence: 0,
    activeRequests: 0,
    documents: 0,
    nutrition: { protein: 0, fat: 0, sugar: 0 }
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const meals = getFromStorage(STORAGE_KEYS.meals);
    const requests = getFromStorage(STORAGE_KEYS.bloodRequests);
    const docs = getFromStorage(STORAGE_KEYS.healthDocuments);
    const logs = getFromStorage(STORAGE_KEYS.medicationLogs);

    const todayMeals = meals.filter(m => m.created_at?.split('T')[0] === today);
    const todayLogs = logs.filter(l => l.scheduled_time?.split('T')[0] === today);

    setStats({
      todayCalories: todayMeals.reduce((sum, m) => sum + (parseFloat(m.calories) || 0), 0),
      medicationAdherence: todayLogs.length ? Math.round((todayLogs.filter(l => l.taken).length / todayLogs.length) * 100) : 0,
      activeRequests: requests.filter(r => r.status === 'active').length,
      documents: docs.length,
      nutrition: {
        protein: todayMeals.reduce((sum, m) => sum + (parseFloat(m.protein) || 0), 0),
        fat: todayMeals.reduce((sum, m) => sum + (parseFloat(m.fat) || 0), 0),
        sugar: todayMeals.reduce((sum, m) => sum + (parseFloat(m.sugar) || 0), 0)
      }
    });
  }, []);

  return stats;
}
