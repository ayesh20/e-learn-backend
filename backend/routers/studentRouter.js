import express from 'express';
import { 
    createStudent,
    loginStudent,
    getAllStudents,
    getStudentById,
    getStudentByStudentId,
    updateStudent,
    deleteStudent,
    updateStudentStatus,
    updateStudentPassword,
    searchStudents
} from '../controllers/studentController.js';

const studentRouter = express.Router();

// Create student (signup)
studentRouter.post("/", createStudent);

// Student login
studentRouter.post("/login", loginStudent);

// Get all students with filtering and pagination
studentRouter.get("/", getAllStudents);

// Search students
studentRouter.get("/search", searchStudents);

// Get student by custom student ID
studentRouter.get("/student-id/:studentId", getStudentByStudentId);

// Get student by MongoDB ID
studentRouter.get("/:studentId", getStudentById);

// Update student profile
studentRouter.put("/:studentId", updateStudent);

// Update student status
studentRouter.patch("/:studentId/status", updateStudentStatus);

// Update student password
studentRouter.patch("/:studentId/password", updateStudentPassword);

// Delete student
studentRouter.delete("/:studentId", deleteStudent);

export default studentRouter;