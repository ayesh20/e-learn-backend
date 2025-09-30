import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  studentId: { type: String, required: true, unique: true },
  phone: { type: String, default: "NOT GIVEN" },
  dateOfBirth: { type: Date },
  address: { type: String, default: '' },
  enrollmentDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Active', 'Inactive', 'Graduated', 'Suspended'], default: 'Active' },
  academicLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
  profileImage: { type: String, default: null }
}, {
  timestamps: true
});

// ✅ Fix OverwriteModelError
const Student = mongoose.models.students || mongoose.model("students", studentSchema);

export default Student;
