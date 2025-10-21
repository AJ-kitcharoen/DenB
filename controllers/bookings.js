const Booking = require('../models/Booking');
const Dentist = require('../models/Dentist');
const generateInvoice = require('../utils/generateInvoice');
const AuditLog = require('../models/AuditLog');

//@des Get all bookings
//@route GET /api/v1/bookings
//@access Public
exports.getBookings = async(req, res,next) => {

    let query;

        //General user can see only his/her bookings
    if(req.user.role !== 'admin'){
        query = Booking.find({user: req.user.id}).populate({
            path: 'dentist',
            select: 'name province tel'
            });
    } else{ //Admin can see all bookings
        if(req.params.dentistId){
            console.log(req.params.dentistId);
            query = Booking.find({dentist: req.params.dentistId}).populate({
                path: 'dentist',
                select: 'name province tel'
            });
        } else
            query = Booking.find().populate({
                path: 'dentist',
                select: 'name province tel'
            }); 
    }
    try{
        const bookings = await query;
        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
    });
    } catch (err) {
        console.log(err.stack);
        return res.status(500).json({
            success: false,
            msg:"Cannot find booking"
        });
    }
};


//@des Get single booking
//@route GET /api/v1/bookings/:id
//@access Private
exports.getBooking = async(req, res,next) => {
    try{
        const booking = await Booking.findById(req.params.id).populate({
            path: 'dentist',
            select: 'name description tel'
        });

        if(!booking){
            return res.status(404).json({
                success: false,
                msg:`No booking with the id of ${req.params.id}`
            });
        }

        // Only allow owner or admin to access
        // if (booking.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
        //     return res.status(401).json({ success: false, msg: 'Not authorized' });
        // }
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
             return res.status(401).json({ success: false, msg: 'Not authorized' });
         }

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (err) {
        console.log(err.stack);
        return res.status(500).json({
            success: false,
            msg:"Cannot find booking"
        });
    }
};

//@des Add booking
//@route POST /api/v1/dentists/:dentistId/bookings
//@access Private
exports.addBooking = async(req, res,next) => {
    try{
        // recive dentistId from URL
        req.body.dentist = req.params.dentistId;

        const dentist = await Dentist.findById(req.params.dentistId);

        if(!dentist){
            return res.status(404).json({
                success: false,
                msg:`No dentist with the id of ${req.params.dentistId}`
            });
        }

        // Add user to req.body
        req.body.user = req.user.id;
        // Check for existing booking
        // const existingBooking = await Booking.find({user: req.user.id});
        // // if the user is not an admin, they can only create 1 booking
        // if(existingBooking.length >= 1 && req.user.role !== 'admin'){
        //     return res.status(400).json({
        //         success: false,
        //         msg:`The user with ID ${req.user.id} has already made a booking`
        //     });
        // }
        const dup = await Booking.findOne({ dentist: req.params.dentistId });
        if (dup) {
        return res.status(409).json({ success: false, msg: 'This dentist already has a booking' });
        }

        const booking = await Booking.create(req.body);

        // Populate user for the invoice
        const user = req.user;

        // Generate PDF invoice
        // generateInvoice(booking, dentist, user);
        try { await generateInvoice(booking, dentist, req.user); }
         catch (e) { console.error('[invoice] failed:', e); }

        if(req.user.role === 'admin'){
            await AuditLog.create({
                actionType: 'Create_Booking',
                // user: req.user.id,
                adminID: req.user.id,
                // details: `Admin ${req.user.id} created a booking ${booking._id} for user ${booking.user}`
                // details:{dentistID:req.params.id}
                details: {
                    bookingId: booking._id,
                    dentistId: req.params.dentistId
                }
            });

        }

        res.status(201).json({
            success: true,
            data: booking
        });
    } catch (err) {
        console.log(err.stack);
        return res.status(500).json({
            success: false,
            msg:"Cannot create a booking",
            message: err.message
        });
    }
}

//@des Update booking
//@route PUT /api/v1/bookings/:id
//@access Private
exports.updateBooking = async(req, res,next) => {
    try{
        let booking = await Booking.findById(req.params.id);

        if(!booking){
            return res.status(404).json({
                success: false,
                msg:`No booking with the id of ${req.params.id}`
            });
        }

        // Make sure user is booking owner
        if(booking.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({
                success: false,
                msg:'User not authorized to update this booking'
            });
        }

        booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if(req.user.role === 'admin'){
            await AuditLog.create({
                actionType: 'Update_Booking',
                adminID: req.user.id,
                // details: `Admin ${req.user.id} updated booking ${booking._id} for user ${booking.user}`
                // details:{dentistID:req.params.id}
                details: { bookingId: booking._id }
            });
        }

        res.status(200).json({
            success: true,
            data: booking
        });
    }   catch (err) {
        console.log(err.stack);
        return res.status(500).json({
            success: false,
            msg:"Cannot update booking"
        });
    }
};

//@des Delete booking
//@route DELETE /api/v1/bookings/:id
//@access Private
exports.deleteBooking = async(req, res,next) => {
    try{
        const booking = await Booking.findById(req.params.id);

        if(!booking){
            return res.status(404).json({
                success: false,
                msg:`No booking with the id of ${req.params.id}`
            });
        }

        // Make sure user is booking owner
        if(booking.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({
                success: false,
                msg:'User not authorized to delete this booking'
            });
        }

        await booking.deleteOne();
        // await booking.remove();

        if(req.user.role === 'admin'){
            await AuditLog.create({
                actionType: 'Delete_Booking',
                adminID: req.user.id,
                // details: `Admin ${req.user.id} deleted booking ${booking._id} for user ${booking.user}`
                // details:{dentistID:req.params.id}
                details:{ bookingId: booking._id }
            });
        }

        res.status(200).json({
            success: true,
            data: {}
        });
    }   catch (err) {
        console.log(err.stack);
        return res.status(500).json({
            success: false,
            msg:"Cannot delete booking"
        });
    }
};