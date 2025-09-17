import mongoose from 'mongoose';

const instructorSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    phone: {
        type: String,
        default: "NOT GIVEN"
    },
    role: {
        type: String,
        default: "instructor" // Fixed the typo
    },
    bio: {
        type: String,
        default: ''
    },
    expertise: [{
        type: String,
        trim: true
    }],
    experience: {
        type: Number, // in years
        default: 0
    },
    qualification: {
        type: String,
        default: ''
    },
    profileImage: {
        type: String,
        default: null
    },
    socialLinks: {
        linkedin: String,
        twitter: String,
        website: String
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    rating: {
        average: {
            type: Number,
            default: 0
        },
        count: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

const Instructor = mongoose.model("instructores", instructorSchema);
export default Instructor;