const express = require('express');
const { prepare } = require('../database');

const router = express.Router();

// Get all medications
router.get('/', (req, res) => {
  try {
    const medications = prepare('SELECT * FROM medications WHERE active = 1 ORDER BY created_at DESC').all();
    res.json(medications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add medication
router.post('/', (req, res) => {
  try {
    const { name, dosage, frequency, reminder_times, notes } = req.body;
    const result = prepare(`
      INSERT INTO medications (name, dosage, frequency, reminder_times, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, dosage, frequency || 'Once Daily', JSON.stringify(reminder_times || []), notes);
    
    const medication = prepare('SELECT * FROM medications WHERE id = ?').get(result.lastInsertRowid);
    res.json(medication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update medication
router.put('/:id', (req, res) => {
  try {
    const { name, dosage, frequency, reminder_times, notes, active } = req.body;
    prepare(`
      UPDATE medications 
      SET name = ?, dosage = ?, frequency = ?, reminder_times = ?, notes = ?, active = ?
      WHERE id = ?
    `).run(name, dosage, frequency, JSON.stringify(reminder_times || []), notes, active ? 1 : 0, req.params.id);
    
    const medication = prepare('SELECT * FROM medications WHERE id = ?').get(req.params.id);
    res.json(medication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete medication
router.delete('/:id', (req, res) => {
  try {
    prepare('DELETE FROM medications WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Log medication taken
router.post('/:id/log', (req, res) => {
  try {
    const { taken } = req.body;
    prepare(`
      INSERT INTO medication_logs (medication_id, scheduled_time, taken, taken_at)
      VALUES (?, datetime('now'), ?, datetime('now'))
    `).run(req.params.id, taken ? 1 : 0);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get today's schedule
router.get('/today', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const medications = prepare('SELECT * FROM medications WHERE active = 1').all();
    
    const logs = prepare(`
      SELECT * FROM medication_logs WHERE date(scheduled_time) = ?
    `).all(today);
    
    res.json({ medications, logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get adherence stats
router.get('/adherence', (req, res) => {
  try {
    const stats = prepare(`
      SELECT 
        date(scheduled_time) as date,
        COUNT(*) as total,
        SUM(taken) as taken
      FROM medication_logs
      WHERE scheduled_time >= date('now', '-30 days')
      GROUP BY date(scheduled_time)
      ORDER BY date
    `).all();
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
