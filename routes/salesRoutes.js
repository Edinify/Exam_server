import express from "express";
import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";
import { getChartData, getFinance } from "../controllers/salesController.js";

const router = express.Router();

router.get("/", getFinance);
router.get("/chart", getChartData);

export default router;
