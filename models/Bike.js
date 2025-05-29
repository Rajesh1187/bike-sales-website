// models/Bike.js
const mongoose = require('mongoose');
const BikeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    imageUrl: {
        type: String,
        default: '/images/default-bike.jpg' // A default image path
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    addedBy: { // To track which admin added the bike
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dateAdded: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Bike', BikeSchema);
