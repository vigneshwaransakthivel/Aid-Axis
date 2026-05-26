const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { prepare } = require('../database');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

// Get all documents
router.get('/documents', (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM health_documents';
    const params = [];

    if (category && category !== 'all') {
      query += ' WHERE category = ?';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC';
    const documents = prepare(query).all(...params);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload document
router.post('/documents', upload.single('file'), (req, res) => {
  try {
    const { category } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = prepare(`
      INSERT INTO health_documents (name, type, category, file_path, file_size)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      file.originalname,
      file.mimetype,
      category || 'other',
      file.filename,
      file.size
    );

    const document = prepare('SELECT * FROM health_documents WHERE id = ?').get(result.lastInsertRowid);
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete document
router.delete('/documents/:id', (req, res) => {
  try {
    const doc = prepare('SELECT * FROM health_documents WHERE id = ?').get(req.params.id);
    
    if (doc && doc.file_path) {
      const filePath = path.join(uploadsDir, doc.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    prepare('DELETE FROM health_documents WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get document stats by category
router.get('/stats', (req, res) => {
  try {
    const stats = prepare(`
      SELECT 
        category,
        COUNT(*) as count
      FROM health_documents
      GROUP BY category
    `).all();

    const categories = {
      prescription: 0,
      lab_report: 0,
      xray_scan: 0,
      ct_mri_scan: 0,
      vaccination: 0,
      other: 0
    };

    stats.forEach(s => {
      if (categories.hasOwnProperty(s.category)) {
        categories[s.category] = s.count;
      }
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download document
router.get('/documents/:id/download', (req, res) => {
  try {
    const doc = prepare('SELECT * FROM health_documents WHERE id = ?').get(req.params.id);
    
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = path.join(uploadsDir, doc.file_path);
    res.download(filePath, doc.name);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
