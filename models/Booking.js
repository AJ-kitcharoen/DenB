const mongoose = require('mongoose');
const Dentist = require('./Dentist');

const BookingSchema = new mongoose.Schema({
    bookingDate: {
        type: Date,
        required:true
    },
    user:{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    dentist:{
        type: mongoose.Schema.ObjectId,
        ref: 'Dentist',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('booking', BookingSchema);