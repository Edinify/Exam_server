import express from "express";

import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";
import {
  createLead,
  deleteLead,
  getLeadsForPagination,
  updateLead,
} from "../controllers/leadController.js";

const router = express.Router();

router.get("/pagination", getLeadsForPagination);
router.post("/", createLead);
router.patch("/:id", updateLead);
router.delete("/:id", deleteLead);
// router.patch("/changes/confirm/:id", authMiddleware, confirmCourseChanges);
// router.patch("/changes/cancel/:id", authMiddleware, cancelCourseChanges);

export default router;
