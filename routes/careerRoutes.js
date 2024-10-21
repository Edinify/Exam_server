import express from "express";
import {
  exportCareersExcel,
  getCareers,
  updateCareer,
} from "../controllers/careerController.js";

const router = express.Router();

router.get("/", getCareers);
router.get("/excel", exportCareersExcel);
router.patch("/", updateCareer);

export default router;
