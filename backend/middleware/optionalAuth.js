const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId || decoded.id;
      } catch (error) {
        // Token invalid, dar continuăm fără autentificare
        console.log('Token invalid în optionalAuth, continuăm fără autentificare');
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};
