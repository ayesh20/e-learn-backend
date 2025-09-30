import express from 'express';
import { 
    createContactus,
    getContactus,
    getContactusByEmail,
    deleteContactus
} from '../controllers/contactuscontroller.js';

const contactRouter = express.Router();

// Create contact message
contactRouter.post("/", createContactus);

// Get all contact messages
contactRouter.get("/", getContactus);

// Get contact message by email
contactRouter.get("/:email", getContactusByEmail);

// Delete contact message by ID
contactRouter.delete("/:id", deleteContactus);

export default contactRouter;