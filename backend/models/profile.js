import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
    firstName : {
        type : String,
        required : true
    },
    lastName : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true,
        unique : true
    },
    bio : {
        type : String,
        default : "NOT GIVEN"
    },
    phone : {
        type : String,
        default : "NOT GIVEN"
    },
    address : {
        type : String,
        default : "NOT GIVEN"
    },
     city : {
        type : String,
        default : "NOT GIVEN"
    },
     province : {
        type : String,
        default : "NOT GIVEN"
    },
      zipcode: {
        type : String,
        default : "NOT GIVEN"
    },
     country : {
        type : String,
        default : "NOT GIVEN"
    },
    gender : {
        type : String,
        default : ""
    },
    
    profileImage: {
        type: String,  
        default: null
    },
    profileImageData: {
        data: Buffer,  
        contentType: String  
    }
}, {
    timestamps: true  
})

// Virtual for getting image URL if stored as file path
profileSchema.virtual('imageUrl').get(function() {
    if (this.profileImage) {
        // If it's already a full URL, return as is
        if (this.profileImage.startsWith('http')) {
            return this.profileImage;
        }
        // Otherwise, construct the full URL (adjust base URL as needed)
        return `${process.env.MONGO_URI}/uploads/profiles/${this.profileImage}`;
    }
    return null;
});

// Method to check if profile has an image
profileSchema.methods.hasImage = function() {
    return !!(this.profileImage || (this.profileImageData && this.profileImageData.data));
};

// Method to get image as base64 (useful for direct display)
profileSchema.methods.getImageAsBase64 = function() {
    if (this.profileImageData && this.profileImageData.data) {
        const base64 = this.profileImageData.data.toString('base64');
        return `data:${this.profileImageData.contentType};base64,${base64}`;
    }
    return null;
};

// Static method to find profiles with images
profileSchema.statics.findWithImages = function() {
    return this.find({
        $or: [
            { profileImage: { $ne: null } },
            { 'profileImageData.data': { $exists: true } }
        ]
    });
};

const Profile = mongoose.model("profiles", profileSchema)

export default Profile;