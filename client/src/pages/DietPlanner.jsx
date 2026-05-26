import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Activity, Apple, Check, AlertTriangle, 
  Sparkles, ShieldCheck, Heart, User, Dumbbell, 
  Droplets, RefreshCw, ChevronRight, CheckCircle, 
  XCircle, HelpCircle, BarChart3, TrendingUp,
  FolderClosed, Download
} from 'lucide-react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { getAll, add } from '../utils/db';
import { FOOD_DATASET } from '../utils/foodDataset';

const DISEASES = [
  { id: 'none', label: 'General / Healthy Diet' },
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'hypertension', label: 'Hypertension (High BP)' },
  { id: 'anemia', label: 'Anemia (Low Hemoglobin)' },
  { id: 'cholesterol', label: 'High Cholesterol' },
  { id: 'obesity', label: 'Obesity' }
];

const DIET_GOALS = [
  { id: 'sugar', label: 'Control Blood Sugar' },
  { id: 'weight_loss', label: 'Reduce Weight' },
  { id: 'weight_gain', label: 'Increase Protein / Muscle' },
  { id: 'energy', label: 'Improve Energy & Stamina' },
  { id: 'bp', label: 'Reduce Salt & Blood Pressure' },
  { id: 'hemoglobin', label: 'Improve Hemoglobin / Iron' },
  { id: 'general', label: 'General Healthy Diet' }
];

// AVOID_FOODS: keys must match DISEASES ids exactly
const AVOID_FOODS = {
  diabetes: 'Sweets, sugary drinks, soda, deep-fried food, excess white rice, refined flour (maida), potatoes',
  hypertension: 'Pickles, table salt, canned soups, processed meats, salty snacks, frozen foods, alcohol',
  anemia: 'Excess tea, coffee, whole grains/bran (phytates reduce iron absorption), high calcium foods eaten with iron-rich meals',
  cholesterol: 'Butter, ghee, red meat, deep-fried foods, palm oil, cheese, whole milk dairy products',
  obesity: 'Burgers, French fries, sugary bakery products, carbonated beverages, white sugar, butter, ice cream',
  none: 'Highly processed fast foods, excess refined sugar, artificial trans-fats'
};

