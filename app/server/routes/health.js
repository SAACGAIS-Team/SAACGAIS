import express from "express";
import supabase from "../db.js";
import logger from "../services/logger.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  const { data, error } = await supabase.rpc("ping");

  if (error) {
    logger.error("Health check failed", { error: error.message });
    return res.status(500).json({ ok: false, error: "Service unavailable." });
  }

  res.json({ ok: true, data });
});

export default router;