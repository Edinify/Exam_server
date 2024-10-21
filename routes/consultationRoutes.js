import express from "express";

import { authMiddleware, checkAdminAndSuperAdmin } from "../middleware/auth.js";
import {
  cancelConsultationChanges,
  confirmConsultationChanges,
  createConsultation,
  deleteConsultation,
  getConsultationsForPagination,
  updateConsultation,
} from "../controllers/consultationController.js";

const router = express.Router();

router.get("/pagination", getConsultationsForPagination);
router.post("/", createConsultation);
router.patch("/:id", authMiddleware, updateConsultation);
router.patch(
  "/changes/confirm/:id",
  authMiddleware,
  confirmConsultationChanges
);
router.patch("/changes/cancel/:id", authMiddleware, cancelConsultationChanges);
router.delete("/:id", deleteConsultation);

export default router;
