const Appointment = require('../models/Appointment');
const Hospital = require('../models/Hospital');

//@des Get all appointments
//@route GET /api/v1/appointments
//@access Public
exports.getAppointments = async(req, res,next) => {
    let query;
    //General user can see only his/her appointments
    if(req.user.role !== 'admin'){
        query = Appointment.find({user: req.user.id}).populate({
            path: 'hospital',
            select: 'name province tel'
            });
    } else{ //Admin can see all appointments
        if(req.params.hospitalId){
            console.log(req.params.hospitalId);
            query = Appointment.find({hospital: req.params.hospitalId}).populate({
                path: 'hospital',
                select: 'name province tel'
            });
        } else
            query = Appointment.find().populate({
                path: 'hospital',
                select: 'name province tel'
            }); 
    }
    try{
        const appointments = await query;
        res.status(200).json({
            success: true,
            count: appointments.length,
            data: appointments
    });
    } catch (err) {
        console.log(err.stack);
        return res.status(500).json({
            success: false,
            msg:"Cannot find appointment"
        });
    }
};


//@des Get single appointment
//@route GET /api/v1/appointments/:id
//@access Public
exports.getAppointment = async(req, res,next) => {
    try{
        const appointment = await Appointment.findById(req.params.id).populate({
            path: 'hospital',
            select: 'name description tel'
        });

        if(!appointment){
            return res.status(404).json({
                success: false,
                msg:`No appointment with the id of ${req.params.id}`
            });
        }

        res.status(200).json({
            success: true,
            data: appointment
        });
    } catch (err) {
        console.log(err.stack);
        return res.status(500).json({
            success: false,
            msg:"Cannot find appointment"
        });
    }
};

//@des Add appointment
//@route POST /api/v1/hospitals/:hospitalId/appointments
//@access Private
exports.addAppointment = async(req, res,next) => {
    try{
        // recive hospitalId from URL
        req.body.hospital = req.params.hospitalId;

        const hospital = await Hospital.findById(req.params.hospitalId);

        if(!hospital){
            return res.status(404).json({
                success: false,
                msg:`No hospital with the id of ${req.params.hospitalId}`
            });
        }

        // Add user to req.body
        req.body.user = req.user.id;
        // Check for existing appointment
        const existingAppointment = await Appointment.find({user: req.user.id});
        // if the user is not an admin, they can only create 3 appointments
        if(existingAppointment.length >= 3 && req.user.role !== 'admin'){
            return res.status(400).json({
                success: false,
                msg:`The user with ID ${req.user.id} has already made 3 appointments`
            });
        }

        const appointment = await Appointment.create(req.body);

        res.status(200).json({
            success: true,
            data: appointment
        });
    } catch (err) {
        console.log(err.stack);
        return res.status(500).json({
            success: false,
            msg:"Cannot create appointment"
        });
    }
}

//@des Update appointment
//@route PUT /api/v1/appointments/:id
//@access Private
exports.updateAppointment = async(req, res,next) => {
    try{
        let appointment = await Appointment.findById(req.params.id);

        if(!appointment){
            return res.status(404).json({
                success: false,
                msg:`No appointment with the id of ${req.params.id}`
            });
        }

        // Make sure user is appointment owner
        if(appointment.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({
                success: false,
                msg:'User not authorized to update this appointment'
            });
        }

        appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: appointment
        });
    }   catch (err) {
        console.log(err.stack);
        return res.status(500).json({
            success: false,
            msg:"Cannot update appointment"
        });
    }
};

//@des Delete appointment
//@route DELETE /api/v1/appointments/:id
//@access Private
exports.deleteAppointment = async(req, res,next) => {
    try{
        const appointment = await Appointment.findById(req.params.id);

        if(!appointment){
            return res.status(404).json({
                success: false,
                msg:`No appointment with the id of ${req.params.id}`
            });
        }

        // Make sure user is appointment owner
        if(appointment.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({
                success: false,
                msg:'User not authorized to delete this appointment'
            });
        }

        await appointment.deleteOne();
        // await appointment.remove();

        res.status(200).json({
            success: true,
            data: {}
        });
    }   catch (err) {
        console.log(err.stack);
        return res.status(500).json({
            success: false,
            msg:"Cannot delete appointment"
        });
    }
};