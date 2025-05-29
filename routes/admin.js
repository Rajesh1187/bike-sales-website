// routes/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Bike = require('../models/Bike');
const Order = require('../models/Order');
const { ensureAuthenticated, ensureAdmin } = require('../config/auth');

// Admin Dashboard Index
router.get('/', ensureAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalBikes = await Bike.countDocuments();
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: 'pending' });

        res.render('admin/dashboard', {
            totalUsers,
            totalBikes,
            totalOrders,
            pendingOrders
        });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching admin dashboard data.');
        res.redirect('/dashboard'); // Fallback to user dashboard
    }
});

// Manage Users (View all users)
router.get('/users', ensureAdmin, async (req, res) => {
    try {
        const users = await User.find({}).sort({ date: -1 });
        res.render('admin/users', { users });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching users.');
        res.redirect('/admin');
    }
});

// Change User Role (e.g., from user to admin)
router.post('/users/changerole/:id', ensureAdmin, async (req, res) => {
    const { role } = req.body; // 'user' or 'admin'
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            req.flash('error_msg', 'User not found.');
            return res.redirect('/admin/users');
        }
        user.role = role;
        await user.save();
        req.flash('success_msg', `${user.name}'s role updated to ${role}.`);
        res.redirect('/admin/users');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error changing user role.');
        res.redirect('/admin/users');
    }
});

// Delete User
router.post('/users/delete/:id', ensureAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'User deleted successfully.');
        res.redirect('/admin/users');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error deleting user.');
        res.redirect('/admin/users');
    }
});

// Manage Orders (View all orders, change status)
router.get('/orders', ensureAdmin, async (req, res) => {
    try {
        const orders = await Order.find({})
                                  .populate('user', 'name email') // Populate user info
                                  .populate('items.bike', 'name price') // Populate bike info for items
                                  .sort({ orderDate: -1 });
        res.render('admin/orders', { orders });
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error fetching orders.');
        res.redirect('/admin');
    }
});

// Change Order Status
router.post('/orders/updatestatus/:id', ensureAdmin, async (req, res) => {
    const { status } = req.body;
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            req.flash('error_msg', 'Order not found.');
            return res.redirect('/admin/orders');
        }
        order.status = status;
        await order.save();
        req.flash('success_msg', `Order #${order._id} status updated to ${status}.`);
        res.redirect('/admin/orders');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error updating order status.');
        res.redirect('/admin/orders');
    }
});

module.exports = router;
