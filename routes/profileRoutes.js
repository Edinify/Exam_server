import express from "express";
import {
  getProfileImage,
  uploadProfileImage,
} from "../controllers/profileController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/image", authMiddleware, getProfileImage);
router.patch("/image/upload", authMiddleware, uploadProfileImage);

export default router;
