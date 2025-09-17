import Instructor from "../models/instructor.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// Create a new instructor
export async function createInstructor(req, res) {
    try {
        console.log('Creating instructor with data:', {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email
        });

        // Validate required fields
        if (!req.body.firstName || !req.body.lastName || !req.body.email || !req.body.password) {
            return res.status(400).json({
                message: "Missing required fields: firstName, lastName, email, and password are required"
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.email)) {
            return res.status(400).json({
                message: "Please provide a valid email address"
            });
        }

        // Check if instructor already exists
        const existingInstructor = await Instructor.findOne({ email: req.body.email.toLowerCase() });
        if (existingInstructor) {
            return res.status(400).json({
                message: "Instructor with this email already exists"
            });
        }

        // Validate password length
        if (req.body.password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long"
            });
        }

        // Hash password
        const passwordHash = bcrypt.hashSync(req.body.password, 10);

        // Prepare instructor data
        const instructorData = {
            firstName: req.body.firstName.trim(),
            lastName: req.body.lastName.trim(),
            email: req.body.email.toLowerCase().trim(),
            password: passwordHash,
            phone: req.body.phone || "NOT GIVEN",
            role: "instructor", // Fixed the typo from your model
            bio: req.body.bio || '',
            expertise: req.body.expertise || [],
            experience: req.body.experience || 0,
            qualification: req.body.qualification || '',
            socialLinks: req.body.socialLinks || {}
        };

        // Create instructor
        const instructor = new Instructor(instructorData);
        const savedInstructor = await instructor.save();

        console.log('Instructor created successfully:', savedInstructor._id);

        res.status(201).json({
            message: "Instructor created successfully",
            instructor: {
                id: savedInstructor._id,
                firstName: savedInstructor.firstName,
                lastName: savedInstructor.lastName,
                email: savedInstructor.email,
                phone: savedInstructor.phone,
                role: savedInstructor.role,
                bio: savedInstructor.bio,
                expertise: savedInstructor.expertise,
                experience: savedInstructor.experience
            }
        });

    } catch (error) {
        console.error('Error creating instructor:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Instructor with this email already exists"
            });
        }
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                message: "Validation error",
                errors: validationErrors
            });
        }
        
        res.status(500).json({
            message: "Failed to create instructor",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Login instructor
export async function loginInstructor(req, res) {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        console.log('Login attempt for instructor email:', email);

        // Find instructor
        const instructor = await Instructor.findOne({ email: email.toLowerCase().trim() });
        
        if (!instructor) {
            return res.status(404).json({
                message: "Instructor not found"
            });
        }

        // Check password
        const isPasswordCorrect = bcrypt.compareSync(password, instructor.password);
        
        if (!isPasswordCorrect) {
            return res.status(403).json({
                message: "Incorrect password"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: instructor._id,
                email: instructor.email,
                firstName: instructor.firstName,
                lastName: instructor.lastName,
                role: instructor.role,
                expertise: instructor.expertise
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Login successful for instructor:', instructor.email);

        res.json({
            token: token,
            message: "Login successful",
            instructor: {
                id: instructor._id,
                firstName: instructor.firstName,
                lastName: instructor.lastName,
                email: instructor.email,
                role: instructor.role,
                expertise: instructor.expertise,
                experience: instructor.experience
            }
        });

    } catch (error) {
        console.error('Error during instructor login:', error);
        res.status(500).json({
            message: "Login failed",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Get all instructors
export async function getAllInstructors(req, res) {
    try {
        const { page = 1, limit = 10, expertise, experience } = req.query;
        
        // Build filter object
        const filter = {};
        if (expertise) {
            filter.expertise = { $in: [expertise] };
        }
        if (experience) {
            filter.experience = { $gte: parseInt(experience) };
        }

        const skip = (page - 1) * limit;
        
        const instructors = await Instructor.find(filter, '-password')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const totalInstructors = await Instructor.countDocuments(filter);
        const totalPages = Math.ceil(totalInstructors / limit);

        res.json({
            instructors,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalInstructors,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching instructors:', error);
        res.status(500).json({ 
            message: "Failed to fetch instructors",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Get instructor by ID
export async function getInstructorById(req, res) {
    try {
        const instructorId = req.params.instructorId;
        
        const instructor = await Instructor.findById(instructorId, '-password');
        
        if (!instructor) {
            return res.status(404).json({ message: "Instructor not found" });
        }
        
        res.json(instructor);
    } catch (error) {
        console.error('Error fetching instructor:', error);
        res.status(500).json({
            message: "Failed to fetch instructor",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Update instructor profile
export async function updateInstructor(req, res) {
    try {
        const instructorId = req.params.instructorId;
        const updateData = { ...req.body };
        
        // Remove fields that shouldn't be updated directly
        delete updateData._id;
        delete updateData.password; // Password should be updated separately
        delete updateData.email; // Email should be updated carefully
        delete updateData.createdAt;
        
        const updatedInstructor = await Instructor.findByIdAndUpdate(
            instructorId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!updatedInstructor) {
            return res.status(404).json({ message: "Instructor not found" });
        }
        
        res.json({
            message: "Instructor profile updated successfully",
            instructor: updatedInstructor
        });
    } catch (error) {
        console.error('Error updating instructor:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                message: "Validation error",
                errors: validationErrors
            });
        }
        
        res.status(500).json({
            message: "Failed to update instructor profile",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Delete instructor
export async function deleteInstructor(req, res) {
    try {
        const instructorId = req.params.instructorId;
        
        const result = await Instructor.deleteOne({ _id: instructorId });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Instructor not found" });
        }
        
        res.json({ message: "Instructor deleted successfully" });
    } catch (error) {
        console.error('Error deleting instructor:', error);
        res.status(500).json({ 
            message: "Failed to delete instructor",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Update instructor password
export async function updateInstructorPassword(req, res) {
    try {
        const instructorId = req.params.instructorId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are required"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters long"
            });
        }

        // Find instructor
        const instructor = await Instructor.findById(instructorId);
        if (!instructor) {
            return res.status(404).json({ message: "Instructor not found" });
        }

        // Verify current password
        const isCurrentPasswordCorrect = bcrypt.compareSync(currentPassword, instructor.password);
        if (!isCurrentPasswordCorrect) {
            return res.status(403).json({
                message: "Current password is incorrect"
            });
        }

        // Hash new password
        const newPasswordHash = bcrypt.hashSync(newPassword, 10);

        // Update password
        await Instructor.updateOne(
            { _id: instructorId },
            { password: newPasswordHash }
        );

        res.json({ message: "Password updated successfully" });
    } catch (error) {
        console.error('Error updating instructor password:', error);
        res.status(500).json({
            message: "Failed to update password",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Search instructors
export async function searchInstructors(req, res) {
    try {
        const { query, expertise } = req.query;
        
        if (!query && !expertise) {
            return res.status(400).json({
                message: "Search query or expertise filter is required"
            });
        }

        const filter = {};
        
        if (query) {
            filter.$or = [
                { firstName: { $regex: query, $options: 'i' } },
                { lastName: { $regex: query, $options: 'i' } },
                { bio: { $regex: query, $options: 'i' } },
                { qualification: { $regex: query, $options: 'i' } }
            ];
        }
        
        if (expertise) {
            filter.expertise = { $in: [expertise] };
        }

        const instructors = await Instructor.find(filter, '-password')
            .sort({ experience: -1 })
            .limit(20);

        res.json({
            searchResults: instructors,
            totalResults: instructors.length,
            searchQuery: query,
            expertiseFilter: expertise
        });
    } catch (error) {
        console.error('Error searching instructors:', error);
        res.status(500).json({
            message: "Failed to search instructors",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}