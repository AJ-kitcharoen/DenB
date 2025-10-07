const mongoose = require('mongoose');
const Dental = require('./Dental');

const AppointmentSchema = new mongoose.Schema({
    apptDate: {
        type: Date,
        required:true
    },
    user:{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    dental:{
        type: mongoose.Schema.ObjectId,
        ref: 'Dental',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);