import mongoose from "mongoose";

const Schema = mongoose.Schema;

const notificationSchema = new Schema(
  {
    title: {
      type: String,
      enum: ["event"],
    },
    message: {
      type: String,
    },
    recipients: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin",
        },
        viewed: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
