import mongoose from "mongoose";

const Schema = mongoose.Schema;

const salarySchema = new Schema({
  teacher: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Teacher"
  },
  paid: {
    type: Number,
  },
  date: {
    type: Date,
  },
});

export const Salary = mongoose.model("Salary", salarySchema);
