import mongoose from "mongoose";

const Schema = mongoose.Schema;

const lessonSchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    day: {
      type: Number,
      required: true,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Group",
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
    },
    students: {
      type: [
        {
          student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
          },
          attendance: {
            type: Number,
            default: 0,
          },
          point: {
            type: Number,
          },
          studentSignature: {
            type: Number,
            default: 0,
            enum: [-1, 0, 1],
          },
          
        },
      ],
      required: true,
    },
    topic: {
      type: Object,
    },
    mentorHour: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["unviewed", "confirmed", "cancelled"],
      default: "unviewed",
    },
    changes: {
      type: Object,
    },
  },
  { timestamps: true }
);

lessonSchema.index({ date: 1 });

export const Lesson = mongoose.model("Lesson", lessonSchema);
