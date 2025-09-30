import Contact from "../models/contactus.js";
import dotenv from "dotenv";
dotenv.config();

// Create a new contact message
export async function createContactus(req, res) {
    try {
        const { name, email, comment } = req.body;

        // Validate required fields
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required"
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        // Create new contact entry
        const newContact = new Contact({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            comment: comment?.trim() || "NOT GIVEN"
        });

        // Save to database
        await newContact.save();

        return res.status(201).json({
            success: true,
            message: "Contact message saved successfully",
            data: {
                id: newContact._id,
                name: newContact.name,
                email: newContact.email,
                createdAt: newContact.createdAt
            }
        });

    } catch (error) {
        console.error("Error in createContactus:", error);

        // Handle duplicate email error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "A message from this email already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

// Get all contact messages
export async function getContactus(req, res) {
    try {
        const contacts = await Contact.find()
            .sort({ createdAt: -1 }) // Sort by newest first
            .select('-__v'); // Exclude version key

        return res.status(200).json({
            success: true,
            count: contacts.length,
            data: contacts
        });

    } catch (error) {
        console.error("Error in getContactus:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

// Get contact message by email
export async function getContactusByEmail(req, res) {
    try {
        const { email } = req.params;

        const contact = await Contact.findOne({ email: email.toLowerCase() })
            .select('-__v');

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact message not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: contact
        });

    } catch (error) {
        console.error("Error in getContactusByEmail:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}

// Delete contact message by ID
export async function deleteContactus(req, res) {
    try {
        const { id } = req.params;

        const contact = await Contact.findByIdAndDelete(id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact message not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Contact message deleted successfully"
        });

    } catch (error) {
        console.error("Error in deleteContactus:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
}