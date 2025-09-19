import express from 'express';
import { 
    createInstructor,
    loginInstructor,
    getAllInstructors,
    getInstructorById,
    updateInstructor,
    deleteInstructor,
    updateInstructorPassword,
    searchInstructors
} from '../controllers/instructorController.js';

const instructorRouter = express.Router();

instructorRouter.post("/", createInstructor);

instructorRouter.post("/login", loginInstructor);

instructorRouter.get("/", getAllInstructors);

instructorRouter.get("/search", searchInstructors);

instructorRouter.get("/:instructorId", getInstructorById);

instructorRouter.put("/:instructorId", updateInstructor);

instructorRouter.patch("/:instructorId/password", updateInstructorPassword);

instructorRouter.delete("/:instructorId", deleteInstructor);

export default instructorRouter;