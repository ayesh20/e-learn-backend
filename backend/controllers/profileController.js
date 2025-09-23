import Profile from '../models/profile.js';
import Student from '../models/student.js'; // Assuming you have a student model
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/profiles/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get current user's profile
export const getProfile = async (req, res) => {
  try {
    const studentId = req.user.id; // From auth middleware
    
    // Get student basic info
    const student = await Student.findById(studentId).select('firstName lastName email studentId');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get profile details
    let profile = await Profile.findOne({ email: student.email });
    
    // If profile doesn't exist, create one with basic info
    if (!profile) {
      profile = new Profile({
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email
      });
      await profile.save();
    }

    // Combine student and profile data
    const profileData = {
      ...student.toObject(),
      ...profile.toObject(),
      imageUrl: profile.imageUrl,
      hasImage: profile.hasImage()
    };

    res.json({ success: true, data: profileData });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};

// Update current user's profile
export const updateProfile = async (req, res) => {
  try {
    const studentId = req.user.id;
    const {
      firstName,
      lastName,
      bio,
      phone,
      address,
      city,
      province,
      zipcode,
      country,
      gender
    } = req.body;

    // Get student info
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Update student basic info if provided
    if (firstName) student.firstName = firstName;
    if (lastName) student.lastName = lastName;
    await student.save();

    // Find or create profile
    let profile = await Profile.findOne({ email: student.email });
    if (!profile) {
      profile = new Profile({ email: student.email });
    }

    // Update profile fields
    if (firstName) profile.firstName = firstName;
    if (lastName) profile.lastName = lastName;
    if (bio) profile.bio = bio;
    if (phone) profile.phone = phone;
    if (address) profile.address = address;
    if (city) profile.city = city;
    if (province) profile.province = province;
    if (zipcode) profile.zipcode = zipcode;
    if (country) profile.country = country;
    if (gender) profile.gender = gender;

    await profile.save();

    // Return updated profile
    const updatedData = {
      ...student.toObject(),
      ...profile.toObject(),
      imageUrl: profile.imageUrl,
      hasImage: profile.hasImage()
    };

    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: updatedData 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
};

// Upload profile image
export const uploadProfileImage = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find or create profile
    let profile = await Profile.findOne({ email: student.email });
    if (!profile) {
      profile = new Profile({ 
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName
      });
    }

    // Delete old profile image if exists
    if (profile.profileImage && !profile.profileImage.startsWith('http')) {
      const oldImagePath = path.join('uploads/profiles/', profile.profileImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update profile with new image
    profile.profileImage = req.file.filename;
    await profile.save();

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      imageUrl: profile.imageUrl
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({ message: 'Server error while uploading image' });
  }
};

// Get profile image
export const getProfileImage = async (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join('uploads/profiles/', filename);
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.sendFile(path.resolve(imagePath));
  } catch (error) {
    console.error('Error serving profile image:', error);
    res.status(500).json({ message: 'Server error while serving image' });
  }
};

// Delete profile
export const deleteProfile = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const profile = await Profile.findOne({ email: student.email });
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    // Delete profile image if exists
    if (profile.profileImage && !profile.profileImage.startsWith('http')) {
      const imagePath = path.join('uploads/profiles/', profile.profileImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Profile.findByIdAndDelete(profile._id);

    res.json({ 
      success: true, 
      message: 'Profile deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting profile:', error);
    res.status(500).json({ message: 'Server error while deleting profile' });
  }
};

// Export multer upload middleware
export const uploadMiddleware = upload.single('profileImage');

export default {
  getProfile,
  updateProfile,
  uploadProfileImage,
  getProfileImage,
  deleteProfile,
  uploadMiddleware
};