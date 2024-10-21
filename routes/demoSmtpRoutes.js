import express from "express";
import { sendEmailForDemo } from "../controllers/demoSmtpController.js";

const router = express.Router();

router.post("/send", sendEmailForDemo);

export default router;
