import express from "express";
import {
  cancelLessonChanges,
  confirmLessonChanges,
  createLesson,
  deleteLesson,
  getLessons,
  updateLesson,
} from "../controllers/lessonController.js";
import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";

const router = express.Router();

router.post("/", createLesson);
router.get("/", getLessons);
router.patch("/:id", authMiddleware, updateLesson);
router.patch("/changes/confirm/:id", confirmLessonChanges);
router.patch("/changes/cancel/:id", cancelLessonChanges);
router.delete("/:id", deleteLesson);

// router.delete("/delete-current",deleteCurrentLesson);

export default router;
