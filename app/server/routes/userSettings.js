import express from "express";
import { body } from "express-validator";
import * as cognito from "../services/cognitoService.js";
import { handleValidation } from "../middleware/validate.js";
import logger from "../services/logger.js";

const router = express.Router();

// PUT /api/user/attributes
router.put("/attributes",
  body("given_name").trim().notEmpty().withMessage("First name is required").isLength({ max: 50 }).withMessage("First name too long").escape(),
  body("family_name").trim().notEmpty().withMessage("Last name is required").isLength({ max: 50 }).withMessage("Last name too long").escape(),
  handleValidation,
  async (req, res) => {
    const { given_name, family_name } = req.body;
    const userId = req.user.sub;
    try {
      await cognito.updateUserAttributes(userId, { given_name, family_name });
      res.json({ ok: true, message: "Name updated successfully" });
    } catch (err) {
      logger.error("Error updating user attributes", { error: err.message, userId });
      if (err.name === "UserNotFoundException") {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(500).json({ error: "Failed to update name." });
    }
  }
);

// PUT /api/user/password
router.put("/password",
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").isLength({ min: 8 }).withMessage("Password must be at least 8 characters").isLength({ max: 128 }).withMessage("Password too long"),
  handleValidation,
  async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.sub;
    try {
      const user = await cognito.getUserById(userId);
      if (!user.email) {
        return res.status(400).json({ error: "Could not find user email" });
      }
      await cognito.verifyPassword(user.email, currentPassword);
      await cognito.setUserPassword(userId, newPassword);
      res.json({ ok: true, message: "Password updated successfully" });
    } catch (err) {
      logger.error("Error changing password", { error: err.message, userId });
      if (err.name === "NotAuthorizedException") {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      if (err.name === "InvalidPasswordException") {
        return res.status(400).json({ error: err.message }); // safe — Cognito password policy message
      }
      res.status(500).json({ error: "Failed to update password." });
    }
  }
);

export default router;