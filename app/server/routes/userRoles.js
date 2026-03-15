import express from "express";
import * as cognito from "../services/cognitoService.js";

const router = express.Router();

// GET /api/user-roles - List all available roles/groups
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
    console.error("Error listing roles:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/user-roles/:userId - Get user's current groups/roles
router.get("/:userId", async (req, res) => {
  try {
    const roles = await cognito.getUserGroups(req.params.userId);
    res.json({ ok: true, roles });
  } catch (err) {
    console.error("Error getting user roles:", err);
    if (err.name === "UserNotFoundException") {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/user-roles - Change user's roles
router.post("/", async (req, res) => {
  const { targetUserId, newRoles } = req.body;

  if (!targetUserId || !newRoles || !Array.isArray(newRoles)) {
    return res.status(400).json({ error: "targetUserId and newRoles (array) are required" });
  }

  try {
    await cognito.setUserGroups(targetUserId, newRoles);
    res.json({ ok: true, message: "Roles changed successfully", newRoles });
  } catch (err) {
    console.error("Error changing roles:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;