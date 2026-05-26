import { useState, useEffect } from 'react';
import { Calendar, History, BarChart3, Plus, X, Clock, Check, Trash2, Bell, ChevronDown, ChevronUp } from 'lucide-react';
import { getAll, add, remove } from '../utils/db';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Medications() {
  const [activeTab, setActiveTab] = useState('today');
  const [medications, setMedications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [expandedIssues, setExpandedIssues] = useState({});
  
  const initialFormState = {
    health_issue: '', 
    duration_days: 30, 
    notes: '',
    num_medicines: 1,
    medicines: [
      { name: '', dosage: '', reminder_times: [ { time: '08:00', quantity: '1', food_timing: 'After Food' } ] }
    ],
    diabetes_type: 'Type 1',
    has_additional_medicines: false,
    insulin_type: 'Long-acting',
    insulin_name: '',
    insulin_dosage: 'As prescribed',
    insulin_schedule_time: '08:00',
    insulin_dose: '1',
    insulin_food_timing: 'Anytime',
    insulin_blood_sugar_log: 'Before food',
  };

  const [form, setForm] = useState(initialFormState);

  const getTimeOfDay = (timeStr) => {
    if(!timeStr) return 'Day';
    const hour = parseInt(timeStr.split(':')[0], 10);
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Afternoon';
    if (hour >= 17 && hour < 21) return 'Evening';
    return 'Night';
  };

  const toggleIssue = (issue) => {
    setExpandedIssues(prev => ({ ...prev, [issue]: !prev[issue] }));
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const dueMed = medications.find(med => {
        const times = parseReminderTimes(med.reminder_times);
        const matchingSchedule = times.find(t => t.time === currentTime);
        if (matchingSchedule) {
          const timeOfDay = getTimeOfDay(currentTime);
          const recentLog = logs.find(l => 
            l.medication_id === med.id && 
            new Date(l.scheduled_time).toLocaleDateString() === now.toLocaleDateString() &&
            l.time_of_day === timeOfDay
          );
          if(!recentLog) {
             med.due_time_of_day = timeOfDay;
             med.due_schedule = matchingSchedule;
             return true;
          }
        }
        return false;
      });

      if (dueMed && !activeAlert) {
        setActiveAlert(dueMed);
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [medications, logs, activeAlert]);

  const fetchMedications = async () => {
    try {
      const meds = await getAll('medications');
      const activeMeds = meds.filter(m => m.active !== false);
      setMedications(activeMeds);
      const allLogs = await getAll('medication_logs');
      setLogs(allLogs.filter(log => activeMeds.some(m => m.id === log.medication_id)));
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.health_issue.trim()) {
      alert('Please enter a health issue.');
      return;
    }

    const isDiabetes = form.health_issue?.toLowerCase()?.includes('diabetes');
    const isType1 = isDiabetes && form.diabetes_type === 'Type 1';

    if (isType1) {
      if (!form.insulin_name.trim()) {
        alert('Please enter an Insulin name.');
        return;
      }
    }

    if (!isType1 || form.has_additional_medicines) {
      const hasValidMed = form.medicines.some(m => m.name.trim() !== '');
      if (!hasValidMed) {
        alert('Please enter at least one medicine name.');
        return;
      }
    }

    setLoading(true);
    try {
      let finalNotes = form.notes;
      if (isType1 && (!finalNotes || !finalNotes.trim())) {
        finalNotes = "Insulin injection, not tablet. Take only as prescribed. Do not change dose or timing without doctor advice.";
      }

      if (isType1) {
        await add('medications', {
          name: form.insulin_name,
          health_issue: form.health_issue,
          dosage: form.insulin_dosage,
          reminder_times: [
            { 
              time: form.insulin_schedule_time, 
              quantity: form.insulin_dose, 
              food_timing: form.insulin_food_timing,
              type: 'Injection',
              insulin_type: form.insulin_type,
              blood_sugar_log: form.insulin_blood_sugar_log
            }
          ],
          duration_days: parseInt(form.duration_days) || 30,
          notes: finalNotes,
          active: true,
          created_at: new Date().toISOString()
        });
      }

      if (!isType1 || form.has_additional_medicines) {
        for (const med of form.medicines) {
          if (!med.name.trim()) continue; // skip empty medicine blocks

          await add('medications', {
            name: med.name,
            health_issue: form.health_issue,
            dosage: med.dosage,
            reminder_times: med.reminder_times,
            duration_days: parseInt(form.duration_days) || 30,
            notes: finalNotes,
            active: true,
            created_at: new Date().toISOString()
          });
        }
      }
      setShowModal(false);
      setForm(initialFormState);
      fetchMedications();
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to add medications.');
    }
    setLoading(false);
  };

  const deleteMedication = async (id) => {
    if (window.confirm("Delete this medication?")) {
      try {
        await remove('medications', id);
        fetchMedications();
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const logMedication = async (id, taken, specificTimeOfDay = null) => {
    try {
      const now = new Date();
      const timeOfDayStr = specificTimeOfDay || getTimeOfDay(`${now.getHours()}:${now.getMinutes()}`);
      await add('medication_logs', { 
        medication_id: id, 
        taken, 
        scheduled_time: now.toISOString(),
        time_of_day: timeOfDayStr
      });
      if (activeAlert?.id === id) setActiveAlert(null);
      fetchMedications();
    } catch (error) {
      console.error('Log error:', error);
    }
  };

  const handleNumMedicinesChange = (e) => {
    const num = parseInt(e.target.value) || 1;
    const currentMeds = [...form.medicines];
    if (num > currentMeds.length) {
      for (let i = currentMeds.length; i < num; i++) {
        currentMeds.push({ name: '', dosage: '', reminder_times: [{ time: '08:00', quantity: '1', food_timing: 'After Food' }] });
      }
    } else if (num < currentMeds.length) {
      currentMeds.splice(num);
    }
    setForm({ ...form, num_medicines: num, medicines: currentMeds });
  };

  const updateMedicine = (mIndex, field, value) => {
    const meds = [...form.medicines];
    meds[mIndex][field] = value;
    setForm({ ...form, medicines: meds });
  };

  const addMedicineSchedule = (mIndex) => {
    const meds = [...form.medicines];
    meds[mIndex].reminder_times.push({ time: '12:00', quantity: '1', food_timing: 'After Food' });
    setForm({ ...form, medicines: meds });
  };

  const updateMedicineSchedule = (mIndex, sIndex, field, value) => {
    const meds = [...form.medicines];
    meds[mIndex].reminder_times[sIndex][field] = value;
    setForm({ ...form, medicines: meds });
  };

  const removeMedicineSchedule = (mIndex, sIndex) => {
    const meds = [...form.medicines];
    meds[mIndex].reminder_times = meds[mIndex].reminder_times.filter((_, i) => i !== sIndex);
    setForm({ ...form, medicines: meds });
  };

  const parseReminderTimes = (times) => {
    if (!times) return [];
    let parsed = times;
    if (typeof times === 'string') {
      try { parsed = JSON.parse(times); } catch { return []; }
    }
    return parsed.map(t => {
      // Legacy support
      if (typeof t === 'string') return { time: t, quantity: '1', food_timing: 'Anytime' };
      return t;
    });
  };

  const getAdherenceData = () => {
    const data = [];
    for(let i=6; i>=0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString();
      const dayLogs = logs.filter(l => new Date(l.scheduled_time).toLocaleDateString() === dateStr);
      const taken = dayLogs.filter(l => l.taken).length;
      const total = dayLogs.length;
      let healthRate = 100;
      if (total > 0) {
        healthRate = Math.round((taken / total) * 100);
      } else if (i < 6 && data.length > 0) {
        healthRate = data[data.length-1].healthRate;
      }
      data.push({ name: d.toLocaleDateString('en-US', { weekday: 'short' }), healthRate });
    }
    return data;
  };

  const activeMedsToday = medications.filter(med => {
      if (!med.duration_days) return true;
      const startDate = new Date(med.created_at || Date.now());
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + med.duration_days);
      return new Date() <= endDate;
  });

  const groupedMedsToday = activeMedsToday.reduce((acc, med) => {
    const issue = med.health_issue || 'General Health';
    if (!acc[issue]) acc[issue] = [];
    acc[issue].push(med);
    return acc;
  }, {});

  return (
    <div className="p-6">
      {activeAlert && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Bell className="w-8 h-8 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Time for Medication!</h2>
            <p className="text-xl font-bold text-teal-600 mb-1">{activeAlert.name} {activeAlert.dosage ? `(${activeAlert.dosage})` : ''}</p>
            <p className="text-sm text-gray-500 mb-4">Health Issue: {activeAlert.health_issue}</p>
            <div className="bg-gray-50 rounded-lg p-3 mb-6 flex flex-col gap-2">
               <span className="font-bold text-lg text-gray-800">{activeAlert.due_schedule?.quantity} {activeAlert.due_schedule?.type === 'Injection' ? 'Injection(s)' : 'Pill(s)'}</span>
               <span className="font-bold text-orange-600 bg-orange-100 py-1 rounded">{activeAlert.due_schedule?.food_timing}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={() => logMedication(activeAlert.id, true, activeAlert.due_time_of_day)} className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 shadow-lg flex items-center justify-center gap-2">
                <Check className="w-5 h-5" /> Taken
              </button>
              <button onClick={() => logMedication(activeAlert.id, false, activeAlert.due_time_of_day)} className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 shadow-lg flex items-center justify-center gap-2">
                <X className="w-5 h-5" /> Skip
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Medication Reminders</h1>
          <p className="text-gray-500">Manage your medications and track adherence</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Medication
        </button>
      </div>

      <div className="flex gap-4 border-b mb-6">
        {[
          { id: 'today', icon: Calendar, label: 'Today' },
          { id: 'history', icon: History, label: 'History' },
          { id: 'adherence', icon: BarChart3, label: 'Adherence' },
        ].map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`tab-btn flex items-center gap-2 pb-3 ${activeTab === id ? 'active border-b-2 border-teal-600 text-teal-600 font-medium' : 'text-gray-500'}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'adherence' && (
        <div className="stat-card p-6">
          <h2 className="text-xl font-bold mb-2">Health Adherence Rate</h2>
          <p className="text-gray-500 text-sm mb-6">See how skipping medications affects your overall health rate.</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getAdherenceData()}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value) => [`${value}%`, 'Health Rate']} />
                <Line type="monotone" dataKey="healthRate" stroke="#0d9488" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="stat-card p-6">
          <h2 className="text-xl font-bold mb-6">Medication History Logs</h2>
          <div className="space-y-6">
            {Object.entries(
              logs.sort((a,b) => new Date(b.scheduled_time) - new Date(a.scheduled_time))
                  .reduce((acc, log) => {
                     const d = new Date(log.scheduled_time).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                     if(!acc[d]) acc[d] = [];
                     acc[d].push(log);
                     return acc;
                  }, {})
            ).map(([date, dayLogs]) => (
              <div key={date}>
                <h3 className="font-bold text-gray-700 border-b pb-2 mb-3">{date}</h3>
                <div className="space-y-2">
                  {dayLogs.map((log, i) => {
                    const med = medications.find(m => m.id === log.medication_id);
                    const medName = med ? med.name : 'Deleted Medicine';
                    return (
                      <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-md text-sm border border-gray-100">
                        <span className="text-gray-700">
                          <strong>{medName}</strong> scheduled for <span className="lowercase font-medium">{log.time_of_day || 'the day'}</span> 
                          <span className={log.taken ? "text-green-600 font-bold ml-1" : "text-red-600 font-bold ml-1"}>
                            {log.taken ? 'taken' : 'avoided'}
                          </span>
                        </span>
                        <span className="text-gray-400 text-xs">{new Date(log.scheduled_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            {logs.length === 0 && <p className="text-gray-500 text-center py-4">No history logs yet.</p>}
          </div>
        </div>
      )}

      {activeTab === 'today' && (
        <div className="stat-card p-6">
          {activeMedsToday.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">No active medications scheduled for today</p>
              <button onClick={() => setShowModal(true)} className="btn-primary mx-auto mt-4">
                <Plus className="w-4 h-4" /> Add Medication
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedMedsToday).map(([issue, meds]) => {
                const isExpanded = expandedIssues[issue];
                return (
                  <div key={issue} className="bg-white border border-teal-100 rounded-xl overflow-hidden shadow-sm">
                    <button 
                      onClick={() => toggleIssue(issue)}
                      className="w-full bg-teal-50/50 px-4 py-4 border-b border-teal-100 flex items-center justify-between hover:bg-teal-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <h3 className="text-lg font-bold text-teal-800 tracking-wide uppercase">{issue} <span className="ml-2 text-xs font-normal text-teal-600 bg-teal-100/50 px-2 py-0.5 rounded-full">{meds.length} Medicine{meds.length > 1 ? 's' : ''}</span></h3>
                      </div>
                      <div className="text-teal-600">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="p-4 space-y-4">
                        {meds.map(med => {
                          const times = parseReminderTimes(med.reminder_times);
                          return (
                            <div key={med.id} className="flex flex-col p-4 bg-gray-50 rounded-lg border border-gray-100">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <p className="font-semibold text-lg text-gray-800">{med.name}</p>
                                    {med.dosage && <p className="text-sm text-gray-600">{med.dosage}</p>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => deleteMedication(med.id)} className="p-2 bg-red-50 text-red-400 rounded-lg hover:bg-red-100" title="Delete Medication">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              {times.length > 0 && (
                                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-200">
                                  {times.map((schedule, i) => {
                                     const timeOfDay = getTimeOfDay(schedule.time);
                                     const todayLog = logs.find(l => 
                                       l.medication_id === med.id && 
                                       new Date(l.scheduled_time).toLocaleDateString() === new Date().toLocaleDateString() &&
                                       l.time_of_day === timeOfDay
                                     );
                                     return (
                                        <div key={i} className="flex flex-wrap items-center justify-between gap-2 bg-white p-2 rounded border border-gray-200 shadow-sm">
                                           <div className="flex flex-wrap items-center gap-2">
                                             <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded font-bold flex items-center gap-1">
                                               <Clock className="w-3 h-3" /> {schedule.time} ({timeOfDay})
                                             </span>
                                             <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                               {schedule.quantity} {schedule.type === 'Injection' ? 'Injection(s)' : 'Pill(s)'}
                                             </span>
                                             <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                               {schedule.food_timing}
                                             </span>
                                           </div>
                                           {todayLog && (
                                              <span className={`text-xs px-2 py-1 rounded border shadow-sm font-semibold ${todayLog.taken ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                 {todayLog.taken ? `Taken` : `Skipped`}
                                              </span>
                                           )}
                                           {!todayLog && (
                                              <div className="flex items-center gap-1 ml-2">
                                                <button onClick={() => logMedication(med.id, true, timeOfDay)} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200" title="Take (Tick)">
                                                  <Check className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => logMedication(med.id, false, timeOfDay)} className="p-1.5 bg-orange-100 text-orange-600 rounded hover:bg-orange-200" title="Skip/Decline">
                                                  <X className="w-4 h-4" />
                                                </button>
                                              </div>
                                           )}
                                        </div>
                                     )
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="stat-card w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center gap-2 mb-6">
              <Plus className="w-6 h-6 text-teal-600" />
              <h2 className="text-xl font-bold">Add Treatment Plan</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Health Issue (Reason) *</label>
                    <input type="text" value={form.health_issue} onChange={e => setForm({ ...form, health_issue: e.target.value })} className="input-field bg-white" placeholder="e.g., Fever, Diabetes" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Tenure (Duration in Days)</label>
                    <input type="number" min="1" max="365" value={form.duration_days} onChange={e => setForm({ ...form, duration_days: e.target.value })} className="input-field bg-white" placeholder="e.g., 30" required />
                  </div>
                </div>

                {form.health_issue?.toLowerCase()?.includes('diabetes') && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">What type of diabetes?</label>
                    <select value={form.diabetes_type} onChange={e => setForm({...form, diabetes_type: e.target.value})} className="input-field bg-white w-1/2">
                      <option value="Type 1">Type 1</option>
                      <option value="Type 2">Type 2</option>
                    </select>
                  </div>
                )}

                {(form.health_issue?.toLowerCase()?.includes('diabetes') && form.diabetes_type === 'Type 1') && (
                  <div className="mt-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                     <h3 className="font-bold text-blue-800 mb-3 text-sm tracking-wide uppercase border-b border-blue-200 pb-2">Insulin Treatment</h3>
                     <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">Treatment Type</label>
                           <input type="text" value="Insulin" readOnly className="input-field bg-gray-100" />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">Insulin Type</label>
                           <select value={form.insulin_type} onChange={e => setForm({...form, insulin_type: e.target.value})} className="input-field bg-white">
                              <option>Long-acting</option>
                              <option>Rapid-acting</option>
                              <option>Short-acting</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">Insulin Name *</label>
                           <input type="text" value={form.insulin_name} onChange={e => setForm({...form, insulin_name: e.target.value})} className="input-field bg-white" placeholder="e.g., Lantus" required={(form.health_issue?.toLowerCase()?.includes('diabetes') && form.diabetes_type === 'Type 1')} />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">Dosage / Units</label>
                           <input type="text" value={form.insulin_dosage} onChange={e => setForm({...form, insulin_dosage: e.target.value})} className="input-field bg-white" placeholder="As prescribed" />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">Schedule Time</label>
                           <input type="time" value={form.insulin_schedule_time} onChange={e => setForm({...form, insulin_schedule_time: e.target.value})} className="input-field bg-white" required={(form.health_issue?.toLowerCase()?.includes('diabetes') && form.diabetes_type === 'Type 1')} />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">Dose (Injection)</label>
                           <input type="number" min="1" value={form.insulin_dose} onChange={e => setForm({...form, insulin_dose: e.target.value})} className="input-field bg-white" required={(form.health_issue?.toLowerCase()?.includes('diabetes') && form.diabetes_type === 'Type 1')} />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">Food Timing</label>
                           <select value={form.insulin_food_timing} onChange={e => setForm({...form, insulin_food_timing: e.target.value})} className="input-field bg-white" required={(form.health_issue?.toLowerCase()?.includes('diabetes') && form.diabetes_type === 'Type 1')}>
                              <option>Anytime</option>
                              <option>Before food</option>
                              <option>After food</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-600 mb-1">Blood Sugar Log</label>
                           <select value={form.insulin_blood_sugar_log} onChange={e => setForm({...form, insulin_blood_sugar_log: e.target.value})} className="input-field bg-white" required={(form.health_issue?.toLowerCase()?.includes('diabetes') && form.diabetes_type === 'Type 1')}>
                              <option>Before food</option>
                              <option>After food</option>
                              <option>Bedtime</option>
                           </select>
                        </div>
                     </div>
                  </div>
                )}

                {(form.health_issue?.toLowerCase()?.includes('diabetes') && form.diabetes_type === 'Type 1') && (
                  <div className="mt-4 flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="has_additional_medicines" 
                      checked={form.has_additional_medicines} 
                      onChange={e => setForm({...form, has_additional_medicines: e.target.checked})}
                      className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                    />
                    <label htmlFor="has_additional_medicines" className="text-sm font-medium cursor-pointer">I have other medicines to take</label>
                  </div>
                )}

                {(!(form.health_issue?.toLowerCase()?.includes('diabetes') && form.diabetes_type === 'Type 1') || form.has_additional_medicines) && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">How many medicines for this issue?</label>
                    <input type="number" min="1" max="10" value={form.num_medicines} onChange={handleNumMedicinesChange} className="input-field bg-white w-1/2" required={!(form.health_issue?.toLowerCase()?.includes('diabetes') && form.diabetes_type === 'Type 1') || form.has_additional_medicines} />
                  </div>
                )}
              </div>

              {(!(form.health_issue?.toLowerCase()?.includes('diabetes') && form.diabetes_type === 'Type 1') || form.has_additional_medicines) && (
                <div className="space-y-4">
                {form.medicines.map((med, mIndex) => (
                  <div key={mIndex} className="p-4 border border-gray-200 bg-white rounded-xl shadow-sm">
                    <h3 className="font-bold text-teal-800 mb-3 text-sm tracking-wide uppercase border-b pb-2">Medicine {mIndex + 1}</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Medicine Name *</label>
                        <input type="text" value={med.name} onChange={e => updateMedicine(mIndex, 'name', e.target.value)} className="input-field" placeholder="e.g., Metformin" required />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Dosage (Optional)</label>
                        <input type="text" value={med.dosage} onChange={e => updateMedicine(mIndex, 'dosage', e.target.value)} className="input-field" placeholder="e.g., 500mg" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-gray-700">Tablet Schedules</label>
                        <button type="button" onClick={() => addMedicineSchedule(mIndex)} className="text-xs font-semibold text-teal-600 hover:bg-teal-50 px-2 py-1 rounded transition-colors flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Add Time
                        </button>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        {med.reminder_times.map((schedule, sIndex) => (
                          <div key={sIndex} className="bg-gray-50 border border-gray-200 p-2 rounded-lg relative">
                            {med.reminder_times.length > 1 && (
                              <button type="button" onClick={() => removeMedicineSchedule(mIndex, sIndex)} className="absolute top-1.5 right-1.5 text-gray-400 hover:text-red-500">
                                <X className="w-4 h-4" />
                              </button>
                            )}
                            <div className="grid grid-cols-3 gap-2 pr-6">
                              <div>
                                <label className="text-[10px] font-semibold text-gray-500 block mb-1 uppercase">Time</label>
                                <input type="time" value={schedule.time} onChange={e => updateMedicineSchedule(mIndex, sIndex, 'time', e.target.value)} className="input-field py-1 px-2 text-xs" required />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-gray-500 block mb-1 uppercase">Pills</label>
                                <input type="number" min="1" value={schedule.quantity} onChange={e => updateMedicineSchedule(mIndex, sIndex, 'quantity', e.target.value)} className="input-field py-1 px-2 text-xs" required />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-gray-500 block mb-1 uppercase">Food</label>
                                <select value={schedule.food_timing} onChange={e => updateMedicineSchedule(mIndex, sIndex, 'food_timing', e.target.value)} className="input-field py-1 px-2 text-xs" required>
                                  <option>Before Food</option>
                                  <option>After Food</option>
                                  <option>With Food</option>
                                  <option>Anytime</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} placeholder={(form.health_issue?.toLowerCase()?.includes('diabetes') && form.diabetes_type === 'Type 1') ? "Insulin injection, not tablet. Take only as prescribed. Do not change dose or timing without doctor advice." : "Any special instructions for this treatment plan..."} />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 text-gray-700">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 btn-primary justify-center disabled:opacity-50">
                  {loading ? 'Adding Treatment...' : 'Save Treatment Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
