import express from "express";
import {
  getNotifications,
  viewNotifications,
} from "../controllers/notificationController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getNotifications);
router.patch("/viewed", authMiddleware, viewNotifications);

export default router;
