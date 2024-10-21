import mongoose from "mongoose";

const Schema = mongoose.Schema;

const syllabusSchema = new Schema(
  {
    orderNumber: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    changes: {
      type: Object,
    },
    history: {
      type: Object,
    },
  },
  { timestamps: true }
);

syllabusSchema.index({ orderNumber: 1 });

export const Syllabus = mongoose.model("Syllabus", syllabusSchema);
