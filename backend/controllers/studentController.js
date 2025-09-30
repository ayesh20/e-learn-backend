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
        const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
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

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        // Create new student instance
        const newStudent = new Student({
            ...req.body,
            email: req.body.email.toLowerCase(),
            password: hashedPassword,
            status: "ACTIVE"
        });

        // Save the new student
        const savedStudent = await newStudent.save();

        // Create a JWT token for immediate login (Optional but recommended)
        const token = jwt.sign(
            { id: savedStudent._id, role: 'student' },
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Token expires in 1 day
        );
        
        // Respond with the token and student data
        const studentResponse = savedStudent.toObject();
        delete studentResponse.password; // Remove password from response
        
        res.status(201).json({ 
            token, 
            student: studentResponse,
            message: "Student registered and logged in successfully" 
        });

    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({
            message: "Student registration failed",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}


// Login student
export async function loginStudent(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // 1. Find the student
        const student = await Student.findOne({ email: email.toLowerCase() });
        if (!student) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        // 2. Compare the plain text password with the hashed password
        const isMatch = await bcrypt.compare(password, student.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid credentials"
            });
        }

        // 3. Authentication successful - ***FIX: CREATE JWT TOKEN***
        const token = jwt.sign(
            { id: student._id, role: 'student' },
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Token expires in 1 day
        );
        
        // 4. Prepare response (exclude password)
        const studentResponse = student.toObject();
        delete studentResponse.password;

        // 5. Send token and student data to the client
        res.json({ 
            token, 
            student: studentResponse,
            message: "Login successful" 
        });
        
    } catch (error) {
        console.error('Error logging in student:', error);
        res.status(500).json({
            message: "Login failed",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}


// Get all students
export async function getAllStudents(req, res) {
    try {
        const students = await Student.find({}, '-password').sort({ createdAt: -1 });
        res.json({ students });
    } catch (error) {
        console.error('Error getting all students:', error);
        res.status(500).json({
            message: "Failed to fetch students",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Get student by ID
export async function getStudentById(req, res) {
    try {
        const student = await Student.findById(req.params.studentId, '-password');
        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }
        res.json({ student });
    } catch (error) {
        console.error('Error getting student by ID:', error);
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