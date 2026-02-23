import express from "express";
import supabase from "../db.js";
import authzContext from "../middleware/authzContext.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  const { data, error } = await supabase.rpc("ping");

  if (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: error.message });
  }

  res.json({ ok: true, data });
});

export default router;
