import express from "express";
import {
  createExpense,
  deleteExpense,
  getExpensesForPagination,
  updateExpense,
} from "../controllers/expenseController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, getExpensesForPagination);
router.post("/", authMiddleware, createExpense);
router.patch("/:id", authMiddleware, updateExpense);
router.delete("/:id", authMiddleware, deleteExpense);

export default router;
