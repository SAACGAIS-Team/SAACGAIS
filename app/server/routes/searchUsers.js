import express from "express";
import * as cognito from "../services/cognitoService.js";
import logger from "../services/logger.js";

const router = express.Router();

function applySearch(users, search) {
  if (!search) return users;
  const q = search.toLowerCase();
  return users.filter(({ firstName, lastName, email }) =>
    (firstName || "").toLowerCase().includes(q) ||
    (lastName || "").toLowerCase().includes(q) ||
    (email || "").toLowerCase().includes(q)
  );
}

// GET /api/search-users?role=&search=
router.get("/", async (req, res) => {
  const { role, search } = req.query;
  try {
    const users = role ? await cognito.listUsersInGroup(role) : await cognito.listAllUsers();
    return res.json(applySearch(users, search));
  } catch (err) {
    logger.error("searchUsers error", { error: err.message, errorName: err.name });
    res.status(500).json({ error: "Failed to search users." });
  }
});

// GET /api/search-users/:userId
router.get("/:userId", async (req, res) => {
  try {
    const user = await cognito.getUserById(req.params.userId);
    return res.json(user);
  } catch (err) {
    logger.error("AdminGetUser error", { error: err.message, errorName: err.name, userId: req.params.userId });
    if (err.name === "UserNotFoundException") {
      return res.status(404).json({ error: "User not found." });
    }
    res.status(500).json({ error: "Failed to get user." });
  }
});

export default router;