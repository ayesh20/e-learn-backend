import Student from "../models/student.js";
import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// Create a new student
export async function createStudent(req, res) {
    try {
        console.log('Creating student with data:', {
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

        // Check if student already exists
        const existingStudent = await Student.findOne({ email: req.body.email.toLowerCase() });
        if (existingStudent) {
            return res.status(400).json({
                message: "Student with this email already exists"
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

        // Generate unique student ID if not provided
        const studentId = req.body.studentId || `STU${Date.now()}`;

        // Prepare student data
        const studentData = {
            firstName: req.body.firstName.trim(),
            lastName: req.body.lastName.trim(),
            email: req.body.email.toLowerCase().trim(),
            password: passwordHash,
            studentId: studentId,
            phone: req.body.phone || "NOT GIVEN",
            dateOfBirth: req.body.dateOfBirth,
            address: req.body.address || '',
            enrollmentDate: req.body.enrollmentDate || new Date(),
            status: req.body.status || 'Active',
            academicLevel: req.body.academicLevel || 'Beginner'
        };

        // Create student
        const student = new Student(studentData);
        const savedStudent = await student.save();

        console.log('Student created successfully:', savedStudent._id);

        res.status(201).json({
            message: "Student created successfully",
            student: {
                id: savedStudent._id,
                firstName: savedStudent.firstName,
                lastName: savedStudent.lastName,
                email: savedStudent.email,
                studentId: savedStudent.studentId,
                phone: savedStudent.phone,
                status: savedStudent.status,
                academicLevel: savedStudent.academicLevel
            }
        });

    } catch (error) {
        console.error('Error creating student:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Student with this information already exists"
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
            message: "Failed to create student",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Login student
export async function loginStudent(req, res) {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        console.log('Login attempt for student email:', email);

        // Find student
        const student = await Student.findOne({ email: email.toLowerCase().trim() });
        
        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        // Check if student is active
        if (student.status !== 'Active') {
            return res.status(403).json({
                message: `Account is ${student.status}. Please contact support.`
            });
        }

        // Check password
        const isPasswordCorrect = bcrypt.compareSync(password, student.password);
        
        if (!isPasswordCorrect) {
            return res.status(403).json({
                message: "Incorrect password"
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: student._id,
                email: student.email,
                firstName: student.firstName,
                lastName: student.lastName,
                studentId: student.studentId,
                role: 'student',
                status: student.status
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Login successful for student:', student.email);

        res.json({
            token: token,
            message: "Login successful",
            student: {
                id: student._id,
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
                studentId: student.studentId,
                status: student.status,
                academicLevel: student.academicLevel
            }
        });

    } catch (error) {
        console.error('Error during student login:', error);
        res.status(500).json({
            message: "Login failed",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Get all students
export async function getAllStudents(req, res) {
    try {
        const { page = 1, limit = 10, status, academicLevel, search } = req.query;
        
        // Build filter object
        const filter = {};
        if (status) filter.status = status;
        if (academicLevel) filter.academicLevel = academicLevel;
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;
        
        const students = await Student.find(filter, '-password')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ enrollmentDate: -1 });

        const totalStudents = await Student.countDocuments(filter);
        const totalPages = Math.ceil(totalStudents / limit);
        
        res.json({
            students,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalStudents,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
            message: "Failed to fetch students",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Get student by ID
export async function getStudentById(req, res) {
    try {
        const studentId = req.params.studentId;
        
        const student = await Student.findById(studentId, '-password');
        
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        
        res.json(student);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({
            message: "Failed to fetch student",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Get student by student ID
export async function getStudentByStudentId(req, res) {
    try {
        const studentId = req.params.studentId;
        
        const student = await Student.findOne({ studentId }, '-password');
        
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        
        res.json(student);
    } catch (error) {
        console.error('Error fetching student by student ID:', error);
        res.status(500).json({
            message: "Failed to fetch student",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Update student profile
export async function updateStudent(req, res) {
    try {
        const studentId = req.params.studentId;
        const updateData = { ...req.body };
        
        // Remove fields that shouldn't be updated directly
        delete updateData._id;
        delete updateData.password; // Password should be updated separately
        delete updateData.email; // Email should be updated carefully
        delete updateData.studentId; // Student ID shouldn't be changed
        delete updateData.createdAt;
        
        const updatedStudent = await Student.findByIdAndUpdate(
            studentId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!updatedStudent) {
            return res.status(404).json({ message: "Student not found" });
        }
        
        res.json({
            message: "Student profile updated successfully",
            student: updatedStudent
        });
    } catch (error) {
        console.error('Error updating student:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                message: "Validation error",
                errors: validationErrors
            });
        }
        
        res.status(500).json({
            message: "Failed to update student profile",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Delete student
export async function deleteStudent(req, res) {
    try {
        const studentId = req.params.studentId;
        
        const result = await Student.deleteOne({ _id: studentId });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Student not found" });
        }
        
        res.json({ message: "Student deleted successfully" });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).json({
            message: "Failed to delete student",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Update student status
export async function updateStudentStatus(req, res) {
    try {
        const studentId = req.params.studentId;
        const { status } = req.body;
        
        if (!status || !['Active', 'Inactive', 'Graduated', 'Suspended'].includes(status)) {
            return res.status(400).json({
                message: "Invalid status. Status must be 'Active', 'Inactive', 'Graduated', or 'Suspended'"
            });
        }
        
        const result = await Student.updateOne(
            { _id: studentId },
            { status: status, updatedAt: new Date() }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Student not found" });
        }
        
        res.json({ message: "Student status updated successfully" });
    } catch (error) {
        console.error('Error updating student status:', error);
        res.status(500).json({
            message: "Failed to update student status",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Update student password
export async function updateStudentPassword(req, res) {
    try {
        const studentId = req.params.studentId;
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

        // Find student
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Verify current password
        const isCurrentPasswordCorrect = bcrypt.compareSync(currentPassword, student.password);
        if (!isCurrentPasswordCorrect) {
            return res.status(403).json({
                message: "Current password is incorrect"
            });
        }

        // Hash new password
        const newPasswordHash = bcrypt.hashSync(newPassword, 10);

        // Update password
        await Student.updateOne(
            { _id: studentId },
            { password: newPasswordHash }
        );

        res.json({ message: "Password updated successfully" });
    } catch (error) {
        console.error('Error updating student password:', error);
        res.status(500).json({
            message: "Failed to update password",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Search students
export async function searchStudents(req, res) {
    try {
        const { query, status, academicLevel } = req.query;
        
        if (!query && !status && !academicLevel) {
            return res.status(400).json({
                message: "Search query or filter is required"
            });
        }

        const filter = {};
        
        if (query) {
            filter.$or = [
                { firstName: { $regex: query, $options: 'i' } },
                { lastName: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
                { studentId: { $regex: query, $options: 'i' } }
            ];
        }
        
        if (status) filter.status = status;
        if (academicLevel) filter.academicLevel = academicLevel;

        const students = await Student.find(filter, '-password')
            .sort({ enrollmentDate: -1 })
            .limit(20);

        res.json({
            searchResults: students,
            totalResults: students.length,
            searchQuery: query,
            filters: { status, academicLevel }
        });
    } catch (error) {
        console.error('Error searching students:', error);
        res.status(500).json({
            message: "Failed to search students",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}