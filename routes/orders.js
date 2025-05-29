// routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { ensureAuthenticated } = require('../config/auth');

// Get user's orders
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
                                  .populate('items.bike') // Populate bike details for each item
                                  .sort({ orderDate: -1 }); // Sort by newest first
        res.render('orders/index', { orders });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching your orders.');
        res.redirect('/dashboard');
    }
});

// Get single order details
router.get('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.bike');
        if (!order || order.user.toString() !== req.user._id.toString()) {
            req.flash('error_msg', 'Order not found or unauthorized.');
            return res.redirect('/orders');
        }
        res.render('orders/show', { order });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching order details.');
        res.redirect('/orders');
    }
});

module.exports = router;
