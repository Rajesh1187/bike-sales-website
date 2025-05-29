// models/Order.js
const mongoose = require('mongoose');
const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            bike: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Bike',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            priceAtOrder: { // Price at the time of order
                type: Number,
                required: true
            }
        }
    ],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        zip: String,
        country: String
    },
    paymentDetails: {
        method: String,
        transactionId: String,
        status: String // e.g., 'paid', 'failed'
    },
    orderDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', OrderSchema);
