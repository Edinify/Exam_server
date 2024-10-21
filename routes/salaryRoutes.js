import express from "express";
import {
  authMiddleware,
  checkAdminAndSuperAdmin,
  checkTeacher,
} from "../middleware/auth.js";
import {
  addSalary,
  getSalariesForAdmins,
  getSalariesForTargetWorker,
  getSalariesForTeacher,
} from "../controllers/salaryController.js";

const router = express.Router();

router.patch("/add", addSalary);
router.get("/", authMiddleware, checkAdminAndSuperAdmin, getSalariesForAdmins);
router.get("/me", authMiddleware, checkTeacher, getSalariesForTeacher);
router.get("/:workerId", getSalariesForTargetWorker);

export default router;
