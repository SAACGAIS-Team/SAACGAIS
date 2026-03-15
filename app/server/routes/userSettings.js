import express from "express";
import * as cognito from "../services/cognitoService.js";

const router = express.Router();

// PUT /api/user/attributes - Update name
router.put("/attributes", async (req, res) => {
  const { given_name, family_name } = req.body;
  const userId = req.user.sub;

  if (!given_name || !family_name) {
    return res.status(400).json({ error: "given_name and family_name are required" });
  }

  try {
    await cognito.updateUserAttributes(userId, { given_name, family_name });
    res.json({ ok: true, message: "Name updated successfully" });
  } catch (err) {
    console.error("Error updating user attributes:", err);
    if (err.name === "UserNotFoundException") {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/user/password - Change password
router.put("/password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.sub;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "currentPassword and newPassword are required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  try {
    const user = await cognito.getUserById(userId);
    if (!user.email) {
      return res.status(400).json({ error: "Could not find user email" });
    }

    await cognito.verifyPassword(user.email, currentPassword);
    await cognito.setUserPassword(userId, newPassword);

    res.json({ ok: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Error changing password:", err);
    if (err.name === "NotAuthorizedException") {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    if (err.name === "InvalidPasswordException") {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;