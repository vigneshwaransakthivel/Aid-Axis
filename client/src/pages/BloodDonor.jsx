import { useState, useEffect } from 'react';
import { Droplets, Plus, CheckCircle, AlertTriangle, Heart, X, Clock, Building, MapPin, Phone } from 'lucide-react';
import { getAll, add, update, remove } from '../utils/db';

const BLOOD_GROUPS = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const BLOOD_COMPATIBILITY = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-']
};

export default function BloodDonor() {
  const [requests, setRequests] = useState([]);
  const [fulfilledRequests, setFulfilledRequests] = useState([]);
  const [stats, setStats] = useState({ active: 0, fulfilled: 0, critical: 0, total: 0 });
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [viewMode, setViewMode] = useState('active');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    patient_name: '', blood_group: '', units_needed: 1, hospital: '', location: '', contact: '', urgency: 'normal', notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const allRequests = await getAll('blood_requests');
      
      let filtered = allRequests;
      if (filter !== 'All') {
        filtered = allRequests.filter(r => r.blood_group === filter);
      }
      
      setRequests(filtered.filter(r => r.status === 'active').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      setFulfilledRequests(filtered.filter(r => r.status === 'fulfilled').sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      
      setStats({
        active: allRequests.filter(r => r.status === 'active').length,
        fulfilled: allRequests.filter(r => r.status === 'fulfilled').length,
        critical: allRequests.filter(r => r.urgency === 'critical' && r.status === 'active').length,
        total: allRequests.length
      });
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await add('blood_requests', {
        patient_name: form.patient_name,
        blood_group: form.blood_group,
        units_needed: parseInt(form.units_needed) || 1,
        hospital: form.hospital,
        location: form.location,
        contact: form.contact,
        urgency: form.urgency,
        notes: form.notes,
        status: 'active'
      });
      setShowModal(false);
      setForm({ patient_name: '', blood_group: '', units_needed: 1, hospital: '', location: '', contact: '', urgency: 'normal', notes: '' });
      fetchData();
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit request. Please try again.');
    }
    setLoading(false);
  };

  const fulfillRequest = async (id) => {
    try {
      await update('blood_requests', id, { status: 'fulfilled' });
      setSelectedRequest(null);
      fetchData();
    } catch (error) {
      console.error('Fulfill error:', error);
      alert('Failed to mark as fulfilled. Please try again.');
    }
  };

  const deleteRequest = async (id) => {
    try {
      await remove('blood_requests', id);
      setSelectedRequest(null);
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const getCompatibleDonors = (bloodGroup) => BLOOD_COMPATIBILITY[bloodGroup]?.join(', ') || '';

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Blood Donor Platform</h1>
          <p className="text-gray-500">Connect blood donors with those in need</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div onClick={() => setViewMode('active')} className={`stat-card bg-gradient-to-r from-orange-50 to-white cursor-pointer transition-all ${viewMode === 'active' ? 'ring-2 ring-orange-400' : 'hover:shadow-md'}`}>
          <div className="flex items-center gap-3">
            <Droplets className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-orange-600">{stats.active}</p>
              <p className="text-sm text-gray-500">Active Requests</p>
            </div>
          </div>
        </div>
        <div onClick={() => setViewMode('fulfilled')} className={`stat-card bg-gradient-to-r from-green-50 to-white cursor-pointer transition-all ${viewMode === 'fulfilled' ? 'ring-2 ring-green-400' : 'hover:shadow-md'}`}>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.fulfilled}</p>
              <p className="text-sm text-gray-500">Fulfilled</p>
            </div>
          </div>
        </div>
        <div className="stat-card bg-gradient-to-r from-yellow-50 to-white">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.critical}</p>
              <p className="text-sm text-gray-500">Critical</p>
            </div>
          </div>
        </div>
        <div className="stat-card bg-gradient-to-r from-red-50 to-white">
          <div className="flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-500">Filter by Blood Group:</span>
        <div className="flex gap-1">
          {BLOOD_GROUPS.map(group => (
            <button key={group} onClick={() => setFilter(group)} className={`px-3 py-1 rounded-full text-sm ${filter === group ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {group}
            </button>
          ))}
        </div>
      </div>

      {/* Active Requests */}
      {viewMode === 'active' && (
        <div className="stat-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Active Requests
          </h3>
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Droplets className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No active blood requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req.id} onClick={() => setSelectedRequest(req)} className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${req.urgency === 'critical' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${req.urgency === 'critical' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                      {req.blood_group}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{req.patient_name || 'Patient'}</p>
                      <p className="text-sm text-gray-500">{req.units_needed} unit(s) needed</p>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        {req.hospital && <p className="flex items-center gap-2"><Building className="w-4 h-4 text-gray-400" />{req.hospital}</p>}
                        {req.location && <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{req.location}</p>}
                        {req.contact && <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" />{req.contact}</p>}
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {req.urgency !== 'normal' && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${req.urgency === 'critical' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                            <Clock className="w-3 h-3" />{req.urgency}
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">🩸 Compatible: {getCompatibleDonors(req.blood_group)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Fulfilled Requests */}
      {viewMode === 'fulfilled' && (
        <div className="stat-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Fulfilled Requests
          </h3>
          {fulfilledRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No fulfilled requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fulfilledRequests.map(req => (
                <div key={req.id} className="p-4 rounded-lg border border-green-200 bg-green-50">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm bg-green-100 text-green-600">{req.blood_group}</div>
                    <div>
                      <p className="font-semibold text-gray-800">{req.patient_name || 'Patient'}</p>
                      <p className="text-sm text-gray-500">{req.units_needed} unit(s) donated</p>
                      {req.hospital && <p className="flex items-center gap-2 text-sm text-gray-600 mt-1"><Building className="w-4 h-4 text-gray-400" />{req.hospital}</p>}
                      <div className="flex items-center gap-2 mt-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 bg-green-100 text-green-600">
                          <CheckCircle className="w-3 h-3" />Fulfilled
                        </span>
                        <span className="text-xs text-gray-400">{new Date(req.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="stat-card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${selectedRequest.urgency === 'critical' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                  {selectedRequest.blood_group}
                </div>
                <div>
                  <p className="font-semibold">{selectedRequest.patient_name || 'Patient'}</p>
                  <p className="text-sm text-gray-500">{selectedRequest.units_needed} unit(s) needed</p>
                </div>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 mb-4">
              {selectedRequest.hospital && <p className="flex items-center gap-2 text-gray-600"><Building className="w-4 h-4 text-gray-400" />{selectedRequest.hospital}</p>}
              {selectedRequest.location && <p className="flex items-center gap-2 text-gray-600"><MapPin className="w-4 h-4 text-gray-400" />{selectedRequest.location}</p>}
              {selectedRequest.contact && <p className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-gray-400" />{selectedRequest.contact}</p>}
            </div>
            <div className="flex items-center gap-2 mb-4">
              {selectedRequest.urgency !== 'normal' && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${selectedRequest.urgency === 'critical' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                  <Clock className="w-3 h-3" />{selectedRequest.urgency}
                </span>
              )}
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">🩸 Compatible: {getCompatibleDonors(selectedRequest.blood_group)}</span>
            </div>
            {selectedRequest.notes && <div className="bg-gray-50 rounded-lg p-3 mb-4"><p className="text-sm text-gray-600">{selectedRequest.notes}</p></div>}
            <div className="flex gap-3">
              <button onClick={() => fulfillRequest(selectedRequest.id)} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />Mark Fulfilled
              </button>
              <button onClick={() => setSelectedRequest(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="stat-card w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><Droplets className="w-5 h-5 text-red-500" />Create Blood Request</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Patient Name</label>
                  <input type="text" value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} className="input-field" placeholder="Full name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Blood Group</label>
                  <select value={form.blood_group} onChange={e => setForm({ ...form, blood_group: e.target.value })} className="input-field" required>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.slice(1).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Units Needed</label>
                  <input type="number" min="1" value={form.units_needed} onChange={e => setForm({ ...form, units_needed: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Urgency</label>
                  <select value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })} className="input-field">
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hospital Name</label>
                <input type="text" value={form.hospital} onChange={e => setForm({ ...form, hospital: e.target.value })} className="input-field" placeholder="Hospital or medical center" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="input-field" placeholder="City / Area" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Number</label>
                <input type="text" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} className="input-field" placeholder="Phone number" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Additional Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input-field" rows={3} placeholder="Any additional information..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg disabled:opacity-50">
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
