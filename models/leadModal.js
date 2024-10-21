import mongoose from "mongoose";

const Schema = mongoose.Schema;

const leadSchema = new Schema(
  {
    count: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

leadSchema.index({ date: 1 });

export const Lead = mongoose.model("Lead", leadSchema);
