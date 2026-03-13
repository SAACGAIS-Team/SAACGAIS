import express from "express";
import {
  CognitoIdentityProviderClient,
  ListUsersInGroupCommand,
  ListUsersCommand,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const router = express.Router();

let _cognitoClient = null;
function getCognitoClient() {
  if (!_cognitoClient) {
    _cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.AWS_COGNITO_REGION,
      credentials: {
        accessKeyId: process.env.AWS_BACKEND_KEY,
        secretAccessKey: process.env.AWS_BACKEND_SECRET,
      },
    });
  }
  return _cognitoClient;
}

function getUserPoolId() {
  return process.env.AWS_COGNITO_USER_POOL_ID;
}

// Helper: extract attributes array into a plain object
function attrsToObj(attributes) {
  return Object.fromEntries(attributes.map((a) => [a.Name, a.Value]));
}

// Helper: format a user record consistently
function formatUser(attrs, username) {
  return {
    sub:         username,
    firstName:   attrs.given_name   || null,
    lastName:    attrs.family_name  || null,
    email:       attrs.email        || null,
    phone:       attrs.phone_number || null,
    birthdate:   attrs.birthdate    || null,
  };
}

// Helper: filter users by search string across name + email
function applySearch(users, search) {
  if (!search) return users;
  const q = search.toLowerCase();
  return users.filter(({ firstName, lastName, email }) =>
    (firstName || "").toLowerCase().includes(q) ||
    (lastName  || "").toLowerCase().includes(q) ||
    (email     || "").toLowerCase().includes(q)
  );
}

// GET /api/search-users?role=Patient&search=nick
router.get("/", async (req, res) => {
  const { role, search } = req.query;

  try {
    if (role) {
      // List users in a specific Cognito group
      const command = new ListUsersInGroupCommand({
        UserPoolId: getUserPoolId(),
        GroupName: role,
        Limit: 60,
      });

      const response = await getCognitoClient().send(command);
      let users = (response.Users || []).map((u) =>
        formatUser(attrsToObj(u.Attributes), u.Username)
      );

      return res.json(applySearch(users, search));
    }

    // No role — list all users in the pool
    const command = new ListUsersCommand({
      UserPoolId: getUserPoolId(),
      AttributesToGet: [
        "given_name",
        "family_name",
        "email",
        "phone_number",
        "birthdate",
      ],
      Limit: 60,
    });

    const response = await getCognitoClient().send(command);
    let users = (response.Users || []).map((u) =>
      formatUser(attrsToObj(u.Attributes), u.Username)
    );

    return res.json(applySearch(users, search));
  } catch (err) {
    console.error("searchUsers error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/search-users/:userId
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const command = new AdminGetUserCommand({
      UserPoolId: getUserPoolId(),
      Username: userId,
    });

    const user = await getCognitoClient().send(command);
    const attrs = attrsToObj(user.UserAttributes);

    return res.json({
      ...formatUser(attrs, userId),
      enabled: user.Enabled,
      status:  user.UserStatus,
    });
  } catch (err) {
    console.error("AdminGetUser error:", err);

    if (err.name === "UserNotFoundException") {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(500).json({ error: err.message });
  }
});

export default router;