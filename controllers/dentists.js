const Dentist = require('../models/Dentist');
const Booking = require('../models/Booking');
const AuditLog = require('../models/AuditLog');

//@des Get all dentists
//@route GET /api/v1/dentists
//@access Public
exports.getDentists = async(req, res,next) => {
    let query;
    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);
    console.log(reqQuery);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);    // ...existing code...
    
    // Convert operators in reqQuery
    Object.keys(reqQuery).forEach(key => {
        const match = key.match(/^(.+)\[(gt|gte|lt|lte|in)\]$/);
        if (match) {
            reqQuery[match[1]] = { [`$${match[2]}`]: reqQuery[key] };
            delete reqQuery[key];
        }
    });

    // Finding resource
    // query = Dentist.find(JSON.parse(queryStr));
    query = Dentist.find(reqQuery).populate('bookings');

    // Select Fields
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }
    // Sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    try {

        const total = await Dentist.countDocuments();
        query = query.skip(startIndex).limit(limit);
        // Executing query
        const dentists = await query;
        // const dentists = await Dentist.find(req.query);
        // console.log(req.query);

        // Pagination result
        const pagination = {};
        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            }
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            }
        }

        res.status(200).json({
            success: true,
            count: dentists.length,
            pagination,
            data: dentists
});} catch (error) {
        res.status(400).json({
            success: false,
        });
    }
};

//@des Get single dentist
//@route GET /api/v1/dentists/:id
//@access Public
exports.getDentist = async(req, res,next) => {
    try{
        const dentist = await Dentist.findById(req.params.id);
        if (!dentist) {
            return res.status(400).json({
                success: false,
            });
        }

        res.status(200).json({
            success: true,
            data: dentist
    });
} catch (error) {
        res.status(400).json({
            success: false,
        });
    }
};

//@des Create a dentist
//@route POST /api/v1/dentists
//@access Private
exports.createDentist = async (req, res,next) => {
    try{
        // console.log(req.body);
        const dentist = await Dentist.create(req.body);
        await AuditLog.create({
            actionType: 'Created_Dentist',
            adminID: req.user.id,
            // details: `Dentist ${dentist._id} created`
            details:{dentistId:dentist._id}
            // details:{ dentistId: Types.ObjectId(req.params.id) }
        });
    
        res.status(201).json({
            success: true,
            data: dentist
    });
} catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
};

//@des Update single dentist
//@route PUT /api/v1/dentists/:id
//@access Private
exports.updateDentist = async (req, res,next) => {
    try{

        const dentist = await Dentist.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!dentist) {
            return res.status(400).json({
                success: false,
            });
        }

        await AuditLog.create({
            actionType: 'Updated_Dentist',
            adminID: req.user.id,
            // details: `Dentist ${dentist._id} updated`
            details:{dentistId:dentist._id}
        });

        res.status(200).json({
            success: true,
            data: dentist
        });
} catch (error) {
        res.status(400).json({
            success: false,
        });
    }
};

//@des Delete single dentist
//@route DELETE /api/v1/dentists/:id
//@access Private
exports.deleteDentist = async(req, res,next) => {
    try{
        // const dentist = await Dentist.findByIdAndDelete(req.params.id);
        const dentist = await Dentist.findById(req.params.id);

        if (!dentist) {
            return res.status(404).json({
                success: false,
                message: 'Dentist not found with the id of ${req.params.id}'});
            }
        // Delete associated bookings
        await Booking.deleteMany({ dentist: req.params.id });
        // await dentist.deleteOne({_id: req.params.id});
        await dentist.deleteOne();
        await AuditLog.create({
            actionType: 'Deleted_Dentist',
            adminID: req.user.id,
            // details: `Dentist ${dentist._id} deleted`
            // details:{dentistId:req.params.id}
            details:{dentistId:dentist._id}
        });
        

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(400).json({
            success: false,
        });
    }
};