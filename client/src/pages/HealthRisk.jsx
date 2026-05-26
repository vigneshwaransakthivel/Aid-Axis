import { useState, useEffect } from 'react';
import { AlertCircle, Activity, Heart, TrendingUp } from 'lucide-react';
import { getAll, add, calculateRisk } from '../utils/db';

export default function HealthRisk() {
  const [form, setForm] = useState({ age: '', bmi: '', systolic: '', diastolic: '', fastingGlucose: '' });
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const assessments = await getAll('health_assessments');
      setHistory(assessments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 20));
    } catch (error) {
      console.error('Fetch history error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const riskResult = calculateRisk(
        parseFloat(form.age),
        parseFloat(form.bmi),
        parseFloat(form.systolic),
        parseFloat(form.diastolic),
        parseFloat(form.fastingGlucose)
      );
      
      await add('health_assessments', {
        age: parseFloat(form.age),
        bmi: parseFloat(form.bmi),
        systolic: parseFloat(form.systolic),
        diastolic: parseFloat(form.diastolic),
        fasting_glucose: parseFloat(form.fastingGlucose),
        risk_level: riskResult.riskLevel,
        risk_score: riskResult.riskScore,
        recommendations: riskResult.recommendations
      });
      
      setResult(riskResult);
      fetchHistory();
    } catch (error) {
      console.error('Analyze error:', error);
      alert('Failed to analyze. Please try again.');
    }
    setLoading(false);
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Moderate': return 'text-yellow-600 bg-yellow-100';
      case 'High': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Health Risk Analyzer</h1>
        <p className="text-gray-500">AI-powered health risk assessment based on your metrics</p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-800">Important Disclaimer</p>
          <p className="text-sm text-amber-700">
            This tool is for informational purposes only and is not intended to diagnose, treat, or prevent any disease. 
            Please consult with a healthcare professional for medical advice.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Assessment Form */}
        <div className="stat-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            New Assessment
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age (years)</label>
                <input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} className="input-field" placeholder="e.g., 35" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">BMI</label>
                <input type="number" step="0.1" value={form.bmi} onChange={e => setForm({ ...form, bmi: e.target.value })} className="input-field" placeholder="e.g., 24.5" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure (mmHg)</label>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" value={form.systolic} onChange={e => setForm({ ...form, systolic: e.target.value })} className="input-field" placeholder="Systolic (e.g., 120)" required />
                <input type="number" value={form.diastolic} onChange={e => setForm({ ...form, diastolic: e.target.value })} className="input-field" placeholder="Diastolic (e.g., 80)" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fasting Glucose (mg/dL)</label>
              <input type="number" value={form.fastingGlucose} onChange={e => setForm({ ...form, fastingGlucose: e.target.value })} className="input-field" placeholder="e.g., 95" required />
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary justify-center">
              <TrendingUp className="w-4 h-4" />
              {loading ? 'Analyzing...' : 'Analyze Risk'}
            </button>
          </form>

          {/* Result */}
          {result && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">Risk Assessment</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(result.riskLevel)}`}>
                  {result.riskLevel} Risk
                </span>
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Risk Score</span>
                  <span>{result.riskScore}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${result.riskLevel === 'Low' ? 'bg-green-500' : result.riskLevel === 'Moderate' ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${result.riskScore}%` }}
                  />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Recommendations:</p>
                <ul className="space-y-2">
                  {(result.recommendations || []).map((rec, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-1.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* History */}
        <div className="stat-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-purple-600" />
            Assessment History
          </h3>
          {history.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-purple-300" />
              </div>
              <p className="text-gray-500 mb-2">No assessments yet</p>
              <p className="text-sm text-gray-400">Enter your health metrics to get started</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map(assessment => (
                <div key={assessment.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">{new Date(assessment.created_at).toLocaleDateString()}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskColor(assessment.risk_level)}`}>
                      {assessment.risk_level}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
                    <div>Age: {assessment.age}</div>
                    <div>BMI: {assessment.bmi}</div>
                    <div>BP: {assessment.systolic}/{assessment.diastolic}</div>
                    <div>Glucose: {assessment.fasting_glucose}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
