import express from 'express';
import { 
    createUser, 
    getAllUsers, 
    loginuser, 
    deleteUser, 
    updateUserRole 
} from '../controllers/userController.js';

const userRouter = express.Router();

// Create user (signup)
userRouter.post("/", createUser);

userRouter.get("/", getAllUsers);

userRouter.post("/login", loginuser);

userRouter.delete("/:userId", deleteUser);

userRouter.put("/:userId", updateUserRole);

export default userRouter;