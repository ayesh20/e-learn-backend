import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "messages.senderModel",
    required: true,
  },
  senderModel: {
    type: String,
    enum: ["students", "instructors"],
    required: true,
  },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "participantsModel",
        required: true,
      },
    ],
    participantsModel: [
      {
        type: String,
        enum: ["students", "instructors"],
        required: true,
      },
    ],
    messages: [messageSchema],
  },
  { timestamps: true }
);

const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);

export default Chat;
