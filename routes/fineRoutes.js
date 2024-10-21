import express from "express";
import {
  authMiddleware,
  checkAdminAndSuperAdmin,
  checkTeacher,
} from "../middleware/auth.js";
import {
  createFine,
  deleteFine,
  getFinesForTeacher,
  getFinesWithPagination,
  updateFine,
} from "../controllers/fineController.js";

const router = express.Router();

router.post("/", authMiddleware, checkAdminAndSuperAdmin, createFine);
router.get(
  "/",
  authMiddleware,
  checkAdminAndSuperAdmin,
  getFinesWithPagination
);
router.get("/me", authMiddleware, checkTeacher, getFinesForTeacher);
router.patch("/:id", authMiddleware, checkAdminAndSuperAdmin, updateFine);
router.delete("/:id", authMiddleware, checkAdminAndSuperAdmin, deleteFine);

export default router;
