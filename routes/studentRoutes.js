import express from "express";
import {
  deleteStudent,
  getStudents,
  updateStudent,
  getStudentsByCourseId,
  getStudentsForPagination,
  getActiveStudents,
  createStudent,
  confirmStudentChanges,
  cancelStudentChanges,
  exportStudentContract,
  exportStudentsExcel,
  updateStudentPassword,
} from "../controllers/studentController.js";
import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";

const router = express.Router();

router.post("/", createStudent);
router.get("/", authMiddleware, getStudents);
router.get("/pagination", getStudentsForPagination);
router.get(
  "/by/course",
  authMiddleware,
  checkAdminAndSuperAdmin,
  getStudentsByCourseId
);
router.get("/active", getActiveStudents);
router.get("/contract", exportStudentContract);
router.get('/excel', exportStudentsExcel)
router.patch("/:id", authMiddleware, updateStudent);
router.patch("/own/password", authMiddleware, updateStudentPassword);
router.patch("/changes/confirm/:id", authMiddleware, confirmStudentChanges);
router.patch("/changes/cancel/:id", authMiddleware, cancelStudentChanges);
router.delete("/:id", deleteStudent);

export default router;