export default function DietPlanner() {
  // Page states: 'input', 'prefer_selection', 'result'
  const [step, setStep] = useState('input');
  const [inputMode, setInputMode] = useState('manual'); // 'manual', 'reports', 'both'
  const [availableReports, setAvailableReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState('');
  
  // Simulated OCR analysis states
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [extractedData, setExtractedData] = useState(null);

  // Health Profile inputs
  const [profile, setProfile] = useState({
    age: '',
    height: '',
    weight: '',
    disease: 'none',
    diabetesType: 'Type 2',
    bloodSugarBefore: '',
    bloodSugarAfter: '',
    insulinTiming: '',
    mealTiming: 'Regular',
    breakfastTime: '08:00 AM',
    lunchTime: '01:00 PM',
    dinnerTime: '08:00 PM',
    sugarLevel: '',
    systolic: '',
    diastolic: '',
    hemoglobin: '',
    cholesterol: '',
    preference: 'vegetarian',
    allergies: '',
    goal: 'general',
    lowSugar: true,
    lowSalt: false,
    lowFat: false
  });

  // Food selection states
  const [suggestedFoodList, setSuggestedFoodList] = useState([]);
  const [selectedFoods, setSelectedFoods] = useState([]);
  
  // Created Diet Plan
  const [dietPlan, setDietPlan] = useState(null);
  
  // Follow-up Tracking states (Stored in LocalStorage for persistence)
  const [weeklyTracking, setWeeklyTracking] = useState({
    followed: 0,
    skipped: 0,
    history: [] // { date, meal_type, food, status: 'followed'/'skipped' }
  });

  // Database integration for Nutrition Tracker
  const [loggedMeals, setLoggedMeals] = useState([]);

  useEffect(() => {
    fetchReports();
    fetchLoggedMeals();
    loadPersistedData();
  }, []);

  const fetchReports = async () => {
    try {
      const docs = await getAll('health_documents');
      // Filter for reports that look like medical/lab tests
      const reports = docs.filter(d => d.category === 'lab_report' || d.name.toLowerCase().includes('report') || d.name.toLowerCase().includes('blood') || d.name.toLowerCase().includes('prescription'));
      setAvailableReports(reports);
      if (reports.length > 0) {
        setSelectedReportId(reports[0].id.toString());
      }
    } catch (e) {
      console.error('Failed to fetch reports', e);
    }
  };

  const fetchLoggedMeals = async () => {
    try {
      const meals = await getAll('meals');
      setLoggedMeals(meals);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPersistedData = () => {
    const savedPlan = localStorage.getItem('aidaxis_diet_plan');
    const savedTracking = localStorage.getItem('aidaxis_diet_tracking');
    if (savedPlan) {
      setDietPlan(JSON.parse(savedPlan));
      setStep('result');
    }
    if (savedTracking) {
      setWeeklyTracking(JSON.parse(savedTracking));
    }
  };

  // Simulate OCR Medical Report scanning
  const handleAnalyzeReport = () => {
    if (!selectedReportId) {
      alert('Please select a report first!');
      return;
    }
    const reportName = availableReports.find(r => r.id.toString() === selectedReportId)?.name || 'Medical Report';
    
    setIsScanning(true);
    setScanProgress(10);
    
    const interval = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsScanning(false);
            // Dynamic mock report extraction based on name
            let mockData = {};
            if (reportName.toLowerCase().includes('sugar') || reportName.toLowerCase().includes('diabet') || reportName.toLowerCase().includes('hba1c')) {
              mockData = {
                disease: 'diabetes',
                sugarLevel: '190 mg/dL',
                diabetesType: 'Type 2',
                bloodSugarBefore: '145 mg/dL',
                bloodSugarAfter: '210 mg/dL',
                goal: 'sugar',
                lowSugar: true,
                lowSalt: false,
                lowFat: false,
                notes: 'Blood glucose levels spike post meals. Fasting HbA1c is high (8.2%). Type 2 Diabetes confirmed.'
              };
            } else if (reportName.toLowerCase().includes('lipid') || reportName.toLowerCase().includes('cholesterol')) {
              mockData = {
                disease: 'cholesterol',
                cholesterol: '255 mg/dL',
                goal: 'bp',
                lowSugar: false,
                lowSalt: true,
                lowFat: true,
                notes: 'LDL is elevated. HDL is borderline. Restrict saturated fats and deep-fried items immediately.'
              };
            } else if (reportName.toLowerCase().includes('pressure') || reportName.toLowerCase().includes('bp')) {
              mockData = {
                disease: 'hypertension',
                systolic: '150',
                diastolic: '95',
                goal: 'bp',
                lowSugar: false,
                lowSalt: true,
                lowFat: false,
                notes: 'Stage 2 Hypertension indicated. Limit daily sodium intake to under 1500mg. Increase potassium intakes.'
              };
            } else if (reportName.toLowerCase().includes('hemo') || reportName.toLowerCase().includes('blood')) {
              mockData = {
                disease: 'anemia',
                hemoglobin: '9.8 g/dL',
                goal: 'hemoglobin',
                lowSugar: false,
                lowSalt: false,
                lowFat: false,
                notes: 'Low hemoglobin level indicates Moderate Anemia. Plan rich iron content meals alongside Vitamin C sources.'
              };
            } else {
              // General default extraction
              mockData = {
                disease: 'diabetes',
                sugarLevel: '185 mg/dL',
                diabetesType: 'Type 2',
                bloodSugarBefore: '135',
                bloodSugarAfter: '195',
                systolic: '135',
                diastolic: '85',
                cholesterol: '220',
                hemoglobin: '11.5',
                goal: 'sugar',
                lowSugar: true,
                lowSalt: true,
                lowFat: false,
                notes: 'AI OCR scan detected Type 2 diabetic indicators and borderline hypertension. Suggest low sugar and low sodium diet goals.'
              };
            }
            
            setExtractedData(mockData);
            // Autofill profile with extracted details
            setProfile(p => ({
              ...p,
              disease: mockData.disease,
              sugarLevel: mockData.sugarLevel || p.sugarLevel,
              diabetesType: mockData.diabetesType || p.diabetesType,
              bloodSugarBefore: mockData.bloodSugarBefore || p.bloodSugarBefore,
              bloodSugarAfter: mockData.bloodSugarAfter || p.bloodSugarAfter,
              systolic: mockData.systolic || p.systolic,
              diastolic: mockData.diastolic || p.diastolic,
              cholesterol: mockData.cholesterol || p.cholesterol,
              hemoglobin: mockData.hemoglobin || p.hemoglobin,
              goal: mockData.goal || p.goal,
              lowSugar: mockData.lowSugar,
              lowSalt: mockData.lowSalt,
              lowFat: mockData.lowFat
            }));
          }, 600);
          return 100;
        }
        return p + 25;
      });
    }, 400);
  };

  const handleProfileChange = (field, val) => {
    setProfile(p => ({ ...p, [field]: val }));
  };

  const handleConditionSelect = (disease) => {
    // Set smart defaults based on selected disease
    let goals = 'general';
    let lowSugar = false;
    let lowSalt = false;
    let lowFat = false;

    if (disease === 'diabetes') { goals = 'sugar'; lowSugar = true; }
    else if (disease === 'hypertension') { goals = 'bp'; lowSalt = true; }
    else if (disease === 'anemia') { goals = 'hemoglobin'; }
    else if (disease === 'cholesterol') { goals = 'bp'; lowFat = true; }
    else if (disease === 'obesity') { goals = 'weight_loss'; lowFat = true; }

    setProfile(p => ({
      ...p,
      disease,
      goal: goals,
      lowSugar,
      lowSalt,
      lowFat
    }));
  };

  // Proceed from profiles to food selection
  const handleProceedToFoods = () => {
    // Dynamically filter food suggestions from the clinical trained dataset (FOOD_DATASET)
    const list = FOOD_DATASET.filter(item => {
      // If the user has a disease, check if this food is safe for it
      if (profile.disease && profile.disease !== 'none') {
        return item.tags[profile.disease] === true;
      }
      return item.tags.general === true;
    }).map(item => item.name);

    setSuggestedFoodList(list);
    // Auto-select all by default, user can prune
    setSelectedFoods(list);
    setStep('prefer_selection');
  };

  const toggleFoodPreference = (food) => {
    if (selectedFoods.includes(food)) {
      setSelectedFoods(selectedFoods.filter(f => f !== food));
    } else {
      setSelectedFoods([...selectedFoods, food]);
    }
  };

  // Compile final food items and generate complete diet plan output
  const handleGeneratePlan = () => {
    if (selectedFoods.length === 0) {
      alert('Please select at least 1-2 foods that you like so we can plan meals!');
      return;
    }

    const { disease, goal, preference, lowSugar, lowSalt, lowFat } = profile;
    
    // Build lookup sets from FOOD_DATASET for reliable matching
    const datasetNames = new Set(FOOD_DATASET.map(f => f.name));
    // Only keep foods the user selected AND that exist in dataset
    const foodPool = selectedFoods.filter(f => datasetNames.has(f));
    // Fallback: if user deselected all dataset items, use full selected list
    const pool = foodPool.length > 0 ? foodPool : selectedFoods;

    const hasFood = (keyword) => pool.some(f => f.toLowerCase().includes(keyword.toLowerCase()));
    const pickFood = (keywords, fallback) => {
      for (const kw of keywords) {
        const match = pool.find(f => f.toLowerCase().includes(kw.toLowerCase()));
        if (match) return match;
      }
      return fallback;
    };

    // Formulate suggestions
    let breakfast = '';
    let lunch = '';
    let dinner = '';
    let midSnack = '';
    let eveSnack = '';
    let calorieTarget = '1800 - 2000 kcal';
    let proteinTarget = '65g - 80g';
    let carbLimit = '200g';
    let fatLimit = '50g';
    let sugarLimit = '25g';
    let saltLimit = '5g';

    const prefVeg = preference === 'vegetarian';

    // Breakfast — pick from breakfast-suited foods
    const bfItems = FOOD_DATASET.filter(f => f.mealTypes.includes('breakfast') && pool.includes(f.name));
    if (bfItems.length > 0) {
      const bf = bfItems[0];
      if (bf.name.includes('Idli')) {
        breakfast = '2 Steamed Rice Cakes (Idli) served with warm Lentil Vegetable Soup (Sambar)';
      } else if (bf.name.includes('Oats')) {
        breakfast = 'Oats porridge with hot milk' + (prefVeg ? ' and 5 Almonds' : ' and 1 Boiled Egg White');
      } else if (bf.name.includes('Poha')) {
        breakfast = '1 plate of Flattened Rice Flakes (Poha) cooked with mild vegetables';
      } else if (bf.name.includes('Upma')) {
        breakfast = '1 small bowl of Semolina Porridge (Upma)';
      } else if (bf.name.includes('Khichdi')) {
        breakfast = 'Light Lentil Rice Porridge (Khichdi) — a gentle morning start';
      } else {
        breakfast = `${bf.name} — a healthy morning start`;
      }
    } else {
      breakfast = prefVeg ? 'Oats porridge with hot milk and 5 Almonds' : 'Boiled Eggs with Whole Wheat Flatbread (Chapati)';
    }

    // Lunch — assemble from lunch-suited foods
    const dalType = hasFood('Moong Dal') ? 'Yellow Lentil Curry (Moong Dal)' : 'Lentil Curry (Dal)';
    const vegType = hasFood('Palak') || hasFood('Spinach') ? 'Spinach Side Dish (Palak Sabji)'
      : hasFood('Karela') || hasFood('Bitter Gourd') ? 'Bitter Gourd Side Dish (Karela Sabji)'
      : hasFood('Broccoli') ? 'Steamed Broccoli'
      : 'Mixed Vegetable Side Dish (Sabji)';
    const carbType = hasFood('Chapati') ? '2 Whole Wheat Flatbreads (Chapati)'
      : hasFood('Rice') ? '1 bowl of Steamed Rice'
      : '2 Whole Wheat Flatbreads (Chapati)';
    lunch = `${carbType} with 1 bowl of ${dalType} and ${vegType}`;
    if (!prefVeg && hasFood('Chicken')) lunch += ', side of Lean Chicken Curry';

    // Snacks
    const fruitType = hasFood('Pomegranate') ? 'Pomegranate bowl'
      : hasFood('Guava') ? '1 fresh Guava'
      : hasFood('Apple') ? '1 fresh Apple'
      : hasFood('Strawberr') ? 'Fresh Strawberries'
      : hasFood('Orange') ? '1 Orange'
      : 'Seasonal fruit';
    const nutType = hasFood('Almond') ? '5 Almonds' : hasFood('Walnut') ? '4 Walnuts' : 'mixed seeds';
    midSnack = `${fruitType} with ${nutType}`;
    eveSnack = hasFood('Sprouts') ? '1 small bowl of Mixed Sprouts Salad with Green Tea'
      : hasFood('Chickpea') || hasFood('Chana') ? 'Roasted Chickpeas (Chana) with 1 cup of Green Tea'
      : 'Buttermilk with Cucumber Salad';

    // Dinner
    if (hasFood('Khichdi')) {
      dinner = 'Light Lentil Rice Porridge (Moong Dal Khichdi) with 1 cup Fresh Yogurt (Curd)';
    } else {
      const dProtein = prefVeg
        ? (hasFood('Paneer') ? 'Scrambled Cottage Cheese (Paneer Bhurji)' : 'Mixed Vegetable Side Dish (Sabji)')
        : 'Lean Chicken Curry or Scrambled Eggs';
      dinner = `2 Whole Wheat Flatbreads (Chapati) with ${dProtein}`;
      if (hasFood('Soup') || hasFood('Tomato')) dinner += ' and Warm Tomato Soup';
    }

    // Disease limits adjustments
    if (disease === 'diabetes') {
      calorieTarget = '1600 - 1800 kcal';
      sugarLimit = '12g (Strict limit)';
      carbLimit = '150g (Low carb focus)';
    } else if (disease === 'obesity') {
      calorieTarget = '1400 - 1600 kcal';
      fatLimit = '35g (Low fat focus)';
    } else if (disease === 'hypertension') {
      saltLimit = '1.5g (Strict low BP limit)';
    } else if (disease === 'anemia') {
      proteinTarget = '80g - 95g (High protein & iron focus)';
    }

    const createdPlan = {
      profileDetails: { ...profile },
      selectedPreferredFoods: selectedFoods,
      meals: {
        breakfast,
        midSnack,
        lunch,
        eveSnack,
        dinner
      },
      avoid: AVOID_FOODS[disease] || AVOID_FOODS.none,
      water: '3.5 liters (approx. 14 cups) spaced evenly through the day. Set alerts every 2 hours.',
      targets: {
        calories: calorieTarget,
        protein: proteinTarget,
        carbs: carbLimit,
        fat: fatLimit,
        sugar: sugarLimit,
        salt: saltLimit
      },
      notes: `Keep a 2-hour gap between dinner and sleeping. ${disease === 'diabetes' ? 'Monitor post-meal glucose spikes. Avoid refined starches.' : 'Maintain regular physical activity.'} Plan accuracy will improve over time based on your daily tracker log compliance.`
    };

    setDietPlan(createdPlan);
    localStorage.setItem('aidaxis_diet_plan', JSON.stringify(createdPlan));
    setStep('result');
  };

  const handleResetPlanner = () => {
    if (window.confirm('Are you sure you want to delete this diet plan and create a new one?')) {
      localStorage.removeItem('aidaxis_diet_plan');
      setDietPlan(null);
      setProfile({
        age: '',
        height: '',
        weight: '',
        disease: 'none',
        diabetesType: 'Type 2',
        bloodSugarBefore: '',
        bloodSugarAfter: '',
        insulinTiming: '',
        mealTiming: 'Regular',
        breakfastTime: '08:00 AM',
        lunchTime: '01:00 PM',
        dinnerTime: '08:00 PM',
        sugarLevel: '',
        systolic: '',
        diastolic: '',
        hemoglobin: '',
        cholesterol: '',
        preference: 'vegetarian',
        allergies: '',
        goal: 'general',
        lowSugar: false,
        lowSalt: false,
        lowFat: false
      });
      setStep('input');
    }
  };

  // Follow diet logging action
  const handleFollowMeal = (mealType, foodName, calorieVal) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const filteredHistory = weeklyTracking.history.filter(m => !(m.date === todayStr && m.meal_type === mealType));

    const logItem = {
      date: todayStr,
      meal_type: mealType,
      food: foodName,
      status: 'followed'
    };
    const updatedHistory = [logItem, ...filteredHistory];
    const followedCount = updatedHistory.filter(h => h.status === 'followed').length;
    const skippedCount = updatedHistory.filter(h => h.status === 'skipped').length;

    const newTracking = {
      followed: followedCount,
      skipped: skippedCount,
      history: updatedHistory
    };
    setWeeklyTracking(newTracking);
    localStorage.setItem('aidaxis_diet_tracking', JSON.stringify(newTracking));
  };

  const handleSkipMeal = (mealType, foodName) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const filteredHistory = weeklyTracking.history.filter(m => !(m.date === todayStr && m.meal_type === mealType));

    const logItem = {
      date: todayStr,
      meal_type: mealType,
      food: foodName,
      status: 'skipped'
    };
    const updatedHistory = [logItem, ...filteredHistory];
    const followedCount = updatedHistory.filter(h => h.status === 'followed').length;
    const skippedCount = updatedHistory.filter(h => h.status === 'skipped').length;

    const newTracking = {
      followed: followedCount,
      skipped: skippedCount,
      history: updatedHistory
    };
    setWeeklyTracking(newTracking);
    localStorage.setItem('aidaxis_diet_tracking', JSON.stringify(newTracking));
  };

  const getGroupedHistory = () => {
    const groups = {};
    weeklyTracking.history.forEach(item => {
      if (!groups[item.date]) {
        groups[item.date] = {
          breakfast: null,
          snack: [],
          lunch: null,
          dinner: null,
          all: []
        };
      }
      groups[item.date].all.push(item);
      if (item.meal_type === 'breakfast') groups[item.date].breakfast = item;
      else if (item.meal_type === 'lunch') groups[item.date].lunch = item;
      else if (item.meal_type === 'dinner') groups[item.date].dinner = item;
      else groups[item.date].snack.push(item);
    });
    return groups;
  };

  const handleDownloadDocument = () => {
    if (!dietPlan) return;

    let docContent = `==================================================\n`;
    docContent += `          AID-AXIS PERSONALIZED DIET REPORT       \n`;
    docContent += `==================================================\n\n`;
    
    docContent += `PATIENT PROFILE:\n`;
    docContent += `--------------------------------------------------\n`;
    docContent += `- Target Goal: ${dietPlan.profileDetails.disease} goal\n`;
    docContent += `- Age: ${dietPlan.profileDetails.age || 'N/A'} yrs\n`;
    docContent += `- Height: ${dietPlan.profileDetails.height || 'N/A'} cm\n`;
    docContent += `- Weight: ${dietPlan.profileDetails.weight || 'N/A'} kg\n`;
    docContent += `- Goal Type: ${dietPlan.profileDetails.goal || 'General Health'}\n`;
    docContent += `- Allergies: ${dietPlan.profileDetails.allergies || 'None'}\n`;
    if (dietPlan.profileDetails.disease === 'diabetes') {
      docContent += `- Diabetes Type: ${dietPlan.profileDetails.diabetesType || 'N/A'}\n`;
      docContent += `- Blood Sugar (Before Meal): ${dietPlan.profileDetails.bloodSugarBefore || 'N/A'}\n`;
      docContent += `- Blood Sugar (After Meal): ${dietPlan.profileDetails.bloodSugarAfter || 'N/A'}\n`;
    }
    docContent += `\nRECOMMENDED MEAL PLAN:\n`;
    docContent += `--------------------------------------------------\n`;
    docContent += `[🍳 Breakfast] (${dietPlan.profileDetails.breakfastTime || '08:00 AM'}):\n`;
    docContent += `  ${dietPlan.meals.breakfast}\n\n`;
    docContent += `[🍏 Mid-Morning Snack] (11:00 AM):\n`;
    docContent += `  ${dietPlan.meals.midSnack}\n\n`;
    docContent += `[🍛 Lunch] (${dietPlan.profileDetails.lunchTime || '01:00 PM'}):\n`;
    docContent += `  ${dietPlan.meals.lunch}\n\n`;
    docContent += `[☕ Evening Snack] (05:00 PM):\n`;
    docContent += `  ${dietPlan.meals.eveSnack}\n\n`;
    docContent += `[🍽️ Dinner] (${dietPlan.profileDetails.dinnerTime || '08:00 PM'}):\n`;
    docContent += `  ${dietPlan.meals.dinner}\n\n`;

    docContent += `TARGET DAILY NUTRITIONAL RANGE:\n`;
    docContent += `--------------------------------------------------\n`;
    docContent += `- Calories: ${dietPlan.targets.calories}\n`;
    docContent += `- Protein Target: ${dietPlan.targets.protein}\n`;
    docContent += `- Carbohydrate Limit: ${dietPlan.targets.carbs}\n`;
    docContent += `- Saturated Fat Limit: ${dietPlan.targets.fat}\n`;
    docContent += `- Sugar Limit: ${dietPlan.targets.sugar}\n`;
    docContent += `- Sodium/Salt Limit: ${dietPlan.targets.salt}\n\n`;

    docContent += `FOODS TO AVOID:\n`;
    docContent += `--------------------------------------------------\n`;
    docContent += `${dietPlan.avoid}\n\n`;

    docContent += `DIET TRACKING HISTORY LOG:\n`;
    docContent += `--------------------------------------------------\n`;
    
    const grouped = getGroupedHistory();
    if (Object.keys(grouped).length === 0) {
      docContent += `No logs recorded yet.\n`;
    } else {
      Object.entries(grouped).forEach(([date, meals]) => {
        docContent += `* Date: ${date}\n`;
        if (meals.breakfast) {
          docContent += `  - Breakfast Suggestion: ${meals.breakfast.food} (${meals.breakfast.status === 'followed' ? 'TAKEN' : 'SKIPPED'})\n`;
        }
        meals.snack.forEach(s => {
          docContent += `  - Snack: ${s.food} (${s.status === 'followed' ? 'TAKEN' : 'SKIPPED'})\n`;
        });
        if (meals.lunch) {
          docContent += `  - Lunch Suggestion: ${meals.lunch.food} (${meals.lunch.status === 'followed' ? 'TAKEN' : 'SKIPPED'})\n`;
        }
        if (meals.dinner) {
          docContent += `  - Dinner Suggestion: ${meals.dinner.food} (${meals.dinner.status === 'followed' ? 'TAKEN' : 'SKIPPED'})\n`;
        }
        docContent += `\n`;
      });
    }

    docContent += `==================================================\n`;
    docContent += `Generated by AID-AXIS Digital Health Companion\n`;
    docContent += `==================================================\n`;

    const blob = new Blob([docContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AidAxis_DietReport_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Calculate follow percentage
  const totalTracked = weeklyTracking.followed + weeklyTracking.skipped;
  const followPercentage = totalTracked > 0 ? Math.round((weeklyTracking.followed / totalTracked) * 100) : 0;

  // Chart data formatting
  // BUG FIX: No fake fallback values — show real data only
  const followedData = [
    { name: 'Followed', value: weeklyTracking.followed, color: '#0d9488' },
    { name: 'Skipped', value: weeklyTracking.skipped, color: '#f43f5e' }
  ];

  // Compare actual logged meals with recommended foods to build a dynamic compliance trend
  const getConsistencyData = () => {
    const dates = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    return dates.map(dateStr => {
      // BUG FIX: Use weeklyTracking.history (our local store), not loggedMeals IndexedDB
      const trackedDay = weeklyTracking.history.filter(h => h.date === dateStr);
      const followedCount = trackedDay.filter(h => h.status === 'followed').length;
      const skippedCount = trackedDay.filter(h => h.status === 'skipped').length;
      const totalDay = followedCount + skippedCount;

      // Score based purely on compliance tracking
      let score = 0;
      if (totalDay > 0) {
        score = Math.round((followedCount / totalDay) * 100);
      }

      return {
        date: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
        'Diet Score': score,
        'Meals Followed': followedCount,
        'Meals Skipped': skippedCount
      };
    });
  };

  const chartData = getConsistencyData();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Apple className="w-7 h-7 text-teal-600 animate-pulse" />
            AI Diet Planner & Evaluator
          </h1>
          <p className="text-gray-500">Formulate custom disease-targeted diets and evaluate health report logs</p>
        </div>
        {step === 'result' && (
          <button onClick={handleResetPlanner} className="px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Reset Diet Plan
          </button>
        )}
      </div>

      {step === 'input' && (
        <div className="space-y-6">
          {/* STEP 1: Choose Data Input Mode */}
          <div className="stat-card">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600" />
              How do you want to create your diet plan?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                onClick={() => setInputMode('manual')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                  inputMode === 'manual' 
                    ? 'border-teal-500 bg-teal-50/40 shadow-md' 
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center mb-3">
                    <User className="w-5 h-5 text-teal-600" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-1">Manual Entry</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Enter your disease state, allergies, and metrics manually.</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${inputMode === 'manual' ? 'border-teal-600 bg-teal-600 text-white' : 'border-gray-300'}`}>
                    {inputMode === 'manual' && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>

              <div 
                onClick={() => {
                  setInputMode('reports');
                  if (availableReports.length === 0) fetchReports();
                }}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                  inputMode === 'reports' 
                    ? 'border-teal-500 bg-teal-50/40 shadow-md' 
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-1">Uploaded Medical Reports</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Extract metrics from existing lab results in your locker.</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${inputMode === 'reports' ? 'border-teal-600 bg-teal-600 text-white' : 'border-gray-300'}`}>
                    {inputMode === 'reports' && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>

              <div 
                onClick={() => {
                  setInputMode('both');
                  if (availableReports.length === 0) fetchReports();
                }}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
                  inputMode === 'both' 
                    ? 'border-teal-500 bg-teal-50/40 shadow-md' 
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-3">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-1">Both Combined</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">Autofill lab values using report scanning, then adjust details manually.</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${inputMode === 'both' ? 'border-teal-600 bg-teal-600 text-white' : 'border-gray-300'}`}>
                    {inputMode === 'both' && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2: Report-Based scanning analysis (If selected) */}
          {(inputMode === 'reports' || inputMode === 'both') && (
            <div className="stat-card border-l-4 border-l-blue-500">
              <h2 className="text-lg font-semibold mb-3 text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Medical Locker Report Analyzer
              </h2>
              {availableReports.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                  <p className="text-gray-500 mb-2">No uploaded reports found in your Digital Health Locker.</p>
                  <p className="text-xs text-gray-400 mb-4">Please upload a blood sugar, hemoglobin, or lipid profile in the Health Locker first.</p>
                  <Link to="/health-locker" className="btn-primary inline-flex">Go to Locker</Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Select Report from Locker</label>
                      <select 
                        value={selectedReportId} 
                        onChange={e => setSelectedReportId(e.target.value)} 
                        className="input-field bg-white"
                        disabled={isScanning}
                      >
                        {availableReports.map(r => (
                          <option key={r.id} value={r.id}>{r.name} ({new Date(r.created_at).toLocaleDateString()})</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      onClick={handleAnalyzeReport}
                      disabled={isScanning}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium shadow-md shadow-blue-500/20 hover:shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isScanning ? 'Scanning...' : 'Scan & Extract Data'}
                    </button>
                  </div>

                  {isScanning && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex justify-between text-xs text-blue-700 font-medium mb-1.5">
                        <span>Simulating AI OCR text extraction...</span>
                        <span>{scanProgress}%</span>
                      </div>
                      <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-2 transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
                      </div>
                    </div>
                  )}

                  {extractedData && !isScanning && (
                    <div className="mt-4 p-5 bg-green-50/50 border border-green-200 rounded-2xl">
                      <h4 className="font-bold text-green-800 flex items-center gap-2 mb-3">
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                        OCR Extraction Successful
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {extractedData.sugarLevel && (
                          <div className="bg-white p-3 rounded-xl border border-green-100">
                            <span className="text-[10px] text-gray-400 block font-semibold uppercase">Blood Sugar</span>
                            <span className="font-bold text-gray-800 text-lg">{extractedData.sugarLevel}</span>
                          </div>
                        )}
                        {extractedData.cholesterol && (
                          <div className="bg-white p-3 rounded-xl border border-green-100">
                            <span className="text-[10px] text-gray-400 block font-semibold uppercase">Cholesterol</span>
                            <span className="font-bold text-gray-800 text-lg">{extractedData.cholesterol}</span>
                          </div>
                        )}
                        {extractedData.systolic && (
                          <div className="bg-white p-3 rounded-xl border border-green-100">
                            <span className="text-[10px] text-gray-400 block font-semibold uppercase">Blood Pressure</span>
                            <span className="font-bold text-gray-800 text-lg">{extractedData.systolic}/{extractedData.diastolic} mmHg</span>
                          </div>
                        )}
                        {extractedData.hemoglobin && (
                          <div className="bg-white p-3 rounded-xl border border-green-100">
                            <span className="text-[10px] text-gray-400 block font-semibold uppercase">Hemoglobin</span>
                            <span className="font-bold text-gray-800 text-lg">{extractedData.hemoglobin}</span>
                          </div>
                        )}
                        <div className="bg-white p-3 rounded-xl border border-green-100">
                          <span className="text-[10px] text-gray-400 block font-semibold uppercase">Condition Identified</span>
                          <span className="font-bold text-teal-600 capitalize text-sm">{extractedData.disease}</span>
                        </div>
                      </div>
                      <p className="text-sm text-green-800 font-medium bg-green-100/50 p-3 rounded-xl">{extractedData.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Manual Input Section (Adjust details) */}
          {(inputMode === 'manual' || inputMode === 'both') && (
            <div className="stat-card">
              <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" />
                Health Profile & Target Goals
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Age</label>
                  <input type="number" placeholder="e.g. 45" value={profile.age} onChange={e => handleProfileChange('age', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Height (cm)</label>
                  <input type="number" placeholder="e.g. 170" value={profile.height} onChange={e => handleProfileChange('height', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Weight (kg)</label>
                  <input type="number" placeholder="e.g. 72" value={profile.weight} onChange={e => handleProfileChange('weight', e.target.value)} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Select Health Condition</label>
                  <select 
                    value={profile.disease} 
                    onChange={e => handleConditionSelect(e.target.value)}
                    className="input-field"
                  >
                    {DISEASES.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Dietary Goal</label>
                  <select 
                    value={profile.goal} 
                    onChange={e => handleProfileChange('goal', e.target.value)}
                    className="input-field"
                  >
                    {DIET_GOALS.map(g => (
                      <option key={g.id} value={g.id}>{g.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DIABETES-SPECIFIC SECTION */}
              {profile.disease === 'diabetes' && (
                <div className="mb-6 p-5 bg-teal-50/30 border border-teal-100 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <h3 className="font-bold text-teal-800 text-sm mb-3">Diabetes Management Inputs</h3>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Diabetes Type</label>
                    <select value={profile.diabetesType} onChange={e => handleProfileChange('diabetesType', e.target.value)} className="input-field bg-white">
                      <option value="Type 1">Type 1 (Insulin Dependent)</option>
                      <option value="Type 2">Type 2 (Non-Insulin / Tablet)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Fasting Sugar Level (mg/dL)</label>
                    <input type="number" placeholder="e.g. 140" value={profile.bloodSugarBefore} onChange={e => handleProfileChange('bloodSugarBefore', e.target.value)} className="input-field bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Post-Meal Sugar Level (mg/dL)</label>
                    <input type="number" placeholder="e.g. 210" value={profile.bloodSugarAfter} onChange={e => handleProfileChange('bloodSugarAfter', e.target.value)} className="input-field bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Insulin / Tablet Timings</label>
                    <input type="text" placeholder="e.g. 8:00 AM before breakfast" value={profile.insulinTiming} onChange={e => handleProfileChange('insulinTiming', e.target.value)} className="input-field bg-white" />
                  </div>
                </div>
              )}

              {/* General Health Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Sugar level (Fasting)</label>
                  <input type="text" placeholder="e.g. 110 mg/dL" value={profile.sugarLevel} onChange={e => handleProfileChange('sugarLevel', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Systolic BP</label>
                  <input type="number" placeholder="e.g. 120" value={profile.systolic} onChange={e => handleProfileChange('systolic', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Diastolic BP</label>
                  <input type="number" placeholder="e.g. 80" value={profile.diastolic} onChange={e => handleProfileChange('diastolic', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Hemoglobin (g/dL)</label>
                  <input type="number" step="0.1" placeholder="e.g. 14.2" value={profile.hemoglobin} onChange={e => handleProfileChange('hemoglobin', e.target.value)} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Cholesterol (mg/dL)</label>
                  <input type="number" placeholder="e.g. 195" value={profile.cholesterol} onChange={e => handleProfileChange('cholesterol', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Food Preference</label>
                  <select value={profile.preference} onChange={e => handleProfileChange('preference', e.target.value)} className="input-field">
                    <option value="vegetarian">Vegetarian</option>
                    <option value="non-vegetarian">Non-vegetarian</option>
                    <option value="both">Both Preferences</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Allergies</label>
                  <input type="text" placeholder="e.g. nuts, milk, egg" value={profile.allergies} onChange={e => handleProfileChange('allergies', e.target.value)} className="input-field" />
                </div>
              </div>

              {/* Meal Timings Section */}
              <div className="mb-6 p-5 bg-teal-50/20 border border-teal-50 rounded-2xl">
                <h3 className="font-bold text-teal-800 text-sm mb-3">Meal Timings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Breakfast Time</label>
                    <input type="text" placeholder="e.g. 08:00 AM" value={profile.breakfastTime} onChange={e => handleProfileChange('breakfastTime', e.target.value)} className="input-field bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Lunch Time</label>
                    <input type="text" placeholder="e.g. 01:00 PM" value={profile.lunchTime} onChange={e => handleProfileChange('lunchTime', e.target.value)} className="input-field bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Dinner Time</label>
                    <input type="text" placeholder="e.g. 08:00 PM" value={profile.dinnerTime} onChange={e => handleProfileChange('dinnerTime', e.target.value)} className="input-field bg-white" />
                  </div>
                </div>
              </div>

              {/* Food Restrictions Options */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Food Restrictions</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                    <input type="checkbox" checked={profile.lowSugar} onChange={e => handleProfileChange('lowSugar', e.target.checked)} className="rounded text-teal-600 focus:ring-teal-500" />
                    Low Sugar
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                    <input type="checkbox" checked={profile.lowSalt} onChange={e => handleProfileChange('lowSalt', e.target.checked)} className="rounded text-teal-600 focus:ring-teal-500" />
                    Low Salt
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                    <input type="checkbox" checked={profile.lowFat} onChange={e => handleProfileChange('lowFat', e.target.checked)} className="rounded text-teal-600 focus:ring-teal-500" />
                    Low Saturated Fat
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button onClick={handleProceedToFoods} className="btn-primary">
                  Select Preferred Foods <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Quick manual redirect if report scan mode used without manual entries */}
          {inputMode === 'reports' && extractedData && (
            <div className="flex justify-end">
              <button onClick={handleProceedToFoods} className="btn-primary">
                Confirm & Select Foods <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: Food Preference Selection */}
      {step === 'prefer_selection' && (
        <div className="stat-card">
          <h2 className="text-lg font-semibold mb-2 text-gray-800 flex items-center gap-2">
            <Apple className="w-5 h-5 text-teal-600" />
            Pick Your Preferred Foods
          </h2>
          <p className="text-sm text-gray-400 mb-6">Based on your condition, we recommend these items. Select the ones you actually enjoy eating so we can build a practical plan!</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {suggestedFoodList.map(food => {
              const isSelected = selectedFoods.includes(food);
              return (
                <div 
                  key={food}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between items-center text-center font-semibold text-sm ${
                    isSelected 
                      ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm' 
                      : 'border-gray-100 bg-white hover:border-gray-200 text-gray-700'
                  }`}
                >
                  <div className="cursor-pointer w-full py-2" onClick={() => toggleFoodPreference(food)}>
                    {food}
                    {isSelected && <Check className="w-4 h-4 text-teal-600 inline ml-1.5 relative -top-0.5" />}
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(food)}`, '_blank');
                    }}
                    className="mt-3 text-[10px] font-bold text-teal-600 bg-teal-100/40 hover:bg-teal-100 px-3 py-1 rounded-lg transition-all border border-teal-200 uppercase tracking-wider flex items-center gap-1"
                  >
                    🔍 View Image
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between pt-4 border-t">
            <button onClick={() => setStep('input')} className="px-5 py-2.5 border rounded-xl text-gray-700 font-medium hover:bg-gray-50">Back</button>
            <button onClick={handleGeneratePlan} className="btn-primary">
              Generate Final Diet Plan <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Final Diet Plan result page */}
      {step === 'result' && dietPlan && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Meal suggestions list */}
            <div className="stat-card">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                  Your Personalized Meal Plan
                </h3>
                <span className="text-xs font-semibold px-3 py-1 bg-teal-100 text-teal-700 rounded-full capitalize">
                  {dietPlan.profileDetails.disease} goal
                </span>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: 'Breakfast Suggestion', value: dietPlan.meals.breakfast, type: 'breakfast', kcal: 350, time: dietPlan.profileDetails.breakfastTime || '08:00 AM' },
                  { label: 'Mid-Morning Snack', value: dietPlan.meals.midSnack, type: 'snack', kcal: 120, time: '11:00 AM' },
                  { label: 'Lunch Suggestion', value: dietPlan.meals.lunch, type: 'lunch', kcal: 600, time: dietPlan.profileDetails.lunchTime || '01:00 PM' },
                  { label: 'Evening Snack', value: dietPlan.meals.eveSnack, type: 'snack', kcal: 150, time: '05:00 PM' },
                  { label: 'Dinner Suggestion', value: dietPlan.meals.dinner, type: 'dinner', kcal: 450, time: dietPlan.profileDetails.dinnerTime || '08:00 PM' }
                ].map(({ label, value, type, kcal, time }) => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const loggedToday = weeklyTracking.history.some(m => m.food === value && m.meal_type === type && m.date === todayStr && m.status === 'followed');
                  const skippedToday = weeklyTracking.history.some(m => m.food === value && m.meal_type === type && m.date === todayStr && m.status === 'skipped');
                  return (
                    <div key={label} className="p-4 bg-teal-50/20 border border-teal-50 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] text-teal-600 uppercase font-bold">{label}</span>
                          <span className="text-[10px] bg-teal-100/80 text-teal-800 px-2 py-0.5 rounded-full font-bold">{time}</span>
                        </div>
                        <p className="font-bold text-gray-800 text-sm md:text-base">{value}</p>
                        <button 
                          onClick={() => window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(value)}`, '_blank')}
                          className="mt-1.5 text-[10px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-all"
                        >
                          🔍 View Image
                        </button>
                      </div>
                      <div className="flex gap-2 items-center flex-shrink-0">
                        {loggedToday ? (
                          <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-200 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Taken Today
                          </span>
                        ) : skippedToday ? (
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Skipped Today
                          </span>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleFollowMeal(type, value, kcal)}
                              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-xl shadow-sm transition-all"
                            >
                              Followed
                            </button>
                            <button 
                              onClick={() => handleSkipMeal(type, value)}
                              className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-xl border border-red-200 transition-all"
                            >
                              Skipped
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Avoid list, Water & Target Goals */}
            <div className="stat-card border-l-4 border-l-orange-500">
              <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Foods to Avoid
              </h3>
              <p className="text-sm text-gray-600 font-semibold bg-orange-50 p-4 rounded-xl border border-orange-100 mb-6">{dietPlan.avoid}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-gray-700 text-sm mb-1.5 flex items-center gap-1">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    Water Intake Suggestion
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed bg-blue-50/50 p-3 rounded-xl border border-blue-100">{dietPlan.water}</p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-700 text-sm mb-1.5 flex items-center gap-1">
                    <Dumbbell className="w-4 h-4 text-purple-500" />
                    Lifestyle Health Notes
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed bg-purple-50/50 p-3 rounded-xl border border-purple-100">{dietPlan.notes}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Daily Recommended Target Limits */}
            <div className="stat-card bg-gradient-to-br from-teal-900 to-teal-800 text-white border-0 shadow-xl">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
                <ShieldCheck className="w-5 h-5 text-teal-200" />
                Recommended Target Range
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Calories', val: dietPlan.targets.calories },
                  { label: 'Protein Limit', val: dietPlan.targets.protein },
                  { label: 'Carbohydrate Limit', val: dietPlan.targets.carbs },
                  { label: 'Saturated Fat Limit', val: dietPlan.targets.fat },
                  { label: 'Sugar Limit', val: dietPlan.targets.sugar },
                  { label: 'Sodium Salt Limit', val: dietPlan.targets.salt }
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between items-center border-b border-white/10 pb-2">
                    <span className="text-xs text-teal-100 font-semibold">{label}</span>
                    <span className="font-bold text-white text-sm">{val}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-white/50 leading-relaxed mt-4">
                *Accuracy improves over time as we match actual food calorie logging statistics.
              </p>
            </div>

            {/* Compliance Progress Charts */}
            <div className="stat-card">
              <h3 className="font-bold text-gray-800 text-base mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-600" />
                Diet Compliance Dashboard
              </h3>

              {totalTracked > 0 ? (
                <div className="space-y-6">
                  {/* Pie Chart Followed vs Not Followed */}
                  <div className="flex flex-col items-center">
                    <div className="w-full h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={followedData} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={50} 
                            outerRadius={70} 
                            paddingAngle={5} 
                            dataKey="value"
                          >
                            {followedData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center relative -top-6">
                      <p className="text-3xl font-extrabold text-teal-600">{followPercentage}%</p>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Compliance Score</p>
                    </div>
                  </div>

                  {/* Daily Calorie Intake Area Chart */}
                  <div>
                    <h4 className="font-semibold text-gray-700 text-xs mb-3 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-teal-600" /> Daily Compliance Trend
                    </h4>
                    <div className="w-full h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="Diet Score" stroke="#0d9488" strokeWidth={2} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="Meals Followed" stroke="#14b8a6" strokeWidth={1.5} />
                          <Line type="monotone" dataKey="Meals Skipped" stroke="#f43f5e" strokeWidth={1.5} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <HelpCircle className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm mb-1">No tracked history yet.</p>
                  <p className="text-xs text-gray-400">Mark meals as "Followed" or "Skipped" in your plan to populate accuracy charts!</p>
                </div>
              )}
            </div>
          </div>

          {/* Diet History Grouped Branches */}
          <div className="stat-card mt-6 lg:col-span-3">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <FolderClosed className="w-5 h-5 text-teal-600" />
                Diet History Log (Date-wise branches)
              </h3>
              <button
                onClick={handleDownloadDocument}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Download Report Document
              </button>
            </div>

            {weeklyTracking.history.length === 0 ? (
              <div className="text-center py-8 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-sm text-gray-400">No historical records logged yet.</p>
                <p className="text-xs text-gray-400 mt-1">Check / Follow meal plan options above to create branches.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(getGroupedHistory()).map(([date, meals]) => (
                  <div key={date} className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 relative shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                      <h4 className="font-bold text-gray-700 text-sm">{date}</h4>
                    </div>
                    
                    <div className="pl-4 border-l-2 border-dashed border-teal-200 space-y-3">
                      {/* Breakfast */}
                      {meals.breakfast && (
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="font-bold text-gray-500 flex items-center gap-1">🍳 Breakfast:</span>
                          <span className="text-gray-700 font-semibold">{meals.breakfast.food}</span>
                          <span className={`text-[10px] w-fit px-1.5 py-0.5 rounded font-bold ${meals.breakfast.status === 'followed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {meals.breakfast.status === 'followed' ? 'TAKEN' : 'SKIPPED'}
                          </span>
                        </div>
                      )}
                      {/* Snacks */}
                      {meals.snack.map((s, idx) => (
                        <div key={idx} className="flex flex-col gap-0.5 text-xs">
                          <span className="font-bold text-gray-500 flex items-center gap-1">🍏 Snack:</span>
                          <span className="text-gray-700 font-semibold">{s.food}</span>
                          <span className={`text-[10px] w-fit px-1.5 py-0.5 rounded font-bold ${s.status === 'followed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {s.status === 'followed' ? 'TAKEN' : 'SKIPPED'}
                          </span>
                        </div>
                      ))}
                      {/* Lunch */}
                      {meals.lunch && (
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="font-bold text-gray-500 flex items-center gap-1">🍛 Lunch:</span>
                          <span className="text-gray-700 font-semibold">{meals.lunch.food}</span>
                          <span className={`text-[10px] w-fit px-1.5 py-0.5 rounded font-bold ${meals.lunch.status === 'followed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {meals.lunch.status === 'followed' ? 'TAKEN' : 'SKIPPED'}
                          </span>
                        </div>
                      )}
                      {/* Dinner */}
                      {meals.dinner && (
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="font-bold text-gray-500 flex items-center gap-1">🍽️ Dinner:</span>
                          <span className="text-gray-700 font-semibold">{meals.dinner.food}</span>
                          <span className={`text-[10px] w-fit px-1.5 py-0.5 rounded font-bold ${meals.dinner.status === 'followed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {meals.dinner.status === 'followed' ? 'TAKEN' : 'SKIPPED'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
