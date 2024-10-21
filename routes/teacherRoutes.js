import express from "express";
import {
  authMiddleware,
  checkAdminAndSuperAdmin,
  checkTeacher,
} from "../middleware/auth.js";
import {
  cancelTeacherChanges,
  confirmTeacherChanges,
  createTeacher,
  deleteTeacher,
  exportTeachersExcel,
  getActiveTeachers,
  getAllTeachers,
  getCheckedTeachers,
  getTeacherCancelledLessonsCount,
  getTeacherChartData,
  getTeacherConfirmedLessonsCount,
  getTeacherLeadboardOrder,
  getTeacherUnviewedLessons,
  getTeachersByCourseId,
  getTeachersForPagination,
  updateTeacher,
  updateTeacherPassword,
} from "../controllers/teacherController.js";
import {
  cancelChanges,
  confirmChanges,
} from "../controllers/wokerController.js";

const router = express.Router();

router.post("/", createTeacher);
router.get("/all", authMiddleware, checkAdminAndSuperAdmin, getAllTeachers);
router.get("/active", getActiveTeachers);
router.get("/by-course", getTeachersByCourseId);
router.get("/checked", getCheckedTeachers);
router.get("/pagination", getTeachersForPagination);
router.get("/excel", exportTeachersExcel);
router.patch("/:id", authMiddleware, updateTeacher);
router.delete("/:id", deleteTeacher);
router.patch("/own/password", authMiddleware, updateTeacherPassword);
router.get("/me/chart", authMiddleware, checkTeacher, getTeacherChartData);
router.get(
  "/me/confirmed-lessons",
  authMiddleware,
  checkTeacher,
  getTeacherConfirmedLessonsCount
);
router.get(
  "/me/cancelled-lessons",
  authMiddleware,
  checkTeacher,
  getTeacherCancelledLessonsCount
);
router.get(
  "/me/unviewed-lessons",
  authMiddleware,
  checkTeacher,
  getTeacherUnviewedLessons
);
router.get(
  "/me/leaderboard-order",
  authMiddleware,
  checkTeacher,
  getTeacherLeadboardOrder
);
router.patch("/changes/confirm/:id", authMiddleware, confirmTeacherChanges);
router.patch("/changes/cancel/:id", authMiddleware, cancelTeacherChanges);

export default router;
