import mongoose from "mongoose";

const Schema = mongoose.Schema;

const expenseSchema = new Schema(
  {
    category: {
      type: String,
      required: true,
    },
    appointment: {
      type: String,
      required: true,
    },
    amount: {
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

expenseSchema.index({ amount: 1 });
expenseSchema.index({ date: 1 });

export const Expense = mongoose.model("Expense", expenseSchema);
