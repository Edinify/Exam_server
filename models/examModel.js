import mongoose from "mongoose";

const Schema = mongoose.Schema;

export const examSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
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
    // course: {
    //   type: Schema.Types.ObjectId,
    //   ref: "Course",
    //   required: true,
    // },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    // teacher: {
    //   type: Schema.Types.ObjectId,
    //   ref: "Teacher",
    // },
  },
  { timestamps: true }
);

export const Exam = mongoose.model("Exam", examSchema);
