import express from 'express';
import { 
    createEnrollment,
    getAllEnrollments,
    getEnrollmentById,
    getEnrollmentsByStudent,
    getEnrollmentsByCourse,
    updateEnrollment,
    deleteEnrollment,
    updateEnrollmentStatus,
    updateEnrollmentGrade,
    updateEnrollmentProgress,
    getEnrollmentStats,
    searchEnrollments
} from '../controllers/enrollmentController.js';

const enrollmentRouter = express.Router();

enrollmentRouter.post("/", createEnrollment);

enrollmentRouter.get("/", getAllEnrollments);

enrollmentRouter.get("/stats", getEnrollmentStats);

enrollmentRouter.get("/search", searchEnrollments);

enrollmentRouter.get("/student/:studentName", getEnrollmentsByStudent);

enrollmentRouter.get("/course/:courseName", getEnrollmentsByCourse);

enrollmentRouter.get("/:enrollmentId", getEnrollmentById);

enrollmentRouter.put("/:enrollmentId", updateEnrollment);

enrollmentRouter.patch("/:enrollmentId/status", updateEnrollmentStatus);

enrollmentRouter.patch("/:enrollmentId/grade", updateEnrollmentGrade);

enrollmentRouter.patch("/:enrollmentId/progress", updateEnrollmentProgress);

enrollmentRouter.delete("/:enrollmentId", deleteEnrollment);

export default enrollmentRouter;