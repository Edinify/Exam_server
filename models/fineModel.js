import mongoose from "mongoose";

const Schema = mongoose.Schema;

const fineSchema = new Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Teacher",
    },

    fineType: {
      type: String,
      required: true,
    },
    comment: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const Fine = mongoose.model("Fine", fineSchema);
