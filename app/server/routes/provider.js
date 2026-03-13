import supabase from "../db.js";
import express from "express";
import authzContext from "../middleware/authzContext.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

// GET /api/provider — get current provider selection (patient view)
router.get("/", async (req, res) => {
    const userId = req.user.sub;

    try {
        const { data, error } = await supabase.rpc("Get_Provider_Selection", {
            user_id: userId
        });

        if (error) {
            console.error("Supabase error:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ ok: true, data });
    } catch (err) {
        console.error("Error getting provider:", err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/provider — set provider selection (patient view)
router.post("/", async (req, res) => {
    const userId = req.user.sub;
    const { providerId } = req.body;

    if (!providerId) {
        return res.status(400).json({ error: "providerId is required" });
    }

    try {
        const { error: deleteError } = await supabase.rpc("Delete_Provider_Selection", {
            patient_uid: userId
        });

        if (deleteError) {
            console.error("Supabase delete error:", deleteError);
            return res.status(500).json({ error: deleteError.message });
        }

        const { data, error: insertError } = await supabase.rpc("Insert_Provider_Selection", {
            patient_uid: userId,
            provider_uid: providerId
        });

        if (insertError) {
            console.error("Supabase insert error:", insertError);
            return res.status(500).json({ error: insertError.message });
        }

        res.json({ ok: true, message: "Provider assigned successfully", data });
    } catch (err) {
        console.error("Error setting provider:", err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/provider/patients — get all patients for the authenticated provider
router.get("/patients", async (req, res) => {
    const providerUid = req.user.sub;
    const userRoles = req.user.roles || [];

    if (!userRoles.includes("Healthcare-Provider")) {
        return res.status(403).json({ error: "Only providers can access this endpoint" });
    }

    try {
        const { data, error } = await supabase.rpc("get_provider_patients", {
            provider_uid: providerUid,
        });

        if (error) {
            console.error("Supabase error:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ ok: true, patients: data });
    } catch (err) {
        console.error("Error fetching provider patients:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;