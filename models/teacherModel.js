import mongoose from "mongoose";

const Schema = mongoose.Schema;

const teacherSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    fin: {
      type: String,
    },
    seria: {
      type: String,
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    status: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      default: "teacher",
      enum: ["teacher", "mentor"],
    },
    phone: {
      type: String,
    },
    birthday: {
      type: Date,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    changes: {
      type: Object,
    },
    otp: Number,
  },
  { timestamps: true }
);

teacherSchema.index({ createdAt: 1 });

export const Teacher = mongoose.model("Teacher", teacherSchema);
