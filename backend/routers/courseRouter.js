import express from 'express';
import { 
    createCourse,
    getAllCourses,
    getCourseById,
    getCoursesByInstructor,
    updateCourse,
    deleteCourse,
    updateCourseStatus,
    getCoursesByCategory,
    getFeaturedCourses,
    updateCourseContent,
    updateCourseQuizzes,
    getCourseContent,
    getCourseQuizzes,
    addIntegratedCourseData,
    getCompleteCourseData,
    // Legacy functions for compatibility
    addCourseContent,
    addCourseQuiz
} from '../controllers/courseController.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = 'uploads/courses';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration for course thumbnails
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Destination folder relative to server root
        cb(null, 'uploads/courses'); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Save file with original extension
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure Multer instance with better error handling
const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 10 * 1024 * 1024 // Max 10MB
    },
    fileFilter: (req, file, cb) => {
        console.log('File upload attempt:', {
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype
        });
        
        // Check if it's an image file
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            // Error handling for non-image files
            cb(new Error('Only image files are allowed for the thumbnail!'), false);
        }
    }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File too large. Maximum size is 10MB.'
            });
        }
        return res.status(400).json({
            message: 'File upload error: ' + err.message
        });
    } else if (err) {
        return res.status(400).json({
            message: err.message
        });
    }
    next();
};

const courseRouter = express.Router();

// Basic CRUD operations with image upload support
courseRouter.post("/", upload.single('thumbnail'), handleMulterError, createCourse);
courseRouter.get("/", getAllCourses);
courseRouter.get("/featured", getFeaturedCourses);
courseRouter.get("/category/:category", getCoursesByCategory);
courseRouter.get("/instructor/:instructorId", getCoursesByInstructor);
courseRouter.get("/:courseId", getCourseById);
courseRouter.put("/:courseId", upload.single('thumbnail'), handleMulterError, updateCourse);
courseRouter.patch("/:courseId/status", updateCourseStatus);
courseRouter.delete("/:courseId", deleteCourse);

// NEW: Specific content and quiz management routes
courseRouter.put("/:courseId/content", updateCourseContent);
courseRouter.put("/:courseId/quizzes", updateCourseQuizzes);
courseRouter.get("/:courseId/content", getCourseContent);
courseRouter.get("/:courseId/quiz-data", getCourseQuizzes);

// Legacy routes for backward compatibility
courseRouter.post("/:courseId/content", addCourseContent);
courseRouter.post("/:courseId/quiz", addCourseQuiz);
courseRouter.get("/:courseId/quizzes", getCourseQuizzes);

// Integrated data management routes
courseRouter.post("/:courseId/integrated", addIntegratedCourseData);
courseRouter.get("/:courseId/complete", getCompleteCourseData);

export default courseRouter;