import * as db from "../services/supabaseService.js";
import express from "express";

const router = express.Router();

// GET /api/provider — get current provider selection (patient view)
router.get("/", async (req, res) => {
  try {
    const data = await db.getProviderSelection(req.user.sub);
    res.json({ ok: true, data });
  } catch (err) {
    console.error("Error getting provider:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/provider — set provider selection (patient view)
router.post("/", async (req, res) => {
  const { providerId } = req.body;
  if (!providerId) return res.status(400).json({ error: "providerId is required" });

  try {
    await db.deleteProviderSelection(req.user.sub);
    const data = await db.insertProviderSelection(req.user.sub, providerId);
    res.json({ ok: true, message: "Provider assigned successfully", data });
  } catch (err) {
    console.error("Error setting provider:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/provider/patients — get all patients for the authenticated provider
router.get("/patients", async (req, res) => {
  const userRoles = req.user.roles || [];

  if (!userRoles.includes("Healthcare-Provider")) {
    return res.status(403).json({ error: "Only providers can access this endpoint" });
  }

  try {
    const patients = await db.getProviderPatients(req.user.sub);
    res.json({ ok: true, patients });
  } catch (err) {
    console.error("Error fetching provider patients:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;