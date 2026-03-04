import supabase from "../db.js";
import express from "express";
import authzContext from "../middleware/authzContext.js";
import authorize from "../middleware/authorize.js";

const router = express.Router();

router.get("/", async (req, res) => {
    const userId = req.user.sub; // was: const { user } = req.query

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

router.post("/", async (req, res) => {
    const userId = req.user.sub; // was: const { userId, providerId } = req.body
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


export default router;