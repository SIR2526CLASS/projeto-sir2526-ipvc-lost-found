// Object item schema definition.
import mongoose from "mongoose";

const objectItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    type: { type: String, enum: ["Perdido", "Encontrado"], required: true },
    category: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    photoUrl: { type: String },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const ObjectItem = mongoose.model("ObjectItem", objectItemSchema);

export default ObjectItem;
