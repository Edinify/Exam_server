import mongoose from "mongoose";

const Schema = mongoose.Schema;

const workerSchema = new Schema(
  {
    fullName: {
      type: String,
      require: true,
    },
    email: {
      type: String,
      require: true,
      unique: true,
    },
    password: {
      type: String,
      require: true,
    },
    fin: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    birthday: {
      type: String,
    },
    role: {
      type: String,
      default: "worker",
    },
    position: {
      type: String,
      required: true,
    },
    profiles: {
      type: [
        {
          profile: {
            type: String,
            required: true,
          },
          power: {
            type: String,
            required: true,
            enum: ["all", "only-show", "update"],
          },
        },
      ],
    },
    otp: Number,
  },
  { timestamps: true }
);

export const Worker = mongoose.model("Worker", workerSchema);
