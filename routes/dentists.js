const express = require('express');
const { getDentists, getDentist, createDentist, updateDentist, deleteDentist } = require('../controllers/dentists');

//Include other resource routers
const bookingsRouter = require('./bookings');

const router = express.Router();

const {protect,authorize} = require('../middleware/auth');

//re-route into other resource routers
router.use('/:dentistId/bookings',bookingsRouter);

router.route('/')
    .get(getDentists) // Get all dentists
    .post(protect,authorize('admin'),createDentist); // Create a dentist
router.route('/:id')
    .get(getDentist) // Get single dentist
    .put(protect,authorize('admin'),updateDentist) // Update single dentist
    .delete(protect,authorize('admin'),deleteDentist); // Delete single dentist

module.exports = router;