import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: "NOT GIVEN" },
  role: { type: String, default: "user" }
});

// ✅ Fix OverwriteModelError
const User = mongoose.models.users || mongoose.model("users", userSchema);

export default User;
