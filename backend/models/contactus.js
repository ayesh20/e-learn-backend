import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            'Please provide a valid email address'
        ]
    },
    
    comment: {
        type: String,
        default: "NOT GIVEN",
        trim: true,
        maxlength: [1000, 'Comment cannot exceed 1000 characters']
    }
}, {
    timestamps: true // This adds createdAt and updatedAt fields automatically
});

// Create index on email for faster queries
contactSchema.index({ email: 1 });

// Create index on createdAt for sorting
contactSchema.index({ createdAt: -1 });

const Contact = mongoose.model("contacts", contactSchema);

export default Contact;