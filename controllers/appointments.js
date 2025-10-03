const Appointment = require('../models/Appointment');
const Dental = require('../models/Dental');

//@des Get all appointments
//@route GET /api/v1/appointments
//@access Public
exports.getAppointments = async(req, res,next) => {
    let query;
    //General user can see only his/her appointments
    if(req.user.role !== 'admin'){
        query = Appointment.find({user: req.user.id}).populate({
            path: 'dental',
            select: 'name province tel'
            });
    } else{ //Admin can see all appointments
        if(req.params.dentalId){
            console.log(req.params.dentalId);
            query = Appointment.find({dental: req.params.dentalId}).populate({
                path: 'dental',
                select: 'name province tel'
            });
        } else
            query = Appointment.find().populate({
                path: 'dental',
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
            path: 'dental',
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
//@route POST /api/v1/dentals/:dentalId/appointments
//@access Private
exports.addAppointment = async(req, res,next) => {
    try{
        // recive dentalId from URL
        req.body.dental = req.params.dentalId;

        const dental = await Dental.findById(req.params.dentalId);

        if(!dental){
            return res.status(404).json({
                success: false,
                msg:`No dental with the id of ${req.params.dentalId}`
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