import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Flame, CheckCircle, Droplets, FileText, 
  UtensilsCrossed, Pill, Upload,
  Calendar
} from 'lucide-react';
import { getAll } from '../utils/db';

export default function Dashboard() {
  const [stats, setStats] = useState({
    todayCalories: 0,
    medicationAdherence: 0,
    activeRequests: 0,
    documents: 0,
    nutrition: { protein: 0, fat: 0, sugar: 0 }
  });

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 18 ? 'Good Afternoon' : 'Good Evening';
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const meals = await getAll('meals');
      const todayMeals = meals.filter(m => m.created_at?.startsWith(today));
      
      const bloodRequests = await getAll('blood_requests');
      const documents = await getAll('health_documents');
      
      setStats({
        todayCalories: todayMeals.reduce((s, m) => s + (m.calories || 0), 0),
        medicationAdherence: 0,
        activeRequests: bloodRequests.filter(r => r.status === 'active').length,
        documents: documents.length,
        nutrition: {
          protein: todayMeals.reduce((s, m) => s + (m.protein || 0), 0),
          fat: todayMeals.reduce((s, m) => s + (m.fat || 0), 0),
          sugar: todayMeals.reduce((s, m) => s + (m.sugar || 0), 0)
        }
      });
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const quickActions = [
    { icon: UtensilsCrossed, label: 'Log Meal', path: '/nutrition', color: 'bg-orange-100 text-orange-600' },
    { icon: Pill, label: 'Medications', path: '/medications', color: 'bg-teal-100 text-teal-600' },
    { icon: Droplets, label: 'Blood Requests', path: '/blood-donor', color: 'bg-red-100 text-red-600' },
    { icon: Upload, label: 'Upload Doc', path: '/health-locker', color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{greeting}!</h1>
          <p className="text-gray-500">Here's your health overview for {dateStr}</p>
        </div>
        <div className="flex items-center gap-2 text-gray-500">
          <Calendar className="w-5 h-5" />
          <span>{now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded">Kcal</span>
          </div>
          <p className="text-2xl font-bold">{stats.todayCalories}</p>
          <p className="text-sm text-gray-500">Today's Calories</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-teal-500" />
            </div>
            <span className="text-xs text-teal-500 bg-teal-50 px-2 py-1 rounded">adherence</span>
          </div>
          <p className="text-2xl font-bold">{stats.medicationAdherence}%</p>
          <p className="text-sm text-gray-500">Medication</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Droplets className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">blood</span>
          </div>
          <p className="text-2xl font-bold">{stats.activeRequests}</p>
          <p className="text-sm text-gray-500">Active Requests</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-xs text-purple-500 bg-purple-50 px-2 py-1 rounded">docs</span>
          </div>
          <p className="text-2xl font-bold">{stats.documents}</p>
          <p className="text-sm text-gray-500">Documents</p>
        </div>
      </div>

      {/* Nutrition */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-teal-600" />
              Today's Nutrition
            </h3>
            <Link to="/nutrition" className="text-sm text-teal-600 hover:underline">View All →</Link>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 rounded-full border-8 border-gray-100 flex items-center justify-center">
              <span className="text-gray-400 text-sm text-center">Log your first meal</span>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-teal-500 rounded-full"></span>
                  Protein
                </span>
                <span className="text-teal-600">{stats.nutrition?.protein || 0}g</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  Fat
                </span>
                <span className="text-yellow-600">{stats.nutrition?.fat || 0}g</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                  Sugar
                </span>
                <span className="text-red-600">{stats.nutrition?.sugar || 0}g</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        {quickActions.map(({ icon: Icon, label, path, color }) => (
          <Link
            key={path}
            to={path}
            className="stat-card flex items-center gap-3 group"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="font-medium text-gray-700">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
