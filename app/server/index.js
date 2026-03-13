import dotenv from "dotenv";
dotenv.config();

import helmet from "helmet";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import authenticate from "./middleware/authenticate.js";
import authRoutes from "./routes/auth.js";
import healthRoutes from "./routes/health.js";
import bedrockRoute from "./routes/aiAgent.js";
import searchUsersRoute from "./routes/searchUsers.js";
import providerRoute from "./routes/provider.js";
import userRolesRoute from "./routes/userRoles.js";
import uploadRoute from "./routes/upload.js";
import userSettingsRouter from "./routes/userSettings.js";
import csrfCheck from "./middleware/csrf.js";

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(csrfCheck);

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true, // required for cookies to be sent cross-origin
  })
);

// Public routes
app.use("/api/health", healthRoutes);
app.use("/auth", authRoutes);

// ANYTHING BELOW THIS LINE REQUIRES AUTHENTICATION
app.use(authenticate);

app.use("/api/ai", bedrockRoute);
app.use("/api/search-users", searchUsersRoute);
app.use("/api/provider", providerRoute);
app.use("/api/user-roles", userRolesRoute);
app.use("/api/upload", uploadRoute);
app.use("/api/user", userSettingsRouter);

if (process.env.NODE_ENV !== "test") {
  app.listen(3001, () => {
    console.log("Server running on port 3001");
  });
}

export default app;