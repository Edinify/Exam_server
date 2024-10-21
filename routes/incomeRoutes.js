import express from "express";

import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";
import {
  createIncome,
  deleteIncome,
  getIncomesForPagination,
  updateIncome,
} from "../controllers/incomeController.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  checkAdminAndSuperAdmin,
  getIncomesForPagination
);
router.post("/", authMiddleware, checkAdminAndSuperAdmin, createIncome);
router.patch("/:id", authMiddleware, checkAdminAndSuperAdmin, updateIncome);
router.delete("/:id", authMiddleware, checkAdminAndSuperAdmin, deleteIncome);

export default router;
