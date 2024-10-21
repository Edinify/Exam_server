import express from "express";
import {
  authMiddleware,
  checkAdminAndSuperAdmin,
  checkTeacher,
} from "../middleware/auth.js";
import {
  createBonus,
  createBonusOnSalary,
  deleteBonus,
  getBonusesForTeacher,
  getBonusesWithPagination,
  updateBonus,
} from "../controllers/bonusController.js";

const router = express.Router();

router.post("/", authMiddleware, checkAdminAndSuperAdmin, createBonus);
router.post("/on-salary", authMiddleware, checkAdminAndSuperAdmin, createBonusOnSalary);
router.get(
  "/",
  authMiddleware,
  checkAdminAndSuperAdmin,
  getBonusesWithPagination
);
router.get("/me", authMiddleware, checkTeacher, getBonusesForTeacher);
router.patch("/:id", authMiddleware, checkAdminAndSuperAdmin, updateBonus);
router.delete("/:id", authMiddleware, checkAdminAndSuperAdmin, deleteBonus);

export default router;
