import * as db from "../services/supabaseService.js";
import express from "express";
import { body } from "express-validator";
import { handleValidation } from "../middleware/validate.js";
import logger from "../services/logger.js";
import authzContext from "../middleware/authzContext.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

router.get("/",
  authzContext("read_provider_selection", "provider_relationship",
    (req) => ({ patientUid: req.user?.sub })),
  authorize(),
  async (req, res) => {
  try {
    const data = await db.getProviderSelection(req.user.sub);
    res.json({ ok: true, data });
  } catch (err) {
    logger.error("Error getting provider", { error: err.message, userId: req.user?.sub });
    res.status(500).json({ error: "Failed to get provider." });
  }
});

router.post("/",
  body("providerId").trim().notEmpty().withMessage("providerId is required").isUUID().withMessage("Invalid providerId format"),
  handleValidation,
  authzContext("select_provider", "provider_relationship",
    (req) => ({ patientUid: req.user?.sub })),
  authorize(),
  async (req, res) => {
    const { providerId } = req.body;
    try {
      await db.deleteProviderSelection(req.user.sub);
      const data = await db.insertProviderSelection(req.user.sub, providerId);
      res.json({ ok: true, message: "Provider assigned successfully", data });
    } catch (err) {
      logger.error("Error setting provider", { error: err.message, userId: req.user?.sub, providerId });
      res.status(500).json({ error: "Failed to set provider." });
    }
  }
);

router.get("/patients",
  authzContext("list_patients", "phi_metadata"),
  authorize(),
  async (req, res) => {
  try {
    const patients = await db.getProviderPatients(req.user.sub);
    res.json({ ok: true, patients });
  } catch (err) {
    logger.error("Error fetching provider patients", { error: err.message, userId: req.user?.sub });
    res.status(500).json({ error: "Failed to fetch patients." });
  }
});

export default router;