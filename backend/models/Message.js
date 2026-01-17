// Message schema for chat history.
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    objectId: { type: mongoose.Schema.Types.ObjectId, ref: "ObjectItem", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
