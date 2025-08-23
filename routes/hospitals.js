const express = require('express');
const { getHospitals, getHospital, createHospital, updateHospital, deleteHospital } = require('../controllers/hospitals');
// const { getHospitals, getHospital, createHospital, updateHospital, deleteHospital } = require('../controllers/hospitals');
// ...existing code...
const router = express.Router();

const {protect,authorize} = require('../middleware/auth');

// const app=express();
router.route('/')
    .get(getHospitals) // Get all hospitals
    .post(protect,authorize('admin'),createHospital); // Create a hospital
router.route('/:id')
    .get(getHospital) // Get single hospital
    .put(protect,authorize('admin'),updateHospital) // Update single hospital
    .delete(protect,authorize('admin'),deleteHospital); // Delete single hospital

module.exports = router;