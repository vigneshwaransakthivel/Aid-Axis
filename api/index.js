// Simple API handler - Data is stored in browser's IndexedDB
// This API is kept for compatibility but all data operations happen client-side

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Return success for all requests - actual data is in IndexedDB
  return res.status(200).json({ 
    message: 'Data is stored locally in your browser using IndexedDB',
    note: 'All operations happen client-side for persistence'
  });
}
