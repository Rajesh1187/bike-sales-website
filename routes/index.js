// routes/index.js
const express = require('express');
const router = express.Router();

// Home Page Route
router.get('/', (req, res) => {
    res.render('index', { title: 'Bike Sales Home' });
});

module.exports = router;
