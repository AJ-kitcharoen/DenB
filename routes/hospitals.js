const express = require('express');
const { getHospitals, getHospital, createHospital, updateHospital, deleteHospital } = require('../controllers/hospitals');
// const { getHospitals, getHospital, createHospital, updateHospital, deleteHospital } = require('../controllers/hospitals');
// ...existing code...
const router = express.Router();

// const app=express();
router.route('/')
    .get(getHospitals) // Get all hospitals
    .post(createHospital); // Create a hospital
router.route('/:id')
    .get(getHospital) // Get single hospital
    .put(updateHospital) // Update single hospital
    .delete(deleteHospital); // Delete single hospital

module.exports = router;