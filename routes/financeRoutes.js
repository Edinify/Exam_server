import express from "express";
import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";
import { getChartData, getFinance } from "../controllers/financeController.js";

const router = express.Router();

router.get("/", authMiddleware, checkAdminAndSuperAdmin, getFinance);
router.get("/chart", authMiddleware, checkAdminAndSuperAdmin, getChartData);

export default router;
