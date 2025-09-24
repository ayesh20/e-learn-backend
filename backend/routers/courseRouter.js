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
    addCourseContent,
    addCourseQuiz,
    getCourseContent,
    getCourseQuizzes
} from '../controllers/courseController.js';

const courseRouter = express.Router();

// Basic CRUD operations
courseRouter.post("/", createCourse);
courseRouter.get("/", getAllCourses);
courseRouter.get("/featured", getFeaturedCourses);
courseRouter.get("/category/:category", getCoursesByCategory);
courseRouter.get("/instructor/:instructorId", getCoursesByInstructor);
courseRouter.get("/:courseId", getCourseById);
courseRouter.put("/:courseId", updateCourse);
courseRouter.patch("/:courseId/status", updateCourseStatus);
courseRouter.delete("/:courseId", deleteCourse);

// Content management routes
courseRouter.post("/:courseId/content", addCourseContent);
courseRouter.get("/:courseId/content", getCourseContent);

// Quiz management routes
courseRouter.post("/:courseId/quiz", addCourseQuiz);
courseRouter.get("/:courseId/quizzes", getCourseQuizzes);

export default courseRouter;