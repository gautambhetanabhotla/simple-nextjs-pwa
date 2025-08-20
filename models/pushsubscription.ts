import mongoose, { Schema } from "mongoose";

const pushSubscriptionSchema = new Schema({
  endpoint: {
    type: String,
    required: true,
    unique: true,
  },
  expirationTime: {
    type: Number,
  },
  keys: {
    p256dh: {
      type: String,
      required: true,
    },
    auth: {
      type: String,
      required: true,
    },
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userAgent: {
    type: String,
  },
});

pushSubscriptionSchema.index({ user: 1 });

export default mongoose.models.PushSubscription ||
  mongoose.model("PushSubscription", pushSubscriptionSchema);
