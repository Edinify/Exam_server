import express from "express";

import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";
import {
  cancelGroupChanges,
  confirmGroupChanges,
  createGroup,
  deleteGroup,
  getGroups,
  getGroupsForPagination,
  getGroupsWithCourseId,
  getGroupsWithMentorId,
  getGroupsWithStudentId,
  getGroupsWithTeacherId,
  updateGroup,
} from "../controllers/groupController.js";
import { getCoursesForPagination } from "../controllers/courseController.js";

const router = express.Router();

router.get("/", getGroups);
router.get("/with-teacher", getGroupsWithTeacherId);
router.get("/with-mentor", getGroupsWithMentorId);
router.get("/with-student", getGroupsWithStudentId);
router.get("/with-course", getGroupsWithCourseId);
router.get("/pagination", getGroupsForPagination);
router.post("/", createGroup);
router.patch("/:id", authMiddleware, updateGroup);
router.patch("/changes/confirm/:id", authMiddleware, confirmGroupChanges);
router.patch("/changes/cancel/:id", authMiddleware, cancelGroupChanges);
router.delete("/:id", deleteGroup);

export default router;
