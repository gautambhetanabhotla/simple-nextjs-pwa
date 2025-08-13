import mongoose, { Schema } from "mongoose";

const grievanceSchema = new Schema({
  by: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  against: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  images: [
    {
      type: Buffer,
      required: false,
    },
  ],
});

export default mongoose.models.Grievance ||
  mongoose.model("Grievance", grievanceSchema);
