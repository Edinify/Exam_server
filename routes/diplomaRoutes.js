import express from "express";
import {
  getDiplomas,
  updateDiploma,
} from "../controllers/diplomaController.js";

const router = express.Router();

router.get("/", getDiplomas);
// router.get("/excel", exportCareersExcel);
router.patch("/", updateDiploma);

export default router;
