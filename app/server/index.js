import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import healthRoutes from "./routes/health.js";
import bedrockRoute from "./routes/aiAgent.js";
import searchUsersRoute from "./routes/searchUsers.js";
import providerRoute from "./routes/provider.js";
import userRolesRoute from "./routes/userRoles.js";

const app = express();
app.use(express.json());

app.use(cors({ origin: "http://localhost:3000" }));

app.use("/api/health", healthRoutes);
app.use("/api/ai", bedrockRoute);
app.use("/api/search-users", searchUsersRoute);
app.use("/api/provider", providerRoute);
app.use("/api/user-roles", userRolesRoute);

if (process.env.NODE_ENV !== 'test') {
  app.listen(3001, () => {
    console.log("Server running on port 3001");
  });
}

export default app;