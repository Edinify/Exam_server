import mongoose from "mongoose";

const Schema = mongoose.Schema;

const incomeSchema = new Schema(
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
    recipient: {
      type: String,
      required: true,
    },
    unitMeasurement: {
      type: String,
    },
    quantity: {
      type: Number,
    },
    unitPrice: {
      type: Number,
    },
    imx: {
      type: Number,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

incomeSchema.index({ date: 1 });
incomeSchema.index({ amount: 1 });

export const Income = mongoose.model("Income", incomeSchema);
