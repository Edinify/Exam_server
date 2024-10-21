import express from "express";
import {
  authMiddleware,
  checkAdminAndSuperAdmin,
  checkTeacher,
} from "../middleware/auth.js";
import {
  cancelChanges,
  confirmChanges,
  createWorker,
  deleteWorker,
  getWorkers,
  updateWorker,
  updateWorkerOwnPassword,
} from "../controllers/wokerController.js";

const router = express.Router();

router.post("/create", createWorker);
router.get("/", getWorkers);
router.patch("/:id", updateWorker);
router.delete("/:id", deleteWorker);
router.patch("/own/password", authMiddleware, updateWorkerOwnPassword);
router.patch("/changes/confirm", authMiddleware, confirmChanges);
router.patch("/changes/cancel", authMiddleware, cancelChanges);

export default router;
