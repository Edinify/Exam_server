import mongoose from "mongoose";

const Schema = mongoose.Schema;

const feedbackSchema = new Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Teacher",
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Student",
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    from: {
      type: String,
      enum: ["teacher", "student"],
      required: true,
    },
    feedback: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Feedback = mongoose.model("Feedback", feedbackSchema);
