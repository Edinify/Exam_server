import express from "express";
import {
  createRoom,
  deleteRoom,
  getRooms,
  getRoomsForPagination,
  updateRoom,
} from "../controllers/roomController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/", createRoom);
router.get("/pagination", getRoomsForPagination);
router.get("/", getRooms);
router.patch("/:id", authMiddleware, updateRoom);
router.delete("/:id", deleteRoom);

export default router;
