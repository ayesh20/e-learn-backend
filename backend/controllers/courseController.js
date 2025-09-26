// Enhanced courseController.js - Updated to handle integrated course data and image uploads
import Course from "../models/course.js";
import Instructor from "../models/instructor.js";
import dotenv from "dotenv";
import path from "path";
dotenv.config();

// Create a new course with all data integrated
export async function createCourse(req, res) {
    try {
        console.log('Creating course with data:', req.body);
        console.log('File data:', req.file);

        // Validate required fields
        if (!req.body.title || !req.body.description || !req.body.instructorId) {
            return res.status(400).json({
                message: "Missing required fields: title, description, and instructorId are required"
            });
        }
        
        // Handle thumbnail upload
        let thumbnailPath = null;
        if (req.file) {
            // Store the relative path to the uploaded file
            thumbnailPath = `/uploads/courses/${req.file.filename}`;
            console.log('Thumbnail uploaded:', thumbnailPath);
        }

        // Prepare comprehensive course data
        const courseData = {
            // Basic course information
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
            tags: req.body.tags || [],
            thumbnail: thumbnailPath, // Store the image path
            
            // Content data from AddContent component
            content: req.body.content || [],
            
            // Quiz data from QuizSection component
            quizzes: req.body.quizzes || [],
            
            // Additional resources and assignments
            resources: req.body.resources || [],
            assignments: req.body.assignments || [],
            
            // Course settings
            settings: {
                allowDiscussions: req.body.settings?.allowDiscussions ?? true,
                allowDownloads: req.body.settings?.allowDownloads ?? true,
                certificateEnabled: req.body.settings?.certificateEnabled ?? false,
                language: req.body.settings?.language || 'English',
                difficulty: req.body.settings?.difficulty || 'Medium'
            }
        };

        // Create course with all integrated data
        const course = new Course(courseData);
        const savedCourse = await course.save();

        // Populate instructor details for response
        const populatedCourse = await Course.findById(savedCourse._id)
            .populate('instructorId', 'firstName lastName email');

        console.log('Course created successfully with integrated data:', savedCourse._id);

        res.status(201).json({
            message: "Course created successfully",
            course: populatedCourse,
            summary: {
                courseId: populatedCourse._id,
                contentPages: populatedCourse.content?.length || 0,
                quizzes: populatedCourse.quizzes?.length || 0,
                totalVideos: populatedCourse.statistics?.totalVideos || 0,
                totalResources: populatedCourse.statistics?.totalResources || 0,
                totalAssignments: populatedCourse.statistics?.totalAssignments || 0
            }
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

// Update course with integrated data handling and image upload
export async function updateCourse(req, res) {
    try {
        const courseId = req.params.courseId;
        const updateData = { ...req.body };
        
        console.log('Updating course with data:', updateData);
        console.log('File data:', req.file);
        
        // Remove fields that shouldn't be updated directly
        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.enrollmentCount;
        
        // Handle thumbnail upload
        if (req.file) {
            updateData.thumbnail = `/uploads/courses/${req.file.filename}`;
            console.log('New thumbnail uploaded:', updateData.thumbnail);
        }
        
        // Handle content updates - merge with existing or replace
        if (updateData.content) {
            console.log('Updating course content:', updateData.content.length, 'pages');
        }
        
        // Handle quiz updates - merge with existing or replace
        if (updateData.quizzes) {
            console.log('Updating course quizzes:', updateData.quizzes.length, 'quizzes');
        }
        
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
        
        // Calculate updated statistics
        const contentStats = {
            totalPages: updatedCourse.content?.length || 0,
            totalVideos: updatedCourse.content?.reduce((total, page) => 
                total + (page.videos?.length || 0), 0) || 0,
            totalResources: updatedCourse.content?.reduce((total, page) => 
                total + (page.resources?.length || 0), 0) || 0,
            totalAssignments: updatedCourse.content?.reduce((total, page) => 
                total + (page.assignments?.length || 0), 0) || 0,
        };
        
        const quizStats = {
            totalQuizzes: updatedCourse.quizzes?.length || 0,
            totalQuestions: updatedCourse.quizzes?.reduce((total, quiz) => 
                total + (quiz.questions?.length || 0), 0) || 0
        };
        
        console.log('Course updated with integrated data:', {
            courseId: updatedCourse._id,
            ...contentStats,
            ...quizStats
        });
        
        res.json({
            message: "Course updated successfully",
            course: updatedCourse,
            summary: {
                courseId: updatedCourse._id,
                ...contentStats,
                ...quizStats
            }
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

// NEW: Update course content specifically
export async function updateCourseContent(req, res) {
    try {
        const courseId = req.params.courseId;
        const { content } = req.body;
        
        console.log('Updating course content for:', courseId);
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            { 
                content: content,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        ).populate('instructorId', 'firstName lastName email');
        
        res.json({
            message: "Course content updated successfully",
            course: updatedCourse,
            contentPages: updatedCourse.content?.length || 0
        });
        
    } catch (error) {
        console.error('Error updating course content:', error);
        res.status(500).json({
            message: "Failed to update course content",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// NEW: Update course quizzes specifically
export async function updateCourseQuizzes(req, res) {
    try {
        const courseId = req.params.courseId;
        const { quizzes } = req.body;
        
        console.log('Updating course quizzes for:', courseId);
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            { 
                quizzes: quizzes,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        ).populate('instructorId', 'firstName lastName email');
        
        res.json({
            message: "Course quizzes updated successfully",
            course: updatedCourse,
            quizCount: updatedCourse.quizzes?.length || 0
        });
        
    } catch (error) {
        console.error('Error updating course quizzes:', error);
        res.status(500).json({
            message: "Failed to update course quizzes",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Get course with all integrated data
export async function getCourseById(req, res) {
    try {
        const courseId = req.params.courseId;
        
        const course = await Course.findById(courseId)
            .populate('instructorId', 'firstName lastName email phone');
        
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        
        // Add computed statistics for frontend display
        const courseWithStats = {
            ...course.toObject(),
            // Ensure thumbnail URL is properly formatted
            thumbnailUrl: course.thumbnail ? 
                (course.thumbnail.startsWith('http') ? course.thumbnail : `${process.env.BASE_URL || 'http://localhost:5000'}${course.thumbnail}`) 
                : null,
            computedStats: {
                totalContentPages: course.content?.length || 0,
                totalVideos: course.content?.reduce((total, page) => 
                    total + (page.videos?.length || 0), 0) || 0,
                totalResources: course.content?.reduce((total, page) => 
                    total + (page.resources?.length || 0), 0) || 0,
                totalAssignments: course.content?.reduce((total, page) => 
                    total + (page.assignments?.length || 0), 0) || 0,
                totalQuizzes: course.quizzes?.length || 0,
                totalQuestions: course.quizzes?.reduce((total, quiz) => 
                    total + (quiz.questions?.length || 0), 0) || 0,
                totalDuration: course.content?.reduce((total, page) => 
                    total + (page.duration || 0), 0) || 0
            }
        };
        
        res.json(courseWithStats);
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({
            message: "Failed to fetch course",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Get courses by instructor with summary statistics and proper image URLs
export async function getCoursesByInstructor(req, res) {
    try {
        const instructorId = req.params.instructorId;
        
        const courses = await Course.find({ instructorId })
            .populate('instructorId', 'firstName lastName email')
            .sort({ createdAt: -1 });
        
        // Add summary statistics for each course and format image URLs
        const coursesWithStats = courses.map(course => {
            const courseObj = course.toObject();
            
            return {
                ...courseObj,
                // Properly format thumbnail URL for frontend consumption
                thumbnailUrl: courseObj.thumbnail ? 
                    (courseObj.thumbnail.startsWith('http') ? courseObj.thumbnail : `${process.env.BASE_URL || 'http://localhost:5000'}${courseObj.thumbnail}`) 
                    : null,
                imageUrl: courseObj.thumbnail ? 
                    (courseObj.thumbnail.startsWith('http') ? courseObj.thumbnail : `${process.env.BASE_URL || 'http://localhost:5000'}${courseObj.thumbnail}`) 
                    : "/images/default-course.png",
                summary: {
                    contentPages: courseObj.content?.length || 0,
                    quizzes: courseObj.quizzes?.length || 0,
                    totalVideos: courseObj.content?.reduce((total, page) => 
                        total + (page.videos?.length || 0), 0) || 0,
                    totalQuestions: courseObj.quizzes?.reduce((total, quiz) => 
                        total + (quiz.questions?.length || 0), 0) || 0
                }
            };
        });
        
        res.json({
            courses: coursesWithStats,
            totalCourses: coursesWithStats.length,
            instructorStats: {
                totalCourses: coursesWithStats.length,
                publishedCourses: coursesWithStats.filter(c => c.status === 'Published').length,
                draftCourses: coursesWithStats.filter(c => c.status === 'Draft').length,
                totalContentPages: coursesWithStats.reduce((total, c) => total + (c.summary.contentPages || 0), 0),
                totalQuizzes: coursesWithStats.reduce((total, c) => total + (c.summary.quizzes || 0), 0)
            }
        });
    } catch (error) {
        console.error('Error fetching instructor courses:', error);
        res.status(500).json({
            message: "Failed to fetch instructor courses",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Keep all existing functions but update them to handle images properly
export async function getAllCourses(req, res) {
    try {
        const { page = 1, limit = 10, category, level, status, search } = req.query;
        
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
        
        // Format courses with proper image URLs
        const formattedCourses = courses.map(course => {
            const courseObj = course.toObject();
            return {
                ...courseObj,
                thumbnailUrl: courseObj.thumbnail ? 
                    (courseObj.thumbnail.startsWith('http') ? courseObj.thumbnail : `${process.env.BASE_URL || 'http://localhost:5000'}${courseObj.thumbnail}`) 
                    : null,
                imageUrl: courseObj.thumbnail ? 
                    (courseObj.thumbnail.startsWith('http') ? courseObj.thumbnail : `${process.env.BASE_URL || 'http://localhost:5000'}${courseObj.thumbnail}`) 
                    : "/images/default-course.png"
            };
        });
        
        res.json({
            courses: formattedCourses,
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

// Keep existing functions
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

export async function updateCourseStatus(req, res) {
    try {
        const courseId = req.params.courseId;
        const { status } = req.body;
        
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            { status: status, updatedAt: new Date() },
            { new: true, runValidators: true }
        ).populate('instructorId', 'firstName lastName email');
        
        if (!updatedCourse) {
            return res.status(404).json({ message: "Course not found" });
        }
        
        res.json({
            message: "Course status updated successfully",
            course: updatedCourse
        });
    } catch (error) {
        console.error('Error updating course status:', error);
        res.status(500).json({
            message: "Failed to update course status",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Legacy functions for backward compatibility
export async function addCourseContent(req, res) {
    return updateCourseContent(req, res);
}

export async function addCourseQuiz(req, res) {
    return updateCourseQuizzes(req, res);
}

export async function getCourseContent(req, res) {
    try {
        const courseId = req.params.courseId;
        const course = await Course.findById(courseId);
        
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        
        res.json({
            content: course.content || [],
            totalPages: course.content?.length || 0
        });
    } catch (error) {
        console.error('Error fetching course content:', error);
        res.status(500).json({
            message: "Failed to fetch course content",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

export async function getCourseQuizzes(req, res) {
    try {
        const courseId = req.params.courseId;
        const course = await Course.findById(courseId);
        
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        
        res.json({
            quizzes: course.quizzes || [],
            totalQuizzes: course.quizzes?.length || 0
        });
    } catch (error) {
        console.error('Error fetching course quizzes:', error);
        res.status(500).json({
            message: "Failed to fetch course quizzes",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

// Keep other legacy functions for compatibility
export async function addIntegratedCourseData(req, res) {
    try {
        const courseId = req.params.courseId;
        const { content, quizzes, type } = req.body;
        
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        
        let updateData = { updatedAt: new Date() };
        
        if (type === 'content' && content) {
            updateData.content = content;
            console.log(`Adding/updating ${content.length} content pages to course ${courseId}`);
        }
        
        if (type === 'quizzes' && quizzes) {
            updateData.quizzes = quizzes;
            console.log(`Adding/updating ${quizzes.length} quizzes to course ${courseId}`);
        }
        
        if (type === 'both' && (content || quizzes)) {
            if (content) updateData.content = content;
            if (quizzes) updateData.quizzes = quizzes;
            console.log(`Adding/updating integrated data to course ${courseId}`);
        }
        
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            updateData,
            { new: true, runValidators: true }
        ).populate('instructorId', 'firstName lastName email');
        
        res.json({
            message: `Course ${type} updated successfully`,
            course: updatedCourse,
            summary: {
                courseId: updatedCourse._id,
                contentPages: updatedCourse.content?.length || 0,
                quizzes: updatedCourse.quizzes?.length || 0,
                totalVideos: updatedCourse.content?.reduce((total, page) => 
                    total + (page.videos?.length || 0), 0) || 0,
                totalQuestions: updatedCourse.quizzes?.reduce((total, quiz) => 
                    total + (quiz.questions?.length || 0), 0) || 0
            }
        });
        
    } catch (error) {
        console.error('Error adding integrated course data:', error);
        res.status(500).json({
            message: "Failed to add course data",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

export async function getCompleteCourseData(req, res) {
    try {
        const courseId = req.params.courseId;
        
        const course = await Course.findById(courseId)
            .populate('instructorId', 'firstName lastName email phone');
        
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        
        const courseObj = course.toObject();
        
        // Structure response for easy frontend consumption
        const completeData = {
            // Basic course info
            basicInfo: {
                _id: courseObj._id,
                title: courseObj.title,
                description: courseObj.description,
                category: courseObj.category,
                level: courseObj.level,
                price: courseObj.price,
                status: courseObj.status,
                thumbnail: courseObj.thumbnail,
                thumbnailUrl: courseObj.thumbnail ? 
                    (courseObj.thumbnail.startsWith('http') ? courseObj.thumbnail : `${process.env.BASE_URL || 'http://localhost:5000'}${courseObj.thumbnail}`) 
                    : null,
                instructorId: courseObj.instructorId,
                createdAt: courseObj.createdAt,
                updatedAt: courseObj.updatedAt
            },
            
            // Content data
            content: courseObj.content || [],
            
            // Quiz data
            quizzes: courseObj.quizzes || [],
            
            // Resources and assignments
            resources: courseObj.resources || [],
            assignments: courseObj.assignments || [],
            
            // Statistics
            statistics: {
                contentPages: courseObj.content?.length || 0,
                totalQuizzes: courseObj.quizzes?.length || 0,
                totalVideos: courseObj.content?.reduce((total, page) => 
                    total + (page.videos?.length || 0), 0) || 0,
                totalResources: courseObj.content?.reduce((total, page) => 
                    total + (page.resources?.length || 0), 0) || 0,
                totalAssignments: courseObj.content?.reduce((total, page) => 
                    total + (page.assignments?.length || 0), 0) || 0,
                totalQuestions: courseObj.quizzes?.reduce((total, quiz) => 
                    total + (quiz.questions?.length || 0), 0) || 0,
                totalDuration: courseObj.content?.reduce((total, page) => 
                    total + (page.duration || 0), 0) || 0,
                enrollmentCount: courseObj.enrollmentCount || 0,
                rating: courseObj.rating || { average: 0, count: 0 }
            }
        };
        
        res.json({
            message: "Complete course data retrieved successfully",
            course: completeData
        });
        
    } catch (error) {
        console.error('Error fetching complete course data:', error);
        res.status(500).json({
            message: "Failed to fetch complete course data",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

export async function getCoursesByCategory(req, res) {
    try {
        const { category } = req.params;
        const courses = await Course.find({ category, status: 'Published' })
            .populate('instructorId', 'firstName lastName email')
            .sort({ createdAt: -1 });
        
        const formattedCourses = courses.map(course => {
            const courseObj = course.toObject();
            return {
                ...courseObj,
                thumbnailUrl: courseObj.thumbnail ? 
                    (courseObj.thumbnail.startsWith('http') ? courseObj.thumbnail : `${process.env.BASE_URL || 'http://localhost:5000'}${courseObj.thumbnail}`) 
                    : null
            };
        });
        
        res.json({ courses: formattedCourses });
    } catch (error) {
        console.error('Error fetching courses by category:', error);
        res.status(500).json({
            message: "Failed to fetch courses by category",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}

export async function getFeaturedCourses(req, res) {
    try {
        const courses = await Course.find({ isFeatured: true, status: 'Published' })
            .populate('instructorId', 'firstName lastName email')
            .sort({ createdAt: -1 });
        
        const formattedCourses = courses.map(course => {
            const courseObj = course.toObject();
            return {
                ...courseObj,
                thumbnailUrl: courseObj.thumbnail ? 
                    (courseObj.thumbnail.startsWith('http') ? courseObj.thumbnail : `${process.env.BASE_URL || 'http://localhost:5000'}${courseObj.thumbnail}`) 
                    : null
            };
        });
        
        res.json({ courses: formattedCourses });
    } catch (error) {
        console.error('Error fetching featured courses:', error);
        res.status(500).json({
            message: "Failed to fetch featured courses",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
}