const express = require('express');
const { getDentals, getDental, createDental, updateDental, deleteDental } = require('../controllers/dentals');
// const { getDentals, getDental, createDental, updateDental, deleteDental } = require('../controllers/dentals');
// ...existing code...

//Include other resource routers
const bookingsRouter = require('./bookings');

const router = express.Router();

const {protect,authorize} = require('../middleware/auth');

//re-route into other resource routers
router.use('/:dentalId/bookings',bookingsRouter);
// const app=express();
router.route('/')
    .get(getDentals) // Get all dentals
    .post(protect,authorize('admin'),createDental); // Create a dental
router.route('/:id')
    .get(getDental) // Get single dental
    .put(protect,authorize('admin'),updateDental) // Update single dental
    .delete(protect,authorize('admin'),deleteDental); // Delete single dental

module.exports = router;