const momgoose=require('mongoose');

const DentistSchema = new momgoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a dentist name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    yearsOfExperience: {
        type: Number,
        required: [true, 'Please add years of experience'],
        min: [0, 'Years must be >= 0']
    }, areaOfExpertise: {
        type: [{
        type: String,
        trim: true,
        enum: [
            'General Dentistry',
            'Orthodontics',
            'Endodontics',
            'Periodontics',
            'Prosthodontics',
            'Oral Surgery',
            'Pediatric Dentistry',
            'Implantology'
        ]
        }],
        required: [true, 'Please add at least one area of expertise'],
        default: ['General Dentistry'],           // ค่า default ถ้าไม่ส่งมา
        validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'Please add at least one area of expertise'
        },
        set: (arr) => Array.isArray(arr)
        ? [...new Set(arr.map(s => (s ?? '').trim()))].filter(Boolean) // trim + ลบค่าซ้ำ + ตัดค่าว่าง
        : arr
    },
    available: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }

},{
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

//Reverse populate with virtuals
DentistSchema.virtual('bookings', {
    ref: 'Booking',
    localField: '_id',
    foreignField: 'dentist',
    justOne: false
});

module.exports = momgoose.model('Dentist', DentistSchema, 'dentist');
// module.exports = momgoose.model('Dentist', DentistSchema);