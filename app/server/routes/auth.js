import express from "express";
import crypto from "crypto";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  GlobalSignOutCommand,
  GetUserCommand,
  ResendConfirmationCodeCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const router = express.Router();

// Lazy initialization to avoid ESM hoisting issue where env vars
// are not loaded yet when the module is first evaluated.
let _cognitoClient = null;
function getCognitoClient() {
  if (!_cognitoClient) {
    _cognitoClient = new CognitoIdentityProviderClient({
      region: process.env.AWS_COGNITO_REGION || "us-east-2",
    });
  }
  return _cognitoClient;
}

function getClientId() {
  return process.env.AWS_COGNITO_CLIENT_ID;
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 60 * 60 * 1000, // 1 hour
  path: "/",
};

const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// Must exactly match COOKIE_OPTIONS (minus maxAge) for clearCookie to work.
// Any mismatch in sameSite, secure, httpOnly, or path means the browser
// won't recognize them as the same cookie and won't clear them.
const CLEAR_OPTIONS = {
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

// POST /auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const command = new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: getClientId(),
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    });

    const response = await getCognitoClient().send(command);
    const { AuthenticationResult } = response;

    if (!AuthenticationResult) {
      // Handle challenges (e.g. NEW_PASSWORD_REQUIRED)
      return res.status(200).json({
        challenge: response.ChallengeName,
        session: response.Session,
      });
    }

    res.cookie("access_token", AuthenticationResult.AccessToken, COOKIE_OPTIONS);
    res.cookie("id_token", AuthenticationResult.IdToken, COOKIE_OPTIONS);
    res.cookie("refresh_token", AuthenticationResult.RefreshToken, REFRESH_COOKIE_OPTIONS);

    // Fetch user profile
    const userCommand = new GetUserCommand({
      AccessToken: AuthenticationResult.AccessToken,
    });
    const userResponse = await getCognitoClient().send(userCommand);
    const attrs = Object.fromEntries(
      userResponse.UserAttributes.map((a) => [a.Name, a.Value])
    );

    return res.status(200).json({
      user: {
        email: attrs.email,
        given_name: attrs.given_name,
        family_name: attrs.family_name,
        groups: [], // groups come from the ID token — parsed client-side or via a separate admin call
      },
    });
  } catch (err) {
    console.error("Login error:", err);

    if (err.name === "NotAuthorizedException") {
      return res.status(401).json({ error: "Incorrect email or password." });
    }
    if (err.name === "UserNotConfirmedException") {
      return res.status(403).json({ error: "USER_NOT_CONFIRMED", email });
    }
    if (err.name === "UserNotFoundException") {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    return res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// POST /auth/signup
router.post("/signup", async (req, res) => {
  const { email, password, given_name, family_name, birthdate, phone_number } = req.body;

  if (!email || !password || !given_name || !family_name || !birthdate || !phone_number) {
    return res.status(400).json({ error: "All fields are required." });
  }

  // Validate birthdate format YYYY-MM-DD (Cognito requirement)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
    return res.status(400).json({ error: "Birthdate must be in YYYY-MM-DD format." });
  }

  // phone_number arrives pre-assembled from the frontend as E.164
  // (country code dropdown + digits). Strip whitespace and validate.
  const normalizedPhone = phone_number.replace(/\s+/g, "");

  if (!/^\+\d{7,15}$/.test(normalizedPhone)) {
    return res.status(400).json({ error: "Invalid phone number. Must be in E.164 format (e.g. +15551234567)." });
  }

  try {
    const command = new SignUpCommand({
      ClientId: getClientId(),
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: "email",        Value: email },
        { Name: "given_name",   Value: given_name },
        { Name: "family_name",  Value: family_name },
        { Name: "birthdate",    Value: birthdate },
        { Name: "phone_number", Value: normalizedPhone },
      ],
    });

    await getCognitoClient().send(command);

    return res.status(200).json({
      message: "Signup successful. Check your email for a verification code.",
      email,
    });
  } catch (err) {
    console.error("Signup error:", err);

    if (err.name === "UsernameExistsException") {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    if (err.name === "InvalidPasswordException") {
      return res.status(400).json({ error: err.message });
    }
    if (err.name === "InvalidParameterException") {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: "Signup failed. Please try again." });
  }
});

