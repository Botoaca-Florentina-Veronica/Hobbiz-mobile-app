const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ error: 'Acces neautorizat' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log('Token primit:', token);
    console.log('🔍 Verificare token în middleware auth:', token);
    console.log('🔍 JWT_SECRET utilizat:', process.env.JWT_SECRET);
    
    if (!token) {
      return res.status(401).json({ error: 'Acces neautorizat' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId || decoded.id; // <-- Fix pentru Google OAuth
    
    // Actualizează lastSeen pentru utilizatorul autentificat
    try {
      await User.findByIdAndUpdate(req.userId, { lastSeen: new Date() });
    } catch (updateError) {
      console.log('Eroare la actualizarea lastSeen:', updateError);
      // Nu oprește execuția pentru această eroare
    }
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalid' });
  }
};