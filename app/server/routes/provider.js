import supabase from "../db.js";
import express from "express";
const router = express.Router();
const authzMiddleware = require("./middleware/authzMiddleware")


router.get("/", 
    authzMiddleware("read", "provider_selection",(req) => ({ userId: req.query.user})), 
    // AUTHORIZATION (authorize function here)
    async (req, res) => {
    const { user } = req.query;

    if (!user) {
        return res.status(400).json({ error: "User ID is required" });
    }

    try {
        const { data, error } = await supabase.rpc("Get_Provider_Selection", {
            user_id: user
        });

        if (error) {
            console.error("Supabase error:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ 
            ok: true, 
            data
        });
    } catch (err) {
        console.error("Error getting provider:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post("/",
    authzMiddleware("update", "provider_selection", (req) => ({userId: req.body.userId})), 
    // AUTHORIZATION (authorize function here)
     async (req, res) => {
    const { userId, providerId } = req.body;

    if (!userId || !providerId) {
        return res.status(400).json({ 
            error: "userId and providerId are required" 
        });
    }

    try {
        // First, delete existing provider selection
        const { error: deleteError } = await supabase.rpc("Delete_Provider_Selection", {
            patient_uid: userId
        });

        if (deleteError) {
            console.error("Supabase delete error:", deleteError);
            return res.status(500).json({ error: deleteError.message });
        }

        // Then, insert new provider selection
        const { data, error: insertError } = await supabase.rpc("Insert_Provider_Selection", {
            patient_uid: userId,
            provider_uid: providerId
        });

        if (insertError) {
            console.error("Supabase insert error:", insertError);
            return res.status(500).json({ error: insertError.message });
        }

        res.json({ 
            ok: true,
            message: "Provider assigned successfully",
            data: data
        });
    } catch (err) {
        console.error("Error setting provider:", err);
        res.status(500).json({ error: err.message });
    }
});


export default router;