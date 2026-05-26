import { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Trash2, Download, Pill, FlaskConical, Scan, Brain, Syringe, FolderOpen } from 'lucide-react';
import { getAll, add, remove, saveFile, downloadFile, deleteFile } from '../utils/db';

const CATEGORIES = [
  { id: 'prescription', label: 'Prescription', icon: Pill },
  { id: 'lab_report', label: 'Lab Report', icon: FlaskConical },
  { id: 'xray_scan', label: 'X-Ray / Scan', icon: Scan },
  { id: 'ct_mri_scan', label: 'CT/MRI Scan', icon: Brain },
  { id: 'vaccination', label: 'Vaccination', icon: Syringe },
  { id: 'other', label: 'Other', icon: FolderOpen },
];

export default function HealthLocker() {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('prescription');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const docs = await getAll('health_documents');
      setDocuments(docs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      
      // Calculate stats
      const cats = { prescription: 0, lab_report: 0, xray_scan: 0, ct_mri_scan: 0, vaccination: 0, other: 0 };
      docs.forEach(d => { if (cats.hasOwnProperty(d.category)) cats[d.category]++; });
      setStats(cats);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileData = event.target.result;
        
        // Save document metadata
        const doc = await add('health_documents', {
          name: file.name,
          category: selectedCategory,
          type: file.type,
          file_size: file.size
        });
        
        // Save file data separately
        await saveFile(doc.id, fileData, file.name, file.type);
        
        setShowModal(false);
        fetchData();
        setUploading(false);
      };
      reader.onerror = () => {
        alert('Failed to read file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload document. Please try again.');
      setUploading(false);
    }
  };

  const deleteDocument = async (id) => {
    try {
      await remove('health_documents', id);
      await deleteFile(id);
      fetchData();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete document.');
    }
  };

  const handleDownload = async (id) => {
    await downloadFile(id);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Digital Health Locker</h1>
          <p className="text-gray-500">Securely store and organize your health documents (up to 50MB per file)</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Upload className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        {CATEGORIES.map(({ id, label, icon: Icon }) => (
          <div key={id} className="stat-card text-center">
            <div className="w-10 h-10 mx-auto mb-2 bg-gray-100 rounded-lg flex items-center justify-center">
              <Icon className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-2xl font-bold">{stats[id] || 0}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Documents List */}
      <div className="stat-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-600" />
          Your Documents
        </h3>
        
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">No documents uploaded yet</p>
            <p className="text-sm text-gray-400 mb-4">Upload your first health document to get started</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">
              <Upload className="w-4 h-4" /> Upload Document
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map(doc => {
              const category = CATEGORIES.find(c => c.id === doc.category);
              const Icon = category?.icon || FileText;
              return (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-gray-500">
                        {category?.label || 'Other'} • {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleDownload(doc.id)} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200" title="Download">
                      <Download className="w-5 h-5" />
                    </button>
                    <button onClick={() => deleteDocument(doc.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200" title="Delete">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="stat-card w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Upload Document</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Document Category</label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setSelectedCategory(id)}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      selectedCategory === id ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-teal-500 transition-colors"
            >
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-1">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-400">PDF, JPG, PNG, DOC up to 50MB</p>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleUpload}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
              />
            </div>

            {uploading && <div className="mt-4 text-center text-teal-600">Uploading...</div>}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
