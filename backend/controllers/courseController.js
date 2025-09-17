import Course from "../models/course.js";
import Instructor from "../models/instructor.js";
import dotenv from "dotenv";
dotenv.config();

// Create a new course
export async function createCourse(req, res) {
    try {
        console.log('Creating course with data:', req.body);

        // Validate required fields
        if (!req.body.title || !req.body.description || !req.body.instructorId) {
            return res.status(400).json({
                message: "Missing required fields: title, description, and instructorId are required"
            });
        }

        // Check if instructor exists
        const instructor = await Instructor.findById(req.body.instructorId);
        if (!instructor) {
            return res.status(404).json({
                message: "Instructor not found"
            });
        }

        // Prepare course data
        const courseData = {
            title: req.body.title.trim(),
            description: req.body.description.trim(),
            instructorId: req.body.instructorId,
            category: req.body.category || 'General',
            duration: req.body.duration || 0,
            price: req.body.price || 0,
            level: req.body.level || 'Beginner',
            status: req.body.status || 'Draft',
            maxStudents: req.body.maxStudents || 50,
            syllabus: req.body.syllabus || [],
            requirements: req.body.requirements || [],
            tags: req.body.tags || []
        };

        // Create course
        const course = new Course(courseData);
        const savedCourse = await course.save();

        // Populate instructor details for response
        const populatedCourse = await Course.findById(savedCourse._id)
            .populate('instructorId', 'firstName lastName email');

        console.log('Course created successfully:', savedCourse._id);

        res.status(201).json({
            message: "Course created successfully",
            course: populatedCourse
        });

    } catch (error) {
        console.error('Error creating course:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Course with this title already exists"
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
            message: "Failed to create course",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Get all courses
export async function getAllCourses(req, res) {
    try {
        const { page = 1, limit = 10, category, level, status, search } = req.query;
        
        // Build filter object
        const filter = {};
        if (category) filter.category = category;
        if (level) filter.level = level;
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const skip = (page - 1) * limit;
        
        const courses = await Course.find(filter)
            .populate('instructorId', 'firstName lastName email')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const totalCourses = await Course.countDocuments(filter);
        const totalPages = Math.ceil(totalCourses / limit);
        
        res.json({
            courses,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalCourses,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({
            message: "Failed to fetch courses",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Get course by ID
export async function getCourseById(req, res) {
    try {
        const courseId = req.params.courseId;
        
        const course = await Course.findById(courseId)
            .populate('instructorId', 'firstName lastName email phone');
        
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        
        res.json(course);
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({
            message: "Failed to fetch course",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Get courses by instructor
export async function getCoursesByInstructor(req, res) {
    try {
        const instructorId = req.params.instructorId;
        
        const courses = await Course.find({ instructorId })
            .populate('instructorId', 'firstName lastName email')
            .sort({ createdAt: -1 });
        
        res.json({
            courses,
            totalCourses: courses.length
        });
    } catch (error) {
        console.error('Error fetching instructor courses:', error);
        res.status(500).json({
            message: "Failed to fetch instructor courses",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Update course
export async function updateCourse(req, res) {
    try {
        const courseId = req.params.courseId;
        const updateData = { ...req.body };
        
        // Remove fields that shouldn't be updated directly
        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.enrollmentCount;
        
        // Update timestamp
        updateData.updatedAt = new Date();
        
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            updateData,
            { new: true, runValidators: true }
        ).populate('instructorId', 'firstName lastName email');
        
        if (!updatedCourse) {
            return res.status(404).json({ message: "Course not found" });
        }
        
        res.json({
            message: "Course updated successfully",
            course: updatedCourse
        });
    } catch (error) {
        console.error('Error updating course:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                message: "Validation error",
                errors: validationErrors
            });
        }
        
        res.status(500).json({
            message: "Failed to update course",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Delete course
export async function deleteCourse(req, res) {
    try {
        const courseId = req.params.courseId;
        
        const result = await Course.deleteOne({ _id: courseId });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Course not found" });
        }
        
        res.json({ message: "Course deleted successfully" });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({
            message: "Failed to delete course",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Update course status
export async function updateCourseStatus(req, res) {
    try {
        const courseId = req.params.courseId;
        const { status } = req.body;
        
        if (!status || !['Draft', 'Published', 'Archived', 'Suspended'].includes(status)) {
            return res.status(400).json({
                message: "Invalid status. Status must be 'Draft', 'Published', 'Archived', or 'Suspended'"
            });
        }
        
        const result = await Course.updateOne(
            { _id: courseId },
            { status: status, updatedAt: new Date() }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Course not found" });
        }
        
        res.json({ message: "Course status updated successfully" });
    } catch (error) {
        console.error('Error updating course status:', error);
        res.status(500).json({
            message: "Failed to update course status",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Get courses by category
export async function getCoursesByCategory(req, res) {
    try {
        const category = req.params.category;
        const { limit = 10 } = req.query;
        
        const courses = await Course.find({ 
            category: { $regex: category, $options: 'i' },
            status: 'Published'
        })
        .populate('instructorId', 'firstName lastName')
        .limit(parseInt(limit))
        .sort({ enrollmentCount: -1 });
        
        res.json({
            category,
            courses,
            totalCourses: courses.length
        });
    } catch (error) {
        console.error('Error fetching courses by category:', error);
        res.status(500).json({
            message: "Failed to fetch courses by category",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Get featured courses
export async function getFeaturedCourses(req, res) {
    try {
        const { limit = 6 } = req.query;
        
        const courses = await Course.find({ 
            status: 'Published',
            isFeatured: true
        })
        .populate('instructorId', 'firstName lastName')
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });
        
        res.json({
            featuredCourses: courses,
            totalFeatured: courses.length
        });
    } catch (error) {
        console.error('Error fetching featured courses:', error);
        res.status(500).json({
            message: "Failed to fetch featured courses",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}