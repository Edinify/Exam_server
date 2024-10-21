import express from "express";
import {
  deleteAdmin,
  getAdmin,
  getAdmins,
  updateAdmin,
  updateAdminPassword,
  updateAdminPasswordWithoutCheckingOldPassword,
} from "../controllers/adminController.js";
import {
  authMiddleware,
  checkAdminAndSuperAdmin,
  checkSuperAdmin,
} from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, checkSuperAdmin, getAdmins);
router.get("/:id", authMiddleware, checkSuperAdmin, getAdmin);
router.patch("/:id", authMiddleware, checkSuperAdmin, updateAdmin);
router.patch("/own/password", authMiddleware, updateAdminPassword);
router.patch("/password/:id", updateAdminPasswordWithoutCheckingOldPassword);
router.delete("/:id", authMiddleware, checkSuperAdmin, deleteAdmin);

export default router;
