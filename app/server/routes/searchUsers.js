import express from "express";
import { cognito, USER_POOL_ID } from "../config/cognito.js";
const authzMiddleware = require("./middleware/authzMiddleware")


const router = express.Router();

router.get("/",
  authzMiddleware("read", "users", () => null), 
      // AUTHORIZATION (authorize function here)
   async (req, res) => {
  const { role, search } = req.query;

  try {
    if (role) {
      // list users in a specific group
      let usersInGroup = await cognito.listUsersInGroup({ UserPoolId: USER_POOL_ID, GroupName: role, Limit: 60 }).promise();
      let users = usersInGroup.Users;

      if (search) {
        const searchLower = search.toLowerCase();
        users = users.filter(u => {
          const first = u.Attributes.find(a => a.Name === "given_name")?.Value.toLowerCase() || "";
          const last = u.Attributes.find(a => a.Name === "family_name")?.Value.toLowerCase() || "";
          const email = u.Attributes.find(a => a.Name === "email")?.Value.toLowerCase() || "";
          return first.includes(searchLower) || last.includes(searchLower) || email.includes(searchLower);
        });
      }

      return res.json(users.map(u => ({
        sub: u.Username,
        firstName: u.Attributes.find(a => a.Name === "given_name")?.Value,
        lastName: u.Attributes.find(a => a.Name === "family_name")?.Value,
        email: u.Attributes.find(a => a.Name === "email")?.Value,
      })));
    }

    // no role, list all users in pool
    let params = {
      UserPoolId: USER_POOL_ID,
      AttributesToGet: ["given_name", "family_name", "email"],
      Limit: 60, // Increased limit
    };

    const allUsers = await cognito.listUsers(params).promise();
    
    let users = allUsers.Users;
    
    // Client-side filtering for better search (contains instead of starts-with)
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(u => {
        const first = u.Attributes.find(a => a.Name === "given_name")?.Value.toLowerCase() || "";
        const last = u.Attributes.find(a => a.Name === "family_name")?.Value.toLowerCase() || "";
        const email = u.Attributes.find(a => a.Name === "email")?.Value.toLowerCase() || "";
        return first.includes(searchLower) || last.includes(searchLower) || email.includes(searchLower);
      });
    }

    res.json(users.map(u => ({
      sub: u.Username,
      firstName: u.Attributes.find(a => a.Name === "given_name")?.Value,
      lastName: u.Attributes.find(a => a.Name === "family_name")?.Value,
      email: u.Attributes.find(a => a.Name === "email")?.Value,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/search-users/:userId - Get a single user by UID
router.get("/:userId",
  authzMiddleware("read", "user", (req) => ({ userId: req.params.userId})), 
      // AUTHORIZATION (authorize function here)
   async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await cognito.adminGetUser({
      UserPoolId: USER_POOL_ID,
      Username: userId
    }).promise();

    const attributes = {};
    user.UserAttributes.forEach(attr => {
      attributes[attr.Name] = attr.Value;
    });

    res.json({
      sub: userId,
      firstName: attributes.given_name,
      lastName: attributes.family_name,
      email: attributes.email,
      phone: attributes.phone_number,
      enabled: user.Enabled,
      status: user.UserStatus
    });
  } catch (err) {
    console.error("Error getting user:", err);
    if (err.code === "UserNotFoundException") {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;