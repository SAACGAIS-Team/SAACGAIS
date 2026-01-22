// routes/userRoles.js
import express from "express";
import { cognito, USER_POOL_ID } from "../config/cognito.js";

const router = express.Router();

// GET /api/user-roles - List all available roles/groups
router.get("/", async (req, res) => {
    try {
        const groups = await cognito.listGroups({
            UserPoolId: USER_POOL_ID,
            Limit: 60
        }).promise();

        const roles = groups.Groups.map(group => ({
            name: group.GroupName,
            description: group.Description || "",
            creationDate: group.CreationDate,
            lastModifiedDate: group.LastModifiedDate
        }));

        res.json({ 
            ok: true,
            roles: roles
        });
    } catch (err) {
        console.error("Error listing roles:", err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/user-roles/:userId - Get user's current groups/roles
router.get("/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const userGroups = await cognito.adminListGroupsForUser({
            UserPoolId: USER_POOL_ID,
            Username: userId
        }).promise();

        const roles = userGroups.Groups.map(group => group.GroupName);

        res.json({ 
            ok: true,
            roles: roles
        });
    } catch (err) {
        console.error("Error getting user roles:", err);
        if (err.code === "UserNotFoundException") {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(500).json({ error: err.message });
    }
});

// POST /api/user-roles - Change user's roles
router.post("/", async (req, res) => {
    const { adminUserId, targetUserId, newRoles } = req.body;

    if (!adminUserId || !targetUserId || !newRoles || !Array.isArray(newRoles)) {
        return res.status(400).json({ 
            error: "adminUserId, targetUserId, and newRoles (array) are required" 
        });
    }

    try {
        const userGroups = await cognito.adminListGroupsForUser({
            UserPoolId: USER_POOL_ID,
            Username: targetUserId
        }).promise();

        for (const group of userGroups.Groups) {
            await cognito.adminRemoveUserFromGroup({
                UserPoolId: USER_POOL_ID,
                Username: targetUserId,
                GroupName: group.GroupName
            }).promise();
        }

        for (const role of newRoles) {
            await cognito.adminAddUserToGroup({
                UserPoolId: USER_POOL_ID,
                Username: targetUserId,
                GroupName: role
            }).promise();
        }

        res.json({ 
            ok: true,
            message: "Roles changed successfully",
            newRoles: newRoles
        });
    } catch (err) {
        console.error("Error changing roles:", err);
        res.status(500).json({ error: err.message });
    }
});

export default router;