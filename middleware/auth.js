const jwt = require('jsonwebtoken');

const JWT_SECRET = "x1c2v3b4n5m6,8k9j0h1g2f3d4s5a6";

const auth = async (req, res, next) => {
  try {
    console.log('Auth middleware - headers:', req.headers); // Debug log
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const verified = jwt.verify(token, JWT_SECRET);
    console.log('Verified token:', verified); // Debug log
    req.user = verified;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ message: 'Token verification failed, authorization denied' });
  }
};

module.exports = { auth, JWT_SECRET }; 