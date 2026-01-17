// Seed script for initial database data.
import mongoose from "mongoose";
import dotenv from "dotenv";
import ObjectItem from "./models/ObjectItem.js";

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await ObjectItem.deleteMany({});
    console.log("Seed concluído com sucesso.");
  } catch (err) {
    console.error("Erro ao semear:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
