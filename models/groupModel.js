import mongoose from "mongoose";

const Schema = mongoose.Schema;

const groupSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  teachers: [
    {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
    },
  ],
  mentors: [
    {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
    },
  ],
  students: [
    {
      type: Schema.Types.ObjectId,
      ref: "Student",
    },
  ],
  course: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  room: {
    type: Schema.Types.ObjectId,
    ref: "Room",
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  lessonDate: [
    {
      practical: {
        type: Boolean,
        default: false,
      },
      day: {
        type: Number,
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
    },
  ],
  status: {
    type: String,
    enum: ["waiting", "current", "ended"],
    default: "waiting",
  },
  changes: {
    type: Object,
  },
});

groupSchema.index({ createdAt: 1, groupNumber: 1 });

export const Group = mongoose.model("Group", groupSchema);
