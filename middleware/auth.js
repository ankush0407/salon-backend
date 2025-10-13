const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

function requireOwner(req, res, next) {
  if (req.user.role !== 'OWNER') {
    return res.status(403).json({ message: 'Access denied. Owner only.' });
  }
  next();
}

module.exports = { authenticateToken, requireOwner };