import express from "express";
import { body } from "express-validator";
import { handleValidation } from "../middleware/validate.js";
import { sendContactEmail } from "../services/emailService.js";
import logger from "../services/logger.js";

const router = express.Router();

// POST /api/contact
router.post("/",
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }).withMessage("Name too long").escape(),
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email address").normalizeEmail(),
  body("message").trim().notEmpty().withMessage("Message is required").isLength({ max: 5000 }).withMessage("Message too long").escape(),
  handleValidation,
  async (req, res) => {
    const { name, email, message } = req.body;
    try {
      await sendContactEmail({ name, email, message });
      res.json({ ok: true, message: "Message sent successfully." });
    } catch (err) {
      logger.error("Contact form error", { error: err.message });
      res.status(500).json({ error: "Failed to send message. Please try again." });
    }
  }
);

export default router;