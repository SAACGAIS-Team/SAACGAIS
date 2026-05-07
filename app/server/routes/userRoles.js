import express from "express";
import { body, param } from "express-validator";
import * as cognito from "../services/cognitoService.js";
import { handleValidation } from "../middleware/validate.js";
import logger from "../services/logger.js";

const router = express.Router();

const VALID_ROLES = ["Patient", "Healthcare-Provider", "Administrator"];

router.get("/", async (req, res) => {
  try {
    const groups = await cognito.listGroups();
    const roles = groups.map((g) => ({
      name: g.GroupName,
      description: g.Description || "",
      creationDate: g.CreationDate,
      lastModifiedDate: g.LastModifiedDate,
    }));
    res.json({ ok: true, roles });
  } catch (err) {
    logger.error("Error listing roles", { error: err.message });
    res.status(500).json({ error: "Failed to list roles." });
  }
});

router.get("/:userId",
  param("userId").trim().notEmpty().withMessage("userId is required"),
  handleValidation,
  async (req, res) => {
    try {
      const roles = await cognito.getUserGroups(req.params.userId);
      res.json({ ok: true, roles });
    } catch (err) {
      logger.error("Error getting user roles", { error: err.message, userId: req.params.userId });
      if (err.name === "UserNotFoundException") {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(500).json({ error: "Failed to get user roles." });
    }
  }
);

router.post("/",
  body("targetUserId").trim().notEmpty().withMessage("targetUserId is required"),
  body("newRoles").isArray({ min: 1 }).withMessage("newRoles must be a non-empty array"),
  body("newRoles.*").isIn(VALID_ROLES).withMessage(`Each role must be one of: ${VALID_ROLES.join(", ")}`),
  handleValidation,
  async (req, res) => {
    const { targetUserId, newRoles } = req.body;
    try {
      await cognito.setUserGroups(targetUserId, newRoles);
      res.json({ ok: true, message: "Roles changed successfully", newRoles });
    } catch (err) {
      logger.error("Error changing roles", { error: err.message, targetUserId });
      res.status(500).json({ error: "Failed to change roles." });
    }
  }
);

export default router;