import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  image: {
    type: Buffer,
  },
});

export default mongoose.models.User || mongoose.model("User", userSchema);
