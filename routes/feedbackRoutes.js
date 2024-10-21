import express from "express";
import {
  createFeedbackByTeacher,
  deleteFeedback,
  getFeedbacksForTeacher,
  getFeedbacksWithPagination,
  updateFeedbackByTeacher,
} from "../controllers/feedbackController.js";
import { authMiddleware, checkTeacher } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authMiddleware, checkTeacher, createFeedbackByTeacher);
router.get("/", authMiddleware, getFeedbacksWithPagination);
router.get("/teacher", authMiddleware, checkTeacher, getFeedbacksForTeacher);
router.patch("/:id", authMiddleware, checkTeacher, updateFeedbackByTeacher);
router.delete("/:id", authMiddleware, deleteFeedback);

export default router;
