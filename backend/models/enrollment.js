import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
     courseName: {
        type: String,
        required: true,
        trim: true
    },
    studentName: {
        type: String,
        required: true,
        trim: true
    },
    studentEmail: {
        type: String,
        required: true,
        trim: true
    },
    enrollmentStatus: {
        type: String,
        required: true,
        enum: ['ENROLLED', 'NOT ENROLLMENT', 'COMPLETED', 'DROPPED', 'SUSPENDED', 'IN PROGRESS'],
        default: "NOT ENROLLMENT"
    },
    grade: {
        type: String,
        default: "Not Given"
    },
    enrollmentDate: {
        type: Date,
        default: Date.now
    },
    completionDate: {
        type: Date,
        default: null
    },
    progress: {
        type: Number, 
        default: 0 // percentage
    }
   
})

const Enrollment = mongoose.model("enrollments",enrollmentSchema)

export default Enrollment;


