import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv"
dotenv.config()

export async function createUser(req, res) {
    try {
        console.log('Creating user with data:', {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            role: req.body.role
        });

        // Validate required fields
        if (!req.body.firstName || !req.body.email || !req.body.password) {
            return res.status(400).json({
                message: "Missing required fields: firstName, email, and password are required"
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.email)) {
            return res.status(400).json({
                message: "Please provide a valid email address"
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: req.body.email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                message: "User with this email already exists"
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

        // Prepare user data
        const userData = {
            firstName: req.body.firstName.trim(),
            lastName: req.body.lastName ? req.body.lastName.trim() : '',
            email: req.body.email.toLowerCase().trim(),
            password: passwordHash,
            role: req.body.role || 'user'
        };

        // Create user
        const user = new User(userData);
        const savedUser = await user.save();

        console.log('User created successfully:', savedUser._id);

        res.status(201).json({
            message: "User created successfully",
            user: {
                id: savedUser._id,
                firstName: savedUser.firstName,
                lastName: savedUser.lastName,
                email: savedUser.email,
                role: savedUser.role
            }
        });

    } catch (error) {
        console.error('Error creating user:', error);
        
        // Handle specific MongoDB errors
        if (error.code === 11000) {
            return res.status(400).json({
                message: "User with this email already exists"
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
            message: "Failed to create user",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

export async function loginuser(req, res) {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        console.log('Login attempt for email:', email);

        // Find user
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Check password
        const isPasswordCorrect = bcrypt.compareSync(password, user.password);
        
        if (!isPasswordCorrect) {
            return res.status(403).json({
                message: "Incorrect password"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isBlocked: user.isBlocked || false,
                isEmailVerified: user.isEmailVerified || false,
                image: user.image || null
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // Add expiration time
        );

        console.log('Login successful for user:', user.email);

        res.json({
            token: token,
            message: "Login successful",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({
            message: "Login failed",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

export async function getAllUsers(req, res) {
    try {
        const users = await User.find({}, '-password'); // Exclude password from response
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            message: "Failed to fetch users",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Additional helper functions you might need

export async function deleteUser(req, res) {
    try {
        const userId = req.params.userId;
        
        const result = await User.deleteOne({ _id: userId });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ 
            message: "Failed to delete user",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

export async function updateUserRole(req, res) {
    try {
        const userId = req.params.userId;
        const { role } = req.body;
        
        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: "Invalid role. Role must be 'user' or 'admin'" });
        }
        
        const result = await User.updateOne(
            { _id: userId },
            { role: role }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        
        res.json({ message: "User role updated successfully" });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ 
            message: "Failed to update user role",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}