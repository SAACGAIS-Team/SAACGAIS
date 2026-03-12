import express from "express";
import { cognito, USER_POOL_ID } from "../config/cognito.js";

const router = express.Router();

// PUT /api/user/attributes - Update name
router.put("/attributes", async (req, res) => {
  const { given_name, family_name } = req.body;
  const userId = req.user.sub;

  if (!given_name || !family_name) {
    return res.status(400).json({ error: "given_name and family_name are required" });
  }

  try {
    await cognito.adminUpdateUserAttributes({
      UserPoolId: USER_POOL_ID,
      Username: userId,
      UserAttributes: [
        { Name: "given_name", Value: given_name },
        { Name: "family_name", Value: family_name },
      ],
    }).promise();

    res.json({ ok: true, message: "Name updated successfully" });
  } catch (err) {
    console.error("Error updating user attributes:", err);
    if (err.code === "UserNotFoundException") {
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
    // Get the user's email to initiate auth
    const user = await cognito.adminGetUser({
      UserPoolId: USER_POOL_ID,
      Username: userId,
    }).promise();

    const emailAttr = user.UserAttributes.find((a) => a.Name === "email");
    if (!emailAttr) {
      return res.status(400).json({ error: "Could not find user email" });
    }

    // Verify current password is correct by attempting auth
    await cognito.initiateAuth({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: process.env.AWS_COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: emailAttr.Value,
        PASSWORD: currentPassword,
      },
    }).promise();

    // Current password verified — now set the new one
    await cognito.adminSetUserPassword({
      UserPoolId: USER_POOL_ID,
      Username: userId,
      Password: newPassword,
      Permanent: true,
    }).promise();

    res.json({ ok: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Error changing password:", err);
    if (err.code === "NotAuthorizedException") {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    if (err.code === "InvalidPasswordException") {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;