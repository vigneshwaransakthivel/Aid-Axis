import { useState, useEffect, useRef } from 'react';
import { Calendar, History, BarChart3, Plus, Flame, X, Utensils, Camera, ChevronDown, ChevronRight, AlertTriangle, ShieldAlert, FileText, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getAll, add, remove, update, saveFile } from '../utils/db';

export default function Nutrition() {
  const [activeTab, setActiveTab] = useState('today');
  const [period, setPeriod] = useState('weekly');
  const [meals, setMeals] = useState([]);
  const [analytics, setAnalytics] = useState({ dailyData: [], averages: {} });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', sugar: '', meal_type: 'breakfast' });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [expandedDates, setExpandedDates] = useState({});
  const [expandedMeals, setExpandedMeals] = useState({});
  const [dailyReviews, setDailyReviews] = useState({});
  const [isGeneratingReviews, setIsGeneratingReviews] = useState({});
  const fileInputRef = useRef(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchData();
  }, [activeTab, period]);

  const fetchData = async () => {
    try {
      const allMeals = await getAll('meals');
      
      if (activeTab === 'today') {
        const todayMeals = allMeals.filter(m => m.created_at?.startsWith(today));
        setMeals(todayMeals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      } else if (activeTab === 'history') {
        setMeals(allMeals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 50));
      } else {
        // Analytics
        const days = period === 'monthly' ? 30 : 7;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        
        const recentMeals = allMeals.filter(m => new Date(m.created_at) >= cutoff);
        const byDate = {};
        
        recentMeals.forEach(m => {
          const date = m.created_at?.split('T')[0];
          if (!byDate[date]) byDate[date] = { date, calories: 0, protein: 0, fat: 0, sugar: 0 };
          byDate[date].calories += m.calories || 0;
          byDate[date].protein += m.protein || 0;
          byDate[date].fat += m.fat || 0;
          byDate[date].sugar += m.sugar || 0;
        });
        
        const dailyData = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
        const avg = (key) => dailyData.length ? dailyData.reduce((s, d) => s + d[key], 0) / dailyData.length : 0;
        
        setAnalytics({
          dailyData,
          averages: { avgCalories: avg('calories'), avgProtein: avg('protein'), avgFat: avg('fat'), avgSugar: avg('sugar') }
        });
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await add('meals', {
        name: form.name,
        calories: parseFloat(form.calories) || 0,
        protein: parseFloat(form.protein) || 0,
        carbs: parseFloat(form.carbs) || 0,
        fat: parseFloat(form.fat) || 0,
        sugar: parseFloat(form.sugar) || 0,
        meal_type: form.meal_type
      });
      setShowModal(false);
      setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', sugar: '', meal_type: 'breakfast' });
      fetchData();
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to add meal. Please try again.');
    }
    setLoading(false);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target.result);
    };
    reader.onerror = () => {
      alert('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyzeAndLog = async () => {
    if (!previewImage) return;
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/nutrition/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: previewImage })
      });
      
      if (!response.ok) {
         const errData = await response.json();
         throw new Error(errData.error || 'Failed to analyze');
      }
      
      const data = await response.json();
      
      await add('meals', {
        name: data.name || 'AI Analyzed Meal',
        calories: parseFloat(data.calories) || 0,
        protein: parseFloat(data.protein) || 0,
        carbs: parseFloat(data.carbs) || 0,
        fat: parseFloat(data.fat) || 0,
        sugar: parseFloat(data.sugar) || 0,
        meal_type: form.meal_type,
        image: previewImage,
        items: Array.isArray(data.items) ? data.items.map(item => ({ ...item, avoided_status: null })) : []
      });
      
      setShowModal(false);
      setPreviewImage(null);
      setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', sugar: '', meal_type: 'breakfast' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteMeal = async (id) => {
    try {
      await remove('meals', id);
      setMeals(meals.filter(m => m.id !== id));
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const toggleDate = (date) => setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  const toggleMeal = (id) => setExpandedMeals(prev => ({ ...prev, [id]: !prev[id] }));



  const handleDailyReview = async (dateKey, totalsObj, dayMeals) => {
    setIsGeneratingReviews(prev => ({ ...prev, [dateKey]: true }));
    try {
      const strippedMeals = dayMeals.map(m => ({ ...m, image: undefined }));
      const response = await fetch('http://localhost:5000/api/nutrition/daily-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totals: totalsObj, meals: strippedMeals })
      });
      
      if (!response.ok) {
        throw new Error('Server returned ' + response.status);
      }
      const data = await response.json();
      setDailyReviews(prev => ({ ...prev, [dateKey]: data.review }));

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
<title>Dietary Risk Assessment - ${dateKey}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; line-height: 1.5; }
  h1, h2, h3 { color: #0f766e; margin-top: 0; }
  .totals { background: #f0fdfa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ccfbf1; }
  .totals ul { margin: 0; padding-left: 20px; }
  .meal { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px; display: flex; gap: 15px; background: #fff; }
  .meal img { width: 150px; height: 150px; border-radius: 6px; object-fit: cover; }
  .meal-info { flex: 1; }
  .meal-info h3 { margin-bottom: 5px; color: #111827; }
  .plan { background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin-top: 20px; }
  .plan h2 { color: #b91c1c; }
  .badge { background: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; margin-left: 5px; }
</style>
</head>
<body>
  <h1>Dietary Risk Assessment</h1>
  <p><strong>Date:</strong> ${dateKey}</p>
  
  <div class="totals">
    <h2>Daily Totals</h2>
    <ul>
      <li><strong>Calories:</strong> ${Math.round(totalsObj.calories)} kcal</li>
      <li><strong>Protein:</strong> ${Math.round(totalsObj.protein)} g</li>
      <li><strong>Fat:</strong> ${Math.round(totalsObj.fat)} g</li>
      <li><strong>Sugar:</strong> ${Math.round(totalsObj.sugar)} g</li>
    </ul>
  </div>

  <h2>Meals Consumed</h2>
  ${dayMeals.map(m => `
    <div class="meal">
      ${m.image ? `<img src="${m.image}" alt="${m.name}"/>` : ''}
      <div class="meal-info">
        <h3>${m.name} <span style="font-size: 14px; font-weight: normal; color: #6b7280;">(${m.meal_type})</span></h3>
        <p style="margin-bottom: 10px; color: #4b5563; font-size: 14px;"><strong>Calories:</strong> ${m.calories} kcal | <strong>Protein:</strong> ${m.protein}g | <strong>Fat:</strong> ${m.fat}g | <strong>Sugar:</strong> ${m.sugar}g</p>
        ${m.items && m.items.filter(item => item.avoided_status !== true).length > 0 ? `
          <p style="margin-bottom: 5px; font-size: 14px; font-weight: bold;">Detected Items:</p>
          <ul style="margin: 0; padding-left: 0; font-size: 14px; color: #374151; list-style: none;">
            ${m.items.filter(item => item.avoided_status !== true).map(item => `
              <li style="margin-bottom: 8px; padding: 8px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
                <div style="display:flex; align-items: center;">
                  <strong>${item.name}</strong>
                  ${item.suggest_avoid ? `<span class="badge" style="margin-left:auto;">Avoid</span>` : '<span style="color:#16a34a; font-size:11px; font-weight:bold; margin-left:auto;">OK</span>'}
                </div>
                ${item.description ? `<p style="margin: 4px 0 0; font-size: 12px; color: #6b7280;">${item.description}</p>` : ''}
                ${item.suggest_avoid && item.reason ? `<p style="margin: 4px 0 0; font-size: 12px; color: #dc2626; font-style: italic;">${item.reason}</p>` : ''}
              </li>
            `).join('')}
          </ul>
        ` : ''}
      </div>
    </div>
  `).join('')}

  <div class="plan">
    <h2>Clinical Intervention Plan</h2>
    <p style="margin:0; color: #991b1b;">${data.review.replace(/\n/g, '<br/>')}</p>
  </div>
</body>
</html>`;

      const fileData = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
      const fileName = `Dietary Risk - ${dateKey.replace(/\//g, '-')}.html`;
      
      const doc = await add('health_documents', {
        name: fileName,
        category: 'other',
        type: 'text/html',
        file_size: fileData.length
      });
      
      await saveFile(doc.id, fileData, fileName, 'text/html');
    } catch (err) {
      console.error(err);
      alert('Failed to generate review.');
    } finally {
      setIsGeneratingReviews(prev => ({ ...prev, [dateKey]: false }));
    }
  };

  const handleItemAvoided = async (mealId, itemIndex, avoided) => {
    try {
      const mealToUpdate = meals.find(m => m.id === mealId);
      if (!mealToUpdate) return;
      const updatedItems = [...mealToUpdate.items];
      updatedItems[itemIndex].avoided_status = avoided;
      
      await update('meals', mealId, { items: updatedItems });
      setMeals(meals.map(m => m.id === mealId ? { ...m, items: updatedItems } : m));
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const groupedHistory = meals.reduce((acc, meal) => {
    const d = new Date(meal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (!acc[d]) acc[d] = [];
    acc[d].push(meal);
    return acc;
  }, {});

  const renderMeal = (meal, isToday) => {
    const isExpanded = expandedMeals[meal.id];
    return (
    <div key={meal.id} className="flex flex-col p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-100 transition-all">
      <div 
        className="flex items-start justify-between cursor-pointer group"
        onClick={() => toggleMeal(meal.id)}
      >
         <div className="flex gap-4">
           {meal.image && (
             <img src={meal.image} alt="Food" className="w-16 h-16 object-cover rounded-md border flex-shrink-0" />
           )}
           <div>
             <p className="font-medium text-gray-800 flex items-center gap-2">
               {meal.name}
               {isExpanded ? <ChevronDown className="w-4 h-4 text-teal-600" /> : <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-teal-500 transition-colors" />}
             </p>
             <p className="text-sm text-gray-500">{meal.meal_type} • {new Date(meal.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
           </div>
         </div>
         <div className="flex items-center gap-4 flex-shrink-0">
            <span className="text-orange-600 font-semibold">{meal.calories} kcal</span>
            <span className="text-teal-600 hidden md:inline">{meal.protein}g protein</span>
            <button 
              onClick={(e) => { e.stopPropagation(); deleteMeal(meal.id); }} 
              className="text-red-500 hover:text-red-700 bg-white p-1 rounded-full shadow-sm relative z-10"
            >
              <X className="w-4 h-4" />
            </button>
         </div>
      </div>
      
      {isExpanded && meal.items && meal.items.length > 0 && typeof meal.items[0] === 'object' && (
        <div className="mt-4 pt-4 border-t border-gray-200 grid gap-2 grid-cols-1 sm:grid-cols-2" onClick={(e) => e.stopPropagation()}>
          {meal.items.map((item, idx) => (
            <div key={idx} className="p-3 bg-white border border-gray-100 rounded-md shadow-sm">
              <div className="flex justify-between items-start mb-1">
                 <span className="font-semibold text-sm text-gray-800">{item.name}</span>
                 {item.suggest_avoid && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-1">Avoid</span>}
              </div>
              {item.description && <p className="text-xs text-gray-600 leading-relaxed mb-1">{item.description}</p>}
              {item.suggest_avoid && item.reason && (
                <p className="text-xs text-red-600 leading-relaxed font-medium mt-1 border-t border-red-50 pt-1">{item.reason}</p>
              )}
              
              {isToday && item.suggest_avoid && item.avoided_status === null && (
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-gray-700">Did you avoid this?</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleItemAvoided(meal.id, idx, true)} className="text-[10px] px-3 py-1 bg-green-500 text-white rounded font-medium hover:bg-green-600 shadow-sm transition-colors">Yes</button>
                    <button onClick={() => handleItemAvoided(meal.id, idx, false)} className="text-[10px] px-3 py-1 bg-red-500 text-white rounded font-medium hover:bg-red-600 shadow-sm transition-colors">No</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nutrition Tracker</h1>
          <p className="text-gray-500">Track your daily meals and monitor your nutrition</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Log Meal
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-6">
        {[
          { id: 'today', icon: Calendar, label: 'Today' },
          { id: 'history', icon: History, label: 'History' },
          { id: 'analytics', icon: BarChart3, label: 'Analytics' },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`tab-btn flex items-center gap-2 pb-3 ${activeTab === id ? 'active' : ''}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'analytics' && (
        <>
          <div className="flex gap-2 mb-6">
            {['weekly', 'monthly'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-full text-sm ${period === p ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Avg Calories', value: analytics.averages?.avgCalories || 0, unit: 'kcal/day', color: 'text-red-500 bg-red-50' },
              { label: 'Avg Protein', value: analytics.averages?.avgProtein || 0, unit: 'g/day', color: 'text-teal-500 bg-teal-50' },
              { label: 'Total Fat', value: analytics.averages?.avgFat || 0, unit: 'grams', color: 'text-yellow-500 bg-yellow-50' },
              { label: 'Total Sugar', value: analytics.averages?.avgSugar || 0, unit: 'grams', color: 'text-red-500 bg-red-50' },
            ].map(({ label, value, unit, color }) => (
              <div key={label} className={`stat-card p-4 ${color.split(' ')[1]}`}>
                <p className={`text-sm ${color.split(' ')[0]}`}>{label}</p>
                <p className="text-2xl font-bold">{Math.round(value)}</p>
                <p className="text-xs text-gray-500">{unit}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="stat-card p-5">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" /> Daily Calories
                </h3>
                <div className="flex gap-2 text-[10px] font-medium bg-gray-50 p-1.5 rounded-lg border">
                  <span className="flex items-center gap-1 text-green-600"><span className="w-2 h-2 rounded-full bg-green-500"></span>Safe (&lt;2k)</span>
                  <span className="flex items-center gap-1 text-yellow-600"><span className="w-2 h-2 rounded-full bg-yellow-500"></span>Med (2k-2.5k)</span>
                  <span className="flex items-center gap-1 text-red-600"><span className="w-2 h-2 rounded-full bg-red-500"></span>Danger (&gt;2.5k)</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={analytics.dailyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} />
                  <YAxis />
                  <Tooltip />
                  <ReferenceLine y={2000} stroke="#22c55e" strokeOpacity={0.4} strokeDasharray="3 3" />
                  <ReferenceLine y={2500} stroke="#ef4444" strokeOpacity={0.4} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="calories" stroke="#0d9488" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="stat-card p-5">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold">Sugar Trend</h3>
                <div className="flex gap-2 text-[10px] font-medium bg-gray-50 p-1.5 rounded-lg border">
                  <span className="flex items-center gap-1 text-green-600"><span className="w-2 h-2 rounded-full bg-green-500"></span>Safe (&lt;25g)</span>
                  <span className="flex items-center gap-1 text-yellow-600"><span className="w-2 h-2 rounded-full bg-yellow-500"></span>Med (25-36g)</span>
                  <span className="flex items-center gap-1 text-red-600"><span className="w-2 h-2 rounded-full bg-red-500"></span>Danger (&gt;36g)</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={analytics.dailyData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} />
                  <YAxis />
                  <Tooltip />
                  <ReferenceLine y={25} stroke="#22c55e" strokeOpacity={0.4} strokeDasharray="3 3" />
                  <ReferenceLine y={36} stroke="#ef4444" strokeOpacity={0.4} strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="sugar" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {activeTab === 'today' && (
        <div className="space-y-6">
          {(() => {
            const todayTotals = meals.reduce((acc, m) => {
              acc.calories += m.calories || 0;
              acc.protein += m.protein || 0;
              acc.fat += m.fat || 0;
              acc.sugar += m.sugar || 0;
              return acc;
            }, { calories: 0, protein: 0, fat: 0, sugar: 0 });
            const isHighRisk = todayTotals.calories > 2500 || todayTotals.sugar > 36;

            return (
              <>
                {meals.length > 0 && (
                  <div className={isHighRisk ? "bg-red-50 border border-red-200 rounded-xl p-5 mb-2" : "bg-teal-50 border border-teal-200 rounded-xl p-5 mb-2"}>
                    <div className="flex items-start gap-4">
                      <div className={isHighRisk ? "bg-red-100 p-2 rounded-full flex-shrink-0" : "bg-teal-100 p-2 rounded-full flex-shrink-0"}>
                        {isHighRisk ? <AlertTriangle className="w-6 h-6 text-red-600" /> : <FileText className="w-6 h-6 text-teal-600" />}
                      </div>
                      <div className="flex-1">
                        <h3 className={isHighRisk ? "text-red-800 font-bold text-lg" : "text-teal-800 font-bold text-lg"}>
                          {isHighRisk ? "⚠️ High Intake Alert" : "Daily Nutrition Report"}
                        </h3>
                        <p className={isHighRisk ? "text-red-700 mt-1 mb-3" : "text-teal-700 mt-1 mb-3"}>
                          {isHighRisk 
                            ? "You've heavily exceeded your daily limits for calories or sugar. This dietary spike has been flagged." 
                            : "Generate a clinical dietary assessment and personalized recommendations based on today's logged meals."}
                        </p>
                        
                        {!dailyReviews['today'] ? (
                          <button 
                            onClick={() => handleDailyReview('today', todayTotals, meals)} 
                            disabled={isGeneratingReviews['today']}
                            className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:text-white disabled:cursor-not-allowed ${isHighRisk ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-600 hover:bg-teal-700'}`}
                          >
                            {isHighRisk ? <ShieldAlert className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                            {isGeneratingReviews['today'] 
                              ? (isHighRisk ? 'Generating Recovery Plan...' : 'Generating Report...') 
                              : (isHighRisk ? 'Generate Daily Recovery Plan & Sync to Locker' : 'Generate Report & Sync to Locker')}
                          </button>
                        ) : (
                          <div className={`bg-white p-4 rounded-lg border mt-2 shadow-sm ${isHighRisk ? 'border-red-100' : 'border-teal-100'}`}>
                            <p className="text-sm text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">
                              <span className="font-bold text-teal-700">
                                {isHighRisk ? 'Clinical Intervention:' : 'Clinical Recommendation:'}
                              </span>
                              <br/>
                              {dailyReviews['today']}
                            </p>
                            <p className={`text-xs font-semibold mt-3 flex items-center gap-1 ${isHighRisk ? 'text-red-500' : 'text-teal-600'}`}>
                              ✓ Synced to Health Locker {isHighRisk ? "for Doctor's Review" : ""}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="stat-card p-6">
                  {meals.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Utensils className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 mb-2">No meals logged yet today</p>
                      <p className="text-sm text-gray-400">Start logging your meals to track nutrition</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {meals.map(meal => renderMeal(meal, true))}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="stat-card p-6">
          {meals.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">No history available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedHistory).map(([date, dayMeals]) => (
                <div key={date} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <button 
                    onClick={() => toggleDate(date)} 
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-teal-600" />
                      <span className="font-semibold text-gray-700">{date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{dayMeals.length} meals</span>
                      {expandedDates[date] ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </div>
                  </button>
                  {expandedDates[date] && (
                    <div className="p-4 space-y-4 border-t border-gray-100 bg-white">
                      {(() => {
                        const dayTotals = dayMeals.reduce((acc, m) => {
                          acc.calories += m.calories || 0;
                          acc.protein += m.protein || 0;
                          acc.fat += m.fat || 0;
                          acc.sugar += m.sugar || 0;
                          return acc;
                        }, { calories: 0, protein: 0, fat: 0, sugar: 0 });
                        const isDayHighRisk = dayTotals.calories > 2500 || dayTotals.sugar > 36;
                        
                        return (
                          <>
                            {dayMeals.length > 0 && (
                              <div className={isDayHighRisk ? "bg-red-50 border border-red-200 rounded-xl p-4 mb-2" : "bg-teal-50 border border-teal-200 rounded-xl p-4 mb-2"}>
                                <div className="flex items-start gap-3">
                                  <div className={isDayHighRisk ? "bg-red-100 p-2 rounded-full flex-shrink-0" : "bg-teal-100 p-2 rounded-full flex-shrink-0"}>
                                    {isDayHighRisk ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <FileText className="w-5 h-5 text-teal-600" />}
                                  </div>
                                  <div className="flex-1">
                                    <h3 className={isDayHighRisk ? "text-red-800 font-bold text-sm" : "text-teal-800 font-bold text-sm"}>
                                      {isDayHighRisk ? "⚠️ High Intake Alert" : "Daily Report"}
                                    </h3>
                                    <p className={isDayHighRisk ? "text-red-700 mt-1 mb-3 text-sm" : "text-teal-700 mt-1 mb-3 text-sm"}>
                                      {isDayHighRisk 
                                        ? `You heavily exceeded your daily limits (${Math.round(dayTotals.calories)} kcal) on this day.` 
                                        : `Generate dietary recommendations for ${Math.round(dayTotals.calories)} kcal logged.`}
                                    </p>
                                    
                                    {!dailyReviews[date] ? (
                                      <button 
                                        onClick={() => handleDailyReview(date, dayTotals, dayMeals)} 
                                        disabled={isGeneratingReviews[date]}
                                        className={`flex items-center gap-2 px-3 py-1.5 text-white text-xs font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:text-white disabled:cursor-not-allowed ${isDayHighRisk ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-600 hover:bg-teal-700'}`}
                                      >
                                        {isDayHighRisk ? <ShieldAlert className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                        {isGeneratingReviews[date] 
                                          ? 'Generating...' 
                                          : (isDayHighRisk ? 'Generate Recovery Plan & Sync' : 'Generate Report & Sync')}
                                      </button>
                                    ) : (
                                      <div className={`bg-white p-3 rounded-lg border mt-2 shadow-sm ${isDayHighRisk ? 'border-red-100' : 'border-teal-100'}`}>
                                        <p className="text-xs text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">
                                          <span className="font-bold text-teal-700">
                                            {isDayHighRisk ? 'Clinical Intervention:' : 'Recommendation:'}
                                          </span>
                                          <br/>
                                          {dailyReviews[date]}
                                        </p>
                                        <p className={`text-[10px] font-semibold mt-2 flex items-center gap-1 ${isDayHighRisk ? 'text-red-500' : 'text-teal-600'}`}>
                                          ✓ Synced to Health Locker
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            {dayMeals.map(meal => renderMeal(meal, false))}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Meal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="stat-card w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Log Meal with Nutrition Analyzer</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Meal Type</label>
              <select value={form.meal_type} onChange={e => setForm({ ...form, meal_type: e.target.value })} className="input-field" disabled={isAnalyzing}>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Food Image</label>
              {!previewImage ? (
                <div 
                  className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors border-teal-300 bg-teal-50/50 hover:bg-teal-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="w-12 h-12 mx-auto mb-3 text-teal-500" />
                  <p className="text-lg font-medium text-teal-700">Tap to upload a photo</p>
                  <p className="text-sm text-teal-600/70 mt-2">Make sure the entire plate is visible.</p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={previewImage} alt="Preview" className="w-full max-h-80 object-contain" />
                  {!isAnalyzing && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => setPreviewImage(null)} className="px-4 py-2 bg-white text-gray-800 font-medium rounded-lg shadow-sm hover:bg-gray-50 transition-colors">Change Photo</button>
                    </div>
                  )}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} />
            </div>
            
            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
              <button type="button" onClick={() => { setShowModal(false); setPreviewImage(null); }} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors" disabled={isAnalyzing}>Cancel</button>
              <button type="button" onClick={handleAnalyzeAndLog} className="flex-1 px-4 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" disabled={!previewImage || isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <Flame className="w-4 h-4 animate-bounce" /> Analyzing...
                  </>
                ) : (
                  'Analyze & Log'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
