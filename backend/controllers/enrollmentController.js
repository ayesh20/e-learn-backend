import Enrollment from "../models/enrollment.js";
import Student from "../models/student.js";
import Course from "../models/course.js";
import dotenv from "dotenv";
dotenv.config();

// Create a new enrollment - FIXED VERSION
export async function createEnrollment(req, res) {
    try {
        console.log('Creating enrollment with data:', req.body);

        // FIXED: Only validate courseName and studentName (removed strict validation)
        if (!req.body.courseName || !req.body.studentName) {
            return res.status(400).json({
                message: "Missing required fields: courseName and studentName are required"
            });
        }

        // Check if enrollment already exists
        const existingEnrollment = await Enrollment.findOne({
            courseName: req.body.courseName,
            studentName: req.body.studentName
        });

        if (existingEnrollment) {
            return res.status(400).json({
                message: "Student is already enrolled in this course"
            });
        }

        // FIXED: Prepare enrollment data - include studentEmail!
        const enrollmentData = {
            courseName: req.body.courseName.trim(),
            studentName: req.body.studentName.trim(),
            studentEmail: req.body.studentEmail || 'no-email@example.com', // FIXED: Added this line!
            enrollmentStatus: req.body.enrollmentStatus || "ENROLLED",
            grade: req.body.grade || "Not Given",
            enrollmentDate: req.body.enrollmentDate || new Date(),
            completionDate: req.body.completionDate || null,
            progress: req.body.progress || 0
        };

        console.log('Processed enrollment data:', enrollmentData);

        // Create enrollment
        const enrollment = new Enrollment(enrollmentData);
        const savedEnrollment = await enrollment.save();

        console.log('Enrollment created successfully:', savedEnrollment._id);

        res.status(201).json({
            message: "Enrollment created successfully",
            enrollment: savedEnrollment
        });

    } catch (error) {
        console.error('Error creating enrollment:', error);
        console.error('Error details:', error.message);
        
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Enrollment already exists"
            });
        }
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            console.error('Validation errors:', validationErrors);
            return res.status(400).json({
                message: "Validation error",
                errors: validationErrors,
                receivedData: req.body // Added for debugging
            });
        }
        
        res.status(500).json({
            message: "Failed to create enrollment",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Get all enrollments
export async function getAllEnrollments(req, res) {
    try {
        const { page = 1, limit = 10, enrollmentStatus, courseName, studentName } = req.query;
        
        const filter = {};
        if (enrollmentStatus) filter.enrollmentStatus = enrollmentStatus;
        if (courseName) filter.courseName = { $regex: courseName, $options: 'i' };
        if (studentName) filter.studentName = { $regex: studentName, $options: 'i' };

        const skip = (page - 1) * limit;
        
        const enrollments = await Enrollment.find(filter)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ enrollmentDate: -1 });

        const totalEnrollments = await Enrollment.countDocuments(filter);
        const totalPages = Math.ceil(totalEnrollments / limit);
        
        res.json({
            enrollments,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalEnrollments,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching enrollments:', error);
        res.status(500).json({
            message: "Failed to fetch enrollments",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Get enrollment by ID
export async function getEnrollmentById(req, res) {
    try {
        const enrollmentId = req.params.enrollmentId;
        
        const enrollment = await Enrollment.findById(enrollmentId);
        
        if (!enrollment) {
            return res.status(404).json({ message: "Enrollment not found" });
        }
        
        res.json(enrollment);
    } catch (error) {
        console.error('Error fetching enrollment:', error);
        res.status(500).json({
            message: "Failed to fetch enrollment",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Get enrollments by student name
export async function getEnrollmentsByStudent(req, res) {
    try {
        const studentName = req.params.studentName;
        
        const enrollments = await Enrollment.find({ 
            studentName: { $regex: studentName, $options: 'i' }
        }).sort({ enrollmentDate: -1 });
        
        res.json({
            studentName,
            enrollments,
            totalEnrollments: enrollments.length
        });
    } catch (error) {
        console.error('Error fetching student enrollments:', error);
        res.status(500).json({
            message: "Failed to fetch student enrollments",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Get enrollments by course name
export async function getEnrollmentsByCourse(req, res) {
    try {
        const courseName = req.params.courseName;
        
        const enrollments = await Enrollment.find({ 
            courseName: { $regex: courseName, $options: 'i' }
        }).sort({ enrollmentDate: -1 });
        
        res.json({
            courseName,
            enrollments,
            totalEnrollments: enrollments.length
        });
    } catch (error) {
        console.error('Error fetching course enrollments:', error);
        res.status(500).json({
            message: "Failed to fetch course enrollments",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Update enrollment
export async function updateEnrollment(req, res) {
    try {
        const enrollmentId = req.params.enrollmentId;
        const updateData = { ...req.body };
        
        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.enrollmentDate;
        
        updateData.updatedAt = new Date();
        
        const updatedEnrollment = await Enrollment.findByIdAndUpdate(
            enrollmentId,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!updatedEnrollment) {
            return res.status(404).json({ message: "Enrollment not found" });
        }
        
        res.json({
            message: "Enrollment updated successfully",
            enrollment: updatedEnrollment
        });
    } catch (error) {
        console.error('Error updating enrollment:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                message: "Validation error",
                errors: validationErrors
            });
        }
        
        res.status(500).json({
            message: "Failed to update enrollment",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Delete enrollment
export async function deleteEnrollment(req, res) {
    try {
        const enrollmentId = req.params.enrollmentId;
        
        const result = await Enrollment.deleteOne({ _id: enrollmentId });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Enrollment not found" });
        }
        
        res.json({ message: "Enrollment deleted successfully" });
    } catch (error) {
        console.error('Error deleting enrollment:', error);
        res.status(500).json({
            message: "Failed to delete enrollment",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Update enrollment status
export async function updateEnrollmentStatus(req, res) {
    try {
        const enrollmentId = req.params.enrollmentId;
        const { enrollmentStatus } = req.body;
        
        const validStatuses = ['ENROLLED', 'NOT ENROLLMENT', 'COMPLETED', 'DROPPED', 'SUSPENDED', 'IN PROGRESS'];
        
        if (!enrollmentStatus || !validStatuses.includes(enrollmentStatus)) {
            return res.status(400).json({
                message: `Invalid status. Status must be one of: ${validStatuses.join(', ')}`
            });
        }
        
        const updateData = { 
            enrollmentStatus: enrollmentStatus,
            updatedAt: new Date()
        };
        
        if (enrollmentStatus === 'COMPLETED') {
            updateData.completionDate = new Date();
            updateData.progress = 100;
        }
        
        const result = await Enrollment.updateOne(
            { _id: enrollmentId },
            updateData
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Enrollment not found" });
        }
        
        res.json({ message: "Enrollment status updated successfully" });
    } catch (error) {
        console.error('Error updating enrollment status:', error);
        res.status(500).json({
            message: "Failed to update enrollment status",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Update enrollment grade
export async function updateEnrollmentGrade(req, res) {
    try {
        const enrollmentId = req.params.enrollmentId;
        const { grade } = req.body;
        
        if (!grade) {
            return res.status(400).json({
                message: "Grade is required"
            });
        }
        
        const result = await Enrollment.updateOne(
            { _id: enrollmentId },
            { 
                grade: grade,
                updatedAt: new Date()
            }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Enrollment not found" });
        }
        
        res.json({ message: "Grade updated successfully" });
    } catch (error) {
        console.error('Error updating grade:', error);
        res.status(500).json({
            message: "Failed to update grade",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Update enrollment progress
export async function updateEnrollmentProgress(req, res) {
    try {
        const enrollmentId = req.params.enrollmentId;
        const { progress } = req.body;
        
        if (progress === undefined || progress < 0 || progress > 100) {
            return res.status(400).json({
                message: "Progress must be a number between 0 and 100"
            });
        }
        
        const updateData = {
            progress: progress,
            updatedAt: new Date()
        };
        
        if (progress === 100) {
            updateData.enrollmentStatus = 'COMPLETED';
            updateData.completionDate = new Date();
        }
        
        const result = await Enrollment.updateOne(
            { _id: enrollmentId },
            updateData
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Enrollment not found" });
        }
        
        res.json({ message: "Progress updated successfully" });
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({
            message: "Failed to update progress",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Get enrollment statistics
export async function getEnrollmentStats(req, res) {
    try {
        const totalEnrollments = await Enrollment.countDocuments();
        const activeEnrollments = await Enrollment.countDocuments({ enrollmentStatus: 'ENROLLED' });
        const completedEnrollments = await Enrollment.countDocuments({ enrollmentStatus: 'COMPLETED' });
        const droppedEnrollments = await Enrollment.countDocuments({ enrollmentStatus: 'DROPPED' });
        
        const statusDistribution = await Enrollment.aggregate([
            {
                $group: {
                    _id: '$enrollmentStatus',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        const recentEnrollments = await Enrollment.find()
            .sort({ enrollmentDate: -1 })
            .limit(5);
        
        res.json({
            statistics: {
                total: totalEnrollments,
                active: activeEnrollments,
                completed: completedEnrollments,
                dropped: droppedEnrollments
            },
            statusDistribution,
            recentEnrollments
        });
    } catch (error) {
        console.error('Error fetching enrollment statistics:', error);
        res.status(500).json({
            message: "Failed to fetch enrollment statistics",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Search enrollments
export async function searchEnrollments(req, res) {
    try {
        const { query, status } = req.query;
        
        if (!query && !status) {
            return res.status(400).json({
                message: "Search query or status filter is required"
            });
        }

        const filter = {};
        
        if (query) {
            filter.$or = [
                { courseName: { $regex: query, $options: 'i' } },
                { studentName: { $regex: query, $options: 'i' } }
            ];
        }
        
        if (status) filter.enrollmentStatus = status;

        const enrollments = await Enrollment.find(filter)
            .sort({ enrollmentDate: -1 })
            .limit(20);

        res.json({
            searchResults: enrollments,
            totalResults: enrollments.length,
            searchQuery: query,
            statusFilter: status
        });
    } catch (error) {
        console.error('Error searching enrollments:', error);
        res.status(500).json({
            message: "Failed to search enrollments",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}