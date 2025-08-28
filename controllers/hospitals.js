const Hospital = require('../models/Hospital');
const Appointment = require('../models/Appointment');

//@des Get all hospitals
//@route GET /api/v1/hospitals
//@access Public
exports.getHospitals = async(req, res,next) => {
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
    // query = Hospital.find(JSON.parse(queryStr));
    query = Hospital.find(reqQuery).populate('appointments');

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

        const total = await Hospital.countDocuments();
        query = query.skip(startIndex).limit(limit);
        // Executing query
        const hospitals = await query;
        // const hospitals = await Hospital.find(req.query);
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
            count: hospitals.length,
            pagination,
            data: hospitals
});} catch (error) {
        res.status(400).json({
            success: false,
        });
    }
};

//@des Get single hospital
//@route GET /api/v1/hospitals/:id
//@access Public
exports.getHospital = async(req, res,next) => {
    try{
        const hospital = await Hospital.findById(req.params.id);
        if (!hospital) {
            return res.status(400).json({
                success: false,
            });
        }

        res.status(200).json({
            success: true,
            data: hospital
    });
} catch (error) {
        res.status(400).json({
            success: false,
        });
    }
};

//@des Create a hospital
//@route POST /api/v1/hospitals
//@access Private
exports.createHospital = async (req, res,next) => {
    // console.log(req.body);
    const hospital = await Hospital.create(req.body);
    res.status(201).json({
        success: true,
        data: hospital
});
};

//@des Update single hospital
//@route PUT /api/v1/hospitals/:id
//@access Private
exports.updateHospital = async (req, res,next) => {
    try{

        const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!hospital) {
            return res.status(400).json({
                success: false,
            });
        }
        res.status(200).json({
            success: true,
            data: hospital
        });
} catch (error) {
        res.status(400).json({
            success: false,
        });
    }
};

//@des Delete single hospital
//@route DELETE /api/v1/hospitals/:id
//@access Private
exports.deleteHospital = async(req, res,next) => {
    try{
        // const hospital = await Hospital.findByIdAndDelete(req.params.id);
        const hospital = await Hospital.findById(req.params.id);

        if (!hospital) {
            return res.status(404).json({
                success: false,
                message: 'Hospital not found with the id of ${req.params.id}'});
            }
        // Delete associated appointments
        await Appointment.deleteMany({ hospital: req.params.id });
        await hospital.deleteOne({_id: req.params.id});
        

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