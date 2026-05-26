const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prepare } = require('../database');

const router = express.Router();
const JWT_SECRET = 'aidaxis-secret-key';

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)').run(email, hashedPassword, name);
    
    const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET);
    res.json({ token, user: { id: result.lastInsertRowid, email, name } });
  } catch (error) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
