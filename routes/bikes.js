// routes/bikes.js
const express = require('express');
const router = express.Router();
const Bike = require('../models/Bike');
const { ensureAuthenticated, ensureAdmin } = require('../config/auth'); // Import auth middleware

// Get all bikes (Public)
router.get('/', async (req, res) => {
    try {
        const bikes = await Bike.find({});
        res.render('bikes/index', { bikes });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Show single bike (Public)
router.get('/:id', async (req, res) => {
    try {
        const bike = await Bike.findById(req.params.id);
        if (!bike) {
            req.flash('error_msg', 'Bike not found');
            return res.redirect('/bikes');
        }
        res.render('bikes/show', { bike });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Add Bike Form (Admin Only)
router.get('/add', ensureAdmin, (req, res) => res.render('bikes/add'));

// Add Bike Handle (Admin Only)
router.post('/add', ensureAdmin, async (req, res) => {
    const { name, description, price, category, imageUrl, stock } = req.body;
    let errors = [];

    if (!name || !description || !price || !category || !stock) {
        errors.push({ msg: 'Please fill in all required fields' });
    }
    if (price < 0) {
        errors.push({ msg: 'Price cannot be negative' });
    }
    if (stock < 0) {
        errors.push({ msg: 'Stock cannot be negative' });
    }

    if (errors.length > 0) {
        res.render('bikes/add', {
            errors,
            name,
            description,
            price,
            category,
            imageUrl,
            stock
        });
    } else {
        try {
            const newBike = new Bike({
                name,
                description,
                price,
                category,
                imageUrl,
                stock,
                addedBy: req.user.id // Store the ID of the admin who added it
            });
            await newBike.save();
            req.flash('success_msg', 'Bike added successfully');
            res.redirect('/bikes');
        } catch (err) {
            console.error(err);
            res.status(500).send('Server Error');
        }
    }
});

// Edit Bike Form (Admin Only)
router.get('/edit/:id', ensureAdmin, async (req, res) => {
    try {
        const bike = await Bike.findById(req.params.id);
        if (!bike) {
            req.flash('error_msg', 'Bike not found');
            return res.redirect('/bikes');
        }
        res.render('bikes/edit', { bike });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching bike for edit');
        res.redirect('/bikes');
    }
});

// Update Bike Handle (Admin Only)
router.post('/edit/:id', ensureAdmin, async (req, res) => {
    const { name, description, price, category, imageUrl, stock } = req.body;
    let errors = [];

    if (!name || !description || !price || !category || !stock) {
        errors.push({ msg: 'Please fill in all required fields' });
    }
    if (price < 0) {
        errors.push({ msg: 'Price cannot be negative' });
    }
    if (stock < 0) {
        errors.push({ msg: 'Stock cannot be negative' });
    }

    if (errors.length > 0) {
        const bike = await Bike.findById(req.params.id); // Re-fetch for rendering
        res.render('bikes/edit', {
            errors,
            bike // Pass the original bike data
        });
    } else {
        try {
            await Bike.findByIdAndUpdate(req.params.id, {
                name,
                description,
                price,
                category,
                imageUrl,
                stock
            });
            req.flash('success_msg', 'Bike updated successfully');
            res.redirect('/bikes');
        } catch (err) {
            console.error(err);
            req.flash('error_msg', 'Error updating bike');
            res.redirect('/bikes');
        }
    }
});

// Delete Bike Handle (Admin Only)
router.post('/delete/:id', ensureAdmin, async (req, res) => {
    try {
        await Bike.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Bike removed successfully');
        res.redirect('/bikes');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error deleting bike');
        res.redirect('/bikes');
    }
});

module.exports = router;
