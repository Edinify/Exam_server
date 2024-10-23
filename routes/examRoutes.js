import express from "express";
import {
  createExam,
  createQuestion,
  deleteExam,
  deleteQuestion,
  getExamResultsByExam,
  getExamResultsByStudent,
  getExams,
  getQuestions,
  updateExam,
  updateQuestion,
  updateQuestionByStudent,
} from "../controllers/examController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

//exam
router.get("/pagination", authMiddleware, getExams);
router.post("/", authMiddleware, createExam);
router.patch("/:id", authMiddleware, updateExam);
router.delete("/:id", authMiddleware, deleteExam);

//question
router.get("/questions", authMiddleware, getQuestions);
router.post("/question", authMiddleware, createQuestion);
router.patch("/question/:id", authMiddleware, updateQuestion);
router.patch(
  "/question/:id/by-student",
  authMiddleware,
  updateQuestionByStudent
);
router.delete("/question/:id", authMiddleware, deleteQuestion);

// results
router.get("/results/by-student", authMiddleware, getExamResultsByStudent);
router.get("/results/by-exam/:id", authMiddleware, getExamResultsByExam);

export default router;
