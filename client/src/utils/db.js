// IndexedDB wrapper for persistent local storage (50MB+)

const DB_NAME = 'aidaxis_db';
const DB_VERSION = 3;

const STORES = ['meals', 'medications', 'medication_logs', 'health_assessments', 'blood_requests', 'health_documents', 'files'];

let db = null;

// Initialize IndexedDB
export function initDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      STORES.forEach(store => {
        if (!database.objectStoreNames.contains(store)) {
          database.createObjectStore(store, { keyPath: 'id', autoIncrement: true });
        }
      });
    };
  });
}

// Generic CRUD operations
export async function getAll(storeName) {
  await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function getById(storeName, id) {
  await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function add(storeName, data) {
  await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const record = { ...data, created_at: new Date().toISOString() };
    const request = store.add(record);
    request.onsuccess = () => resolve({ ...record, id: request.result });
    request.onerror = () => reject(request.error);
  });
}

export async function update(storeName, id, data) {
  await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const existing = getRequest.result;
      if (!existing) return reject(new Error('Not found'));
      const updated = { ...existing, ...data };
      const putRequest = store.put(updated);
      putRequest.onsuccess = () => resolve(updated);
      putRequest.onerror = () => reject(putRequest.error);
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function remove(storeName, id) {
  await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// File storage (for Health Locker - up to 50MB per file)
export async function saveFile(id, fileData, fileName, fileType) {
  await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    const store = tx.objectStore('files');
    const request = store.put({ id, data: fileData, name: fileName, type: fileType });
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function getFile(id) {
  await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readonly');
    const store = tx.objectStore('files');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteFile(id) {
  await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite');
    const store = tx.objectStore('files');
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// Helper to download file
export async function downloadFile(id) {
  const file = await getFile(id);
  if (!file || !file.data) {
    alert('File not found');
    return;
  }
  const link = document.createElement('a');
  link.href = file.data;
  link.download = file.name || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Calculate risk
export function calculateRisk(age, bmi, systolic, diastolic, fastingGlucose) {
  let riskScore = 0;
  const recommendations = [];
  if (age > 60) riskScore += 20;
  else if (age > 45) riskScore += 10;
  else if (age > 35) riskScore += 5;
  if (bmi >= 30) { riskScore += 25; recommendations.push('Consider a weight management program. A BMI of 30+ indicates obesity.'); }
  else if (bmi >= 25) { riskScore += 15; recommendations.push('Your BMI indicates overweight. Regular exercise and balanced diet recommended.'); }
  else if (bmi < 18.5) { riskScore += 10; recommendations.push('Your BMI is below normal. Consider consulting a nutritionist.'); }
  if (systolic >= 140 || diastolic >= 90) { riskScore += 25; recommendations.push('High blood pressure detected. Reduce sodium intake and consult a doctor.'); }
  else if (systolic >= 130 || diastolic >= 80) { riskScore += 15; recommendations.push('Elevated blood pressure. Monitor regularly and reduce stress.'); }
  if (fastingGlucose >= 126) { riskScore += 25; recommendations.push('High fasting glucose indicates diabetes risk. Consult an endocrinologist.'); }
  else if (fastingGlucose >= 100) { riskScore += 15; recommendations.push('Pre-diabetic glucose levels. Reduce sugar intake and exercise regularly.'); }
  let riskLevel = riskScore >= 60 ? 'High' : riskScore >= 35 ? 'Moderate' : 'Low';
  if (recommendations.length === 0) recommendations.push('Your health metrics look good! Continue maintaining a healthy lifestyle.');
  return { riskScore: Math.min(riskScore, 100), riskLevel, recommendations };
}
