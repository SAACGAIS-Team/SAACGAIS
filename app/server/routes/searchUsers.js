import express from "express";
import * as cognito from "../services/cognitoService.js";

const router = express.Router();

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

// GET /api/search-users?role=&search=
router.get("/", async (req, res) => {
  const { role, search } = req.query;
  try {
    const users = role ? await cognito.listUsersInGroup(role) : await cognito.listAllUsers();
    return res.json(applySearch(users, search));
  } catch (err) {
    console.error("searchUsers error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/search-users/:userId
router.get("/:userId", async (req, res) => {
  try {
    const user = await cognito.getUserById(req.params.userId);
    return res.json(user);
  } catch (err) {
    console.error("AdminGetUser error:", err);
    if (err.name === "UserNotFoundException") {
      return res.status(404).json({ error: "User not found." });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;