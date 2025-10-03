const Dental = require('../models/Dental');
const Appointment = require('../models/Appointment');

//@des Get all dentals
//@route GET /api/v1/dentals
//@access Public
exports.getDentals = async(req, res,next) => {
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
    // query = Dental.find(JSON.parse(queryStr));
    query = Dental.find(reqQuery).populate('appointments');

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

        const total = await Dental.countDocuments();
        query = query.skip(startIndex).limit(limit);
        // Executing query
        const dentals = await query;
        // const dentals = await Dental.find(req.query);
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
            count: dentals.length,
            pagination,
            data: dentals
});} catch (error) {
        res.status(400).json({
            success: false,
        });
    }
};

//@des Get single dental
//@route GET /api/v1/dentals/:id
//@access Public
exports.getDental = async(req, res,next) => {
    try{
        const dental = await Dental.findById(req.params.id);
        if (!dental) {
            return res.status(400).json({
                success: false,
            });
        }

        res.status(200).json({
            success: true,
            data: dental
    });
} catch (error) {
        res.status(400).json({
            success: false,
        });
    }
};

//@des Create a dental
//@route POST /api/v1/dentals
//@access Private
exports.createDental = async (req, res,next) => {
    // console.log(req.body);
    const dental = await Dental.create(req.body);
    res.status(201).json({
        success: true,
        data: dental
});
};

//@des Update single dental
//@route PUT /api/v1/dentals/:id
//@access Private
exports.updateDental = async (req, res,next) => {
    try{

        const dental = await Dental.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!dental) {
            return res.status(400).json({
                success: false,
            });
        }
        res.status(200).json({
            success: true,
            data: dental
        });
} catch (error) {
        res.status(400).json({
            success: false,
        });
    }
};

//@des Delete single dental
//@route DELETE /api/v1/dentals/:id
//@access Private
exports.deleteDental = async(req, res,next) => {
    try{
        // const dental = await Dental.findByIdAndDelete(req.params.id);
        const dental = await Dental.findById(req.params.id);

        if (!dental) {
            return res.status(404).json({
                success: false,
                message: 'Dental not found with the id of ${req.params.id}'});
            }
        // Delete associated appointments
        await Appointment.deleteMany({ dental: req.params.id });
        await dental.deleteOne({_id: req.params.id});
        

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