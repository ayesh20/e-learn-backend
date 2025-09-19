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
    getFeaturedCourses
} from '../controllers/courseController.js';

const courseRouter = express.Router();

courseRouter.post("/", createCourse);

courseRouter.get("/", getAllCourses);

courseRouter.get("/featured", getFeaturedCourses);

courseRouter.get("/category/:category", getCoursesByCategory);

courseRouter.get("/instructor/:instructorId", getCoursesByInstructor);

courseRouter.get("/:courseId", getCourseById);

courseRouter.put("/:courseId", updateCourse);

courseRouter.patch("/:courseId/status", updateCourseStatus);

courseRouter.delete("/:courseId", deleteCourse);

export default courseRouter;