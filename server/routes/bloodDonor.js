const express = require('express');
const { prepare } = require('../database');

const router = express.Router();

// Get all blood requests
router.get('/requests', (req, res) => {
  try {
    const { bloodGroup, status } = req.query;
    let query = 'SELECT * FROM blood_requests WHERE 1=1';
    const params = [];

    if (bloodGroup && bloodGroup !== 'All') {
      query += ' AND blood_group = ?';
      params.push(bloodGroup);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';
    const requests = prepare(query).all(...params);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create blood request
router.post('/requests', (req, res) => {
  try {
    const { patient_name, blood_group, units_needed, hospital, location, contact, urgency, notes } = req.body;
    const result = prepare(`
      INSERT INTO blood_requests (patient_name, blood_group, units_needed, hospital, location, contact, urgency, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(patient_name, blood_group, units_needed || 1, hospital, location, contact, urgency || 'normal', notes);
    
    const request = prepare('SELECT * FROM blood_requests WHERE id = ?').get(result.lastInsertRowid);
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update request status
router.put('/requests/:id', (req, res) => {
  try {
    const { status } = req.body;
    prepare('UPDATE blood_requests SET status = ? WHERE id = ?').run(status, req.params.id);
    
    const request = prepare('SELECT * FROM blood_requests WHERE id = ?').get(req.params.id);
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete request
router.delete('/requests/:id', (req, res) => {
  try {
    prepare('DELETE FROM blood_requests WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stats
router.get('/stats', (req, res) => {
  try {
    const stats = prepare(`
      SELECT 
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'fulfilled' THEN 1 END) as fulfilled,
        COUNT(CASE WHEN urgency = 'critical' AND status = 'active' THEN 1 END) as critical,
        COUNT(*) as total
      FROM blood_requests
    `).get();
    
    res.json(stats || { active: 0, fulfilled: 0, critical: 0, total: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
