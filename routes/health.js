const router = require('express').Router();

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
    message: 'Backend is running'
  });
});

module.exports = router; 