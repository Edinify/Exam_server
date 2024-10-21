import express from "express";
import {
  exportTuitionFeeExcel,
  getLatePayment,
  getPaidAmount,
  getToBePayment,
  getTutionFees,
  updateTuitionFee,
} from "../controllers/tutionFeeController.js";

const router = express.Router();

router.get("/", getTutionFees);
router.get("/excel", exportTuitionFeeExcel);
router.get("/late-payment", getLatePayment);
router.get("/paid-amount", getPaidAmount);
router.get("/pay-amount", getToBePayment);
router.patch("/payment", updateTuitionFee);

export default router;
