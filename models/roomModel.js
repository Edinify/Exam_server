import mongoose from "mongoose";

const Schema = mongoose.Schema;

const roomSchema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  groups: [
    {
      group: {
        type: Schema.Types.ObjectId,
        ref: "Group",
      },
    },
  ],
});

export const Room = mongoose.model("Room", roomSchema);
