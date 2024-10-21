import { Room } from "../models/roomModel.js";

export const createRoom = async (req, res) => {
  const { name } = req.body;
  console.log(req.body)
  try {
    const regexName = new RegExp(`^${name ? name.trim() : ""}$`, "i");

    const existingRoom = await Room.findOne({ name: { $regex: regexName } });

    if (existingRoom) {
      return res.status(409).json({
        key: "room-already-exists",
        message: "room already exist with this name",
      });
    }

    const newRoom = new Room(req.body);

    newRoom.populate("groups.group");
    await newRoom.save();

    res.status(201).json(newRoom);
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getRoomsForPagination = async (req, res) => {
  const { searchQuery, length } = req.query;
  const limit = 20;

  try {
    let totalLength;
    let rooms;

    if (searchQuery && searchQuery.trim() !== "") {
      const regexSearchQuery = new RegExp(searchQuery, "i");

      const roomsCount = await Room.countDocuments({
        name: { $regex: regexSearchQuery },
      });

      rooms = await Room.find({
        name: { $regex: regexSearchQuery },
      })
        .skip(length || 0)
        .limit(limit)
        .populate("groups.group");

      totalLength = roomsCount;
    } else {
      const roomsCount = await Room.countDocuments();
      totalLength = roomsCount;
      rooms = await Room.find()
        .skip(length || 0)
        .limit(limit)
        .populate("groups.group");
    }

    res.status(200).json({ rooms, totalLength });
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

export const getRooms = async (req, res) => {
  console.log("test test 12 12");
  try {
    const rooms = await Room.find();

    res.status(200).json(rooms);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: { error: err.message } });
  }
};

export const updateRoom = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const { id: userId, role } = req.user;
  let updatedData = req.body;

  try {
    const regexName = new RegExp(`^${name.trim()}$` || "", "i");

    const existingRoom = await Room.findOne({
      name: { $regex: regexName },
      _id: { $ne: id },
    });

    if (existingRoom) {
      return res.status(409).json({ key: "room-already-exists" });
    }

    if (role === "worker") {
      const worker = await Worker.findById(userId);

      const power = worker.profiles.find(
        (item) => item.profile === "rooms"
      )?.power;

      if (power === "update") {
        delete updatedData.changes;

        updatedData = { changes: updatedData };
      }
    }

    const updatedRoom = await Room.findByIdAndUpdate(id, updatedData, {
      upsert: true,
      new: true,
      runValidators: true,
    });

    if (!updatedRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json(updatedRoom);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};

// Delete room
export const deleteRoom = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedRoom = await Room.findByIdAndDelete(id);

    if (!deletedRoom) {
      return res.status(404).json({ message: "room not found" });
    }

    res.status(200).json(deletedRoom);
  } catch (err) {
    res.status(500).json({ message: { error: err.message } });
  }
};
