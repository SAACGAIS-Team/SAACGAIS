import helmet from "helmet";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
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
import logger from "./services/logger.js";
import contactRoute from "./routes/contact.js";

const app = express();

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: { error: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => process.env.NODE_ENV === "test",
  skipSuccessfulRequests: true,
  message: { error: "Too many attempts, please try again later." },
});

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.use((req, _res, next) => {
  logger.info("Request", { method: req.method, path: req.path });
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = process.env.CLIENT_URL || "http://localhost:3000";
      if (!origin || origin === allowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(generalLimiter);

// Public routes
app.use("/api/health", healthRoutes);
app.use("/auth/login", authLimiter);
app.use("/auth/signup", authLimiter);
app.use("/auth/resend-code", authLimiter);
app.use("/api/contact", contactRoute);
app.use("/auth", authRoutes);

// ANYTHING BELOW THIS LINE REQUIRES AUTHENTICATION
app.use(csrfCheck);
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