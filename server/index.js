const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase, prepare } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database and start server
initDatabase().then(() => {
  // Routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/nutrition', require('./routes/nutrition'));
  app.use('/api/medications', require('./routes/medications'));
  app.use('/api/blood-donor', require('./routes/bloodDonor'));
  app.use('/api/health-locker', require('./routes/healthLocker'));

  // Dashboard summary endpoint
  app.get('/api/dashboard', (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const todayCalories = prepare(`
        SELECT COALESCE(SUM(calories), 0) as total 
        FROM meals WHERE date(created_at) = ?
      `).get(today);
      
      const medicationAdherence = prepare(`
        SELECT 
          COUNT(CASE WHEN taken = 1 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as adherence
        FROM medication_logs WHERE date(scheduled_time) = ?
      `).get(today);
      
      const activeRequests = prepare(`
        SELECT COUNT(*) as count FROM blood_requests WHERE status = 'active'
      `).get();
      
      const documents = prepare(`
        SELECT COUNT(*) as count FROM health_documents
      `).get();
      
      const todayNutrition = prepare(`
        SELECT 
          COALESCE(SUM(protein), 0) as protein,
          COALESCE(SUM(fat), 0) as fat,
          COALESCE(SUM(sugar), 0) as sugar
        FROM meals WHERE date(created_at) = ?
      `).get(today);

      res.json({
        todayCalories: todayCalories?.total || 0,
        medicationAdherence: Math.round(medicationAdherence?.adherence || 0),
        activeRequests: activeRequests?.count || 0,
        documents: documents?.count || 0,
        nutrition: todayNutrition || { protein: 0, fat: 0, sugar: 0 }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
