import express from "express";
import { authMiddleware, checkSuperAdmin } from "../middleware/auth.js";
import {
  getActiveStudentsCount,
  getAdvertisingStatistics,
  getAllEventsCount,
  getAllStudentsCount,
  getConsultationsData,
  getCoursesStatistics,
  getGroupsCount,
  getLessonsCountChartData,
  getTachersResults,
  getWeeklyGroupTable,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/all-students", getAllStudentsCount);
router.get("/active-students", getActiveStudentsCount);
router.get("/all-groups", getGroupsCount);
router.get("/events", getAllEventsCount);
router.get("/course-statistic", getCoursesStatistics);
router.get("/consult-statistic", getConsultationsData);
router.get("/group-table", getWeeklyGroupTable);
router.get("/advertising", authMiddleware, getAdvertisingStatistics);
router.get("/leadboard", authMiddleware, getTachersResults);
router.get("/chart", getLessonsCountChartData);

export default router;
