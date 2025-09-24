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
    },
    // Enhanced fields for comprehensive content management
    content: [{
        title: String,
        subtitle: String,
        description: String,
        duration: Number, // in minutes
        pageNumber: Number,
        videos: [{
            url: String,
            title: String,
            description: String,
            duration: Number,
            type: String,
            size: Number,
            uploadDate: Date
        }],
        resources: [{
            url: String,
            title: String,
            description: String,
            type: String,
            size: Number,
            uploadDate: Date
        }],
        assignments: [{
            url: String,
            title: String,
            description: String,
            dueDate: Date,
            points: Number,
            type: String,
            size: Number,
            uploadDate: Date
        }]
    }],
    quizzes: [{
        id: Number,
        name: String,
        description: String,
        timeLimit: Number, // in minutes
        attempts: {
            type: Number,
            default: 3
        },
        passingScore: {
            type: Number,
            default: 70
        },
        questions: [{
            questionNumber: Number,
            question: String,
            type: {
                type: String,
                enum: ['multiple-choice', 'true-false', 'short-answer'],
                default: 'multiple-choice'
            },
            options: [String],
            correctAnswer: String,
            points: {
                type: Number,
                default: 1
            },
            explanation: String
        }],
        isActive: {
            type: Boolean,
            default: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    resources: [{
        title: String,
        description: String,
        url: String,
        type: String, // 'pdf', 'doc', 'video', 'link', etc.
        size: Number,
        downloadable: {
            type: Boolean,
            default: true
        },
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }],
    assignments: [{
        title: String,
        description: String,
        instructions: String,
        dueDate: Date,
        points: Number,
        submissionType: {
            type: String,
            enum: ['file', 'text', 'url'],
            default: 'file'
        },
        allowedFileTypes: [String],
        maxFileSize: Number, // in MB
        isGraded: {
            type: Boolean,
            default: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Course settings
    settings: {
        allowDiscussions: {
            type: Boolean,
            default: true
        },
        allowDownloads: {
            type: Boolean,
            default: true
        },
        certificateEnabled: {
            type: Boolean,
            default: false
        },
        language: {
            type: String,
            default: 'English'
        },
        difficulty: {
            type: String,
            enum: ['Easy', 'Medium', 'Hard'],
            default: 'Medium'
        }
    },
    // Course statistics
    statistics: {
        totalVideos: {
            type: Number,
            default: 0
        },
        totalResources: {
            type: Number,
            default: 0
        },
        totalAssignments: {
            type: Number,
            default: 0
        },
        totalQuizzes: {
            type: Number,
            default: 0
        },
        totalDuration: {
            type: Number,
            default: 0
        },
        completionRate: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Index for better query performance
courseSchema.index({ instructorId: 1, status: 1 });
courseSchema.index({ category: 1, level: 1 });
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Virtual for calculating course completion percentage
courseSchema.virtual('completionPercentage').get(function() {
    const totalItems = (this.content?.length || 0) + (this.quizzes?.length || 0);
    return totalItems > 0 ? Math.round((this.statistics.completionRate / totalItems) * 100) : 0;
});

// Pre-save middleware to update statistics
courseSchema.pre('save', function(next) {
    if (this.content) {
        this.statistics.totalVideos = this.content.reduce((total, item) => 
            total + (item.videos?.length || 0), 0);
        this.statistics.totalResources = this.content.reduce((total, item) => 
            total + (item.resources?.length || 0), 0);
        this.statistics.totalAssignments = this.content.reduce((total, item) => 
            total + (item.assignments?.length || 0), 0);
    }
    
    if (this.quizzes) {
        this.statistics.totalQuizzes = this.quizzes.length;
    }
    
    // Calculate total duration
    if (this.content) {
        this.statistics.totalDuration = this.content.reduce((total, item) => 
            total + (item.duration || 0), 0);
    }
    
    next();
});

const Course = mongoose.model("courses", courseSchema);
export default Course;