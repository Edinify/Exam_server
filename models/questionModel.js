import mongoose from "mongoose";

const Schema = mongoose.Schema;

export const questionSchema = new Schema(
  {
    exam: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    options: [
      {
        option: {
          type: String,
          enum: ["A", "B", "C", "D", "E", "F"],
        },
        text: {
          type: String,
        },
        isCorrect: {
          type: Boolean,
        },
      },
    ],

    answers: [
      {
        student: {
          type: Schema.Types.ObjectId,
          ref: "Student",
        },
        answer: {
          type: String,
          enum: ["A", "B", "C", "D", "E", "F"],
        },
        text: {
          type: String,
        },
        isCorrect: {
          type: Boolean,
        },
      },
    ],
  },
  { timestamps: true }
);

export const Question = mongoose.model("Question", questionSchema);
