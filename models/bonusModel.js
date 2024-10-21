import mongoose from "mongoose";

const Schema = mongoose.Schema;

const bonusSchema = new Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Teacher",
    },
    amount: {
      type: Number,
      required: true,
    },
    comment: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const Bonus = mongoose.model("Bonus", bonusSchema);
