import { useState, useMemo } from 'react';
import { Calendar, History, BarChart3, Plus, Flame, X, Utensils } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMeals } from '../store/useStore';

export default function Nutrition() {
  const [activeTab, setActiveTab] = useState('today');
  const [period, setPeriod] = useState('weekly');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', sugar: '', meal_type: 'breakfast' });

  const { meals, addMeal, deleteMeal } = useMeals();
  const today = new Date().toISOString().split('T')[0];

  const filteredMeals = useMemo(() => {
    if (activeTab === 'today') {
      return meals.filter(m => m.created_at?.split('T')[0] === today);
    }
    return meals;
  }, [meals, activeTab, today]);

  const analytics = useMemo(() => {
    const days = period === 'monthly' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyData = {};
    meals.forEach(m => {
      const date = m.created_at?.split('T')[0];
      if (new Date(date) >= startDate) {
        if (!dailyData[date]) {
          dailyData[date] = { date, calories: 0, protein: 0, fat: 0, sugar: 0 };
        }
        dailyData[date].calories += parseFloat(m.calories) || 0;
        dailyData[date].protein += parseFloat(m.protein) || 0;
        dailyData[date].fat += parseFloat(m.fat) || 0;
        dailyData[date].sugar += parseFloat(m.sugar) || 0;
      }
    });

    const data = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
    const avgCalories = data.length ? data.reduce((s, d) => s + d.calories, 0) / data.length : 0;
    const avgProtein = data.length ? data.reduce((s, d) => s + d.protein, 0) / data.length : 0;
    const avgFat = data.length ? data.reduce((s, d) => s + d.fat, 0) / data.length : 0;
    const avgSugar = data.length ? data.reduce((s, d) => s + d.sugar, 0) / data.length : 0;

    return { dailyData: data, averages: { avgCalories, avgProtein, avgFat, avgSugar } };
  }, [meals, period]);

  const handleSubmit = (e) => {
    e.preventDefault();
    addMeal(form);
    setShowModal(false);
    setForm({ name: '', calories: '', protein: '', carbs: '', fat: '', sugar: '', meal_type: 'breakfast' });
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
              { label: 'Avg Calories', value: analytics.averages.avgCalories, unit: 'kcal/day', color: 'text-red-500 bg-red-50' },
              { label: 'Avg Protein', value: analytics.averages.avgProtein, unit: 'g/day', color: 'text-teal-500 bg-teal-50' },
              { label: 'Total Fat', value: analytics.averages.avgFat, unit: 'grams', color: 'text-yellow-500 bg-yellow-50' },
              { label: 'Total Sugar', value: analytics.averages.avgSugar, unit: 'grams', color: 'text-red-500 bg-red-50' },
            ].map(({ label, value, unit, color }) => (
              <div key={label} className={`rounded-xl p-4 ${color.split(' ')[1]}`}>
                <p className={`text-sm ${color.split(' ')[0]}`}>{label}</p>
                <p className="text-2xl font-bold">{Math.round(value)}</p>
                <p className="text-xs text-gray-500">{unit}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" /> Daily Calories
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={analytics.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="calories" stroke="#0d9488" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold mb-4">Sugar Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={analytics.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="sugar" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {(activeTab === 'today' || activeTab === 'history') && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          {filteredMeals.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">No meals logged yet</p>
              <p className="text-sm text-gray-400">Start logging your meals to track nutrition</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMeals.map(meal => (
                <div key={meal.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{meal.name}</p>
                    <p className="text-sm text-gray-500">{meal.meal_type} • {new Date(meal.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-orange-600">{meal.calories} kcal</span>
                    <span className="text-teal-600">{meal.protein}g protein</span>
                    <button onClick={() => deleteMeal(meal.id)} className="text-red-500 hover:text-red-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Meal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Log Meal</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Meal Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g., Grilled Chicken Salad" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Calories</label>
                  <input type="number" value={form.calories} onChange={e => setForm({ ...form, calories: e.target.value })} className="input-field" placeholder="kcal" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Protein (g)</label>
                  <input type="number" value={form.protein} onChange={e => setForm({ ...form, protein: e.target.value })} className="input-field" placeholder="grams" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Carbs (g)</label>
                  <input type="number" value={form.carbs} onChange={e => setForm({ ...form, carbs: e.target.value })} className="input-field" placeholder="grams" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fat (g)</label>
                  <input type="number" value={form.fat} onChange={e => setForm({ ...form, fat: e.target.value })} className="input-field" placeholder="grams" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Meal Type</label>
                <select value={form.meal_type} onChange={e => setForm({ ...form, meal_type: e.target.value })} className="input-field">
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 btn-primary justify-center">Add Meal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
