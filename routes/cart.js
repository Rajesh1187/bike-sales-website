// routes/cart.js
const express = require('express');
const router = express.Router();
const Bike = require('../models/Bike');
const Order = require('../models/Order');
const { ensureAuthenticated } = require('../config/auth');

// Add to Cart
router.post('/add', ensureAuthenticated, async (req, res) => {
    const { bikeId, quantity } = req.body;
    const qty = parseInt(quantity, 10);

    try {
        const bike = await Bike.findById(bikeId);
        if (!bike) {
            req.flash('error_msg', 'Bike not found.');
            return res.redirect('/bikes');
        }

        if (qty <= 0 || qty > bike.stock) {
            req.flash('error_msg', `Invalid quantity. Available stock: ${bike.stock}`);
            return res.redirect(`/bikes/${bikeId}`);
        }

        // Initialize cart in session if it doesn't exist
        if (!req.session.cart) {
            req.session.cart = [];
        }

        // Check if item already in cart
        const existingItemIndex = req.session.cart.findIndex(item => item.bike._id.toString() === bikeId);

        if (existingItemIndex > -1) {
            // Update quantity if already in cart, ensure it doesn't exceed stock
            const newQty = req.session.cart[existingItemIndex].quantity + qty;
            if (newQty > bike.stock) {
                req.flash('error_msg', `Cannot add more. Exceeds available stock of ${bike.stock}.`);
                return res.redirect(`/bikes/${bikeId}`);
            }
            req.session.cart[existingItemIndex].quantity = newQty;
        } else {
            // Add new item to cart
            req.session.cart.push({
                bike: bike.toObject(), // Convert Mongoose document to plain object
                quantity: qty
            });
        }
        req.flash('success_msg', `${qty} x ${bike.name} added to cart!`);
        res.redirect('/cart');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error adding to cart.');
        res.redirect(`/bikes/${bikeId}`);
    }
});

// View Cart
router.get('/', ensureAuthenticated, (req, res) => {
    const cart = req.session.cart || [];
    let totalAmount = 0;
    cart.forEach(item => {
        totalAmount += item.bike.price * item.quantity;
    });
    res.render('cart/index', { cart, totalAmount: totalAmount.toFixed(2) });
});

// Remove from Cart
router.post('/remove/:bikeId', ensureAuthenticated, (req, res) => {
    const { bikeId } = req.params;
    if (req.session.cart) {
        req.session.cart = req.session.cart.filter(item => item.bike._id.toString() !== bikeId);
        req.flash('success_msg', 'Item removed from cart.');
    }
    res.redirect('/cart');
});

// Update Cart Quantity
router.post('/update/:bikeId', ensureAuthenticated, async (req, res) => {
    const { bikeId } = req.params;
    const { quantity } = req.body;
    const newQty = parseInt(quantity, 10);

    if (newQty <= 0) {
        return res.redirect(`/cart`); // Can remove item by setting quantity to 0
    }

    try {
        const bike = await Bike.findById(bikeId);
        if (!bike) {
            req.flash('error_msg', 'Bike not found for update.');
            return res.redirect('/cart');
        }

        if (newQty > bike.stock) {
            req.flash('error_msg', `Cannot update. Exceeds available stock of ${bike.stock}.`);
            return res.redirect('/cart');
        }

        if (req.session.cart) {
            const itemIndex = req.session.cart.findIndex(item => item.bike._id.toString() === bikeId);
            if (itemIndex > -1) {
                req.session.cart[itemIndex].quantity = newQty;
                req.flash('success_msg', 'Cart quantity updated.');
            }
        }
        res.redirect('/cart');
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error updating cart.');
        res.redirect('/cart');
    }
});

// Checkout Form (or directly to checkout)
router.get('/checkout', ensureAuthenticated, (req, res) => {
    const cart = req.session.cart || [];
    if (cart.length === 0) {
        req.flash('error_msg', 'Your cart is empty.');
        return res.redirect('/cart');
    }
    let totalAmount = 0;
    cart.forEach(item => {
        totalAmount += item.bike.price * item.quantity;
    });
    res.render('cart/checkout', { cart, totalAmount: totalAmount.toFixed(2), user: req.user });
});

// Place Order
router.post('/place-order', ensureAuthenticated, async (req, res) => {
    const cart = req.session.cart || [];
    if (cart.length === 0) {
        req.flash('error_msg', 'Your cart is empty. Cannot place order.');
        return res.redirect('/cart');
    }

    let totalAmount = 0;
    const orderItems = [];

    try {
        for (const cartItem of cart) {
            const bike = await Bike.findById(cartItem.bike._id);
            if (!bike) {
                req.flash('error_msg', `Error: Bike "${cartItem.bike.name}" not found.`);
                return res.redirect('/cart');
            }
            if (bike.stock < cartItem.quantity) {
                req.flash('error_msg', `Not enough stock for "${bike.name}". Available: ${bike.stock}`);
                return res.redirect('/cart');
            }

            // Decrement stock
            bike.stock -= cartItem.quantity;
            await bike.save();

            totalAmount += bike.price * cartItem.quantity;
            orderItems.push({
                bike: bike._id,
                quantity: cartItem.quantity,
                priceAtOrder: bike.price
            });
        }

        const newOrder = new Order({
            user: req.user._id,
            items: orderItems,
            totalAmount: totalAmount,
            shippingAddress: {
                street: req.body.street,
                city: req.body.city,
                state: req.body.state,
                zip: req.body.zip,
                country: req.body.country,
            },
            paymentDetails: {
                method: 'Cash On Delivery', // Simple example, integrate Stripe/PayPal for real
                status: 'pending'
            }
        });

        await newOrder.save();
        req.session.cart = []; // Clear cart after successful order
        req.flash('success_msg', 'Order placed successfully! Your order number is: ' + newOrder._id);
        res.redirect('/orders'); // Redirect to orders history page
    } catch (err) {
        console.error(err);
        req.flash('error_msg', 'Error placing order. Please try again.');
        res.redirect('/cart');
    }
});

module.exports = router;