// POST /auth/confirm
router.post("/confirm", async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: "Email and confirmation code are required." });
  }

  try {
    const command = new ConfirmSignUpCommand({
      ClientId: getClientId(),
      Username: email,
      ConfirmationCode: code,
    });

    await getCognitoClient().send(command);

    return res.status(200).json({ message: "Email confirmed. You can now log in." });
  } catch (err) {
    console.error("Confirm error:", err);

    if (err.name === "CodeMismatchException") {
      return res.status(400).json({ error: "Invalid verification code." });
    }
    if (err.name === "ExpiredCodeException") {
      return res.status(400).json({ error: "Code expired. Please request a new one." });
    }

    return res.status(500).json({ error: "Confirmation failed. Please try again." });
  }
});

// POST /auth/resend-code
router.post("/resend-code", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    const command = new ResendConfirmationCodeCommand({
      ClientId: getClientId(),
      Username: email,
    });

    await getCognitoClient().send(command);

    return res.status(200).json({ message: "Verification code resent." });
  } catch (err) {
    console.error("Resend error:", err);
    return res.status(500).json({ error: "Failed to resend code." });
  }
});

// POST /auth/refresh
router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token." });
  }

  try {
    const command = new InitiateAuthCommand({
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: getClientId(),
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    const response = await getCognitoClient().send(command);
    const { AuthenticationResult } = response;

    res.cookie("access_token", AuthenticationResult.AccessToken, COOKIE_OPTIONS);
    res.cookie("id_token", AuthenticationResult.IdToken, COOKIE_OPTIONS);

    return res.status(200).json({ message: "Token refreshed." });
  } catch (err) {
    console.error("Refresh error:", err);
    res.clearCookie("access_token", CLEAR_OPTIONS);
    res.clearCookie("id_token", CLEAR_OPTIONS);
    res.clearCookie("refresh_token", CLEAR_OPTIONS);
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }
});

// GET /auth/me
router.get("/me", async (req, res) => {
  const accessToken = req.cookies?.access_token;

  if (!accessToken) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  try {
    const command = new GetUserCommand({ AccessToken: accessToken });
    const response = await getCognitoClient().send(command);

    const attrs = Object.fromEntries(
      response.UserAttributes.map((a) => [a.Name, a.Value])
    );

    // Parse groups from ID token
    const idToken = req.cookies?.id_token;
    let groups = [];
    if (idToken) {
      try {
        const payload = JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString());
        groups = payload["cognito:groups"] || [];
      } catch {}
    }

    return res.status(200).json({
      user: {
        email: attrs.email,
        given_name: attrs.given_name,
        family_name: attrs.family_name,
        sub: attrs.sub,
        groups,
      },
    });
  } catch (err) {
    console.error("Me error:", err);

    // Try to refresh if access token is expired
    if (err.name === "NotAuthorizedException") {
      return res.status(401).json({ error: "Token expired.", code: "TOKEN_EXPIRED" });
    }

    return res.status(401).json({ error: "Not authenticated." });
  }
});

// POST /auth/logout
router.post("/logout", async (req, res) => {
  const accessToken = req.cookies?.access_token;

  if (accessToken) {
    try {
      const command = new GlobalSignOutCommand({ AccessToken: accessToken });
      await getCognitoClient().send(command);
    } catch (err) {
      console.warn("GlobalSignOut failed (token may already be expired):", err.message);
    }
  }

  res.clearCookie("access_token", CLEAR_OPTIONS);
  res.clearCookie("id_token", CLEAR_OPTIONS);
  res.clearCookie("refresh_token", CLEAR_OPTIONS);
  res.clearCookie("XSRF-TOKEN", { path: "/" });

  return res.status(200).json({ message: "Logged out." });
});

// GET /auth/csrf-token
router.get("/csrf-token", (req, res) => {
  const csrfToken = crypto.randomBytes(32).toString("hex");
  res.cookie("XSRF-TOKEN", csrfToken, {
    httpOnly: false, // must be readable by JS
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
  res.status(200).json({ csrfToken });
});

export default router;