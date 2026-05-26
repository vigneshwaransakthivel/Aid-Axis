import { useState } from 'react';
import { Calendar, Pill, BarChart3, Plus, X, Clock, Check } from 'lucide-react';
import { useMedications } from '../store/useStore';

export default function Medications() {
  const [activeTab, setActiveTab] = useState('today');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: '', dosage: '', frequency: 'Once Daily', reminder_times: ['08:00'], notes: ''
  });

  const { medications, addMedication, deleteMedication, logMedication } = useMedications();

  const handleSubmit = (e) => {
    e.preventDefault();
    addMedication(form);
    setShowModal(false);
    setForm({ name: '', dosage: '', frequency: 'Once Daily', reminder_times: ['08:00'], notes: '' });
  };

  const addReminderTime = () => {
    setForm({ ...form, reminder_times: [...form.reminder_times, '12:00'] });
  };

  const updateReminderTime = (index, value) => {
    const times = [...form.reminder_times];
    times[index] = value;
    setForm({ ...form, reminder_times: times });
  };

  const removeReminderTime = (index) => {
    setForm({ ...form, reminder_times: form.reminder_times.filter((_, i) => i !== index) });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Medication Reminders</h1>
          <p className="text-gray-500">Manage your medications and track adherence</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Medication
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-6">
        {[
          { id: 'today', icon: Calendar, label: 'Today' },
          { id: 'all', icon: Pill, label: 'All Medications' },
          { id: 'adherence', icon: BarChart3, label: 'Adherence' },
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

      <div className="bg-white rounded-xl p-6 shadow-sm">
        {medications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Pill className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">No medications added yet</p>
            <p className="text-sm text-gray-400 mb-4">Add your first medication to get started</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">
              <Plus className="w-4 h-4" /> Add Medication
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {medications.map(med => {
              const times = Array.isArray(med.reminder_times) ? med.reminder_times : JSON.parse(med.reminder_times || '[]');
              return (
                <div key={med.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Pill className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium">{med.name}</p>
                      <p className="text-sm text-gray-500">{med.dosage} • {med.frequency}</p>
                      {times.length > 0 && (
                        <div className="flex gap-2 mt-1">
                          {times.map((time, i) => (
                            <span key={i} className="text-xs bg-teal-50 text-teal-600 px-2 py-0.5 rounded flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {time}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => logMedication(med.id, true)}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                      title="Mark as taken"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteMedication(med.id)}
                      className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Medication Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <Pill className="w-6 h-6 text-teal-600" />
              <h2 className="text-xl font-bold">Add New Medication</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Medicine Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g., Metformin" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Dosage</label>
                  <input type="text" value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} className="input-field" placeholder="e.g., 500mg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Frequency</label>
                <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} className="input-field">
                  <option>Once Daily</option>
                  <option>Twice Daily</option>
                  <option>Three Times Daily</option>
                  <option>Every 8 Hours</option>
                  <option>As Needed</option>
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium">Reminder Times</label>
                  <button type="button" onClick={addReminderTime} className="text-sm text-teal-600 hover:underline">+ Add Time</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.reminder_times.map((time, i) => (
                    <div key={i} className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1">
                      <input type="time" value={time} onChange={e => updateReminderTime(i, e.target.value)} className="bg-transparent border-none text-sm" />
                      {form.reminder_times.length > 1 && (
                        <button type="button" onClick={() => removeReminderTime(i)} className="text-gray-400 hover:text-red-500">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} placeholder="Any special instructions..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 btn-primary justify-center">Add Medication</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
