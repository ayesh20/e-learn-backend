import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'instructores',
        required: true
    },
    category: {
        type: String,
        required: true,
        default: 'General'
    },
    duration: {
        type: Number, // in hours
        default: 0
    },
    price: {
        type: Number,
        default: 0
    },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner'
    },
    status: {
        type: String,
        enum: ['Draft', 'Published', 'Archived', 'Suspended'],
        default: 'Draft'
    },
    maxStudents: {
        type: Number,
        default: 50
    },
    enrollmentCount: {
        type: Number,
        default: 0
    },
    syllabus: [{
        title: String,
        description: String,
        duration: Number // in minutes
    }],
    requirements: [String],
    tags: [String],
    thumbnail: {
        type: String,
        default: null
    },
    isFeatured: {
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

const Course = mongoose.model("courses", courseSchema);
export default Course;
