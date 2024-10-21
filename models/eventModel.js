import mongoose from "mongoose";

const Schema = mongoose.Schema;

const eventSchema = new Schema(
  {
    eventName: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: [
        "new-qrup",
        "conversation",
        "meet-up",
        "community",
        "meeting",
        "thesis-defense",
      ],
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    visitor: {
      type: String,
    },
    speaker: {
      type: String,
    },
    targetAudience: {
      type: String,
    },
    community: {
      type: String,
    },
    participantsCount: {
      type: Number,
    },
    budget: {
      type: Number,
    },
    place: {
      type: String,
    },
    status: {
      type: Boolean,
      default: false, //keçirilməyib
    },
    products: {
      type: Array,
    },
    changes: {
      type: Object,
    },
  },
  { timestamps: true }
);

eventSchema.index({ date: 1 });

export const Event = mongoose.model("Event", eventSchema);
