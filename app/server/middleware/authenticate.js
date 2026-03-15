import { CognitoJwtVerifier } from "aws-jwt-verify";
import * as cognito from "../services/cognitoService.js";

let verifier = null;
function getVerifier() {
  if (!verifier) {
    verifier = CognitoJwtVerifier.create({
      userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
      tokenUse: "access",
      clientId: process.env.AWS_COGNITO_CLIENT_ID,
    });
  }
  return verifier;
}

export default async function authenticate(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token) return res.status(401).json({ error: "Unauthorized." });

  try {
    const payload = await getVerifier().verify(token);
    req.user = payload;

    try {
      req.user.roles = await cognito.getUserGroups(payload.sub);
    } catch (gErr) {
      console.error("Error fetching user roles in middleware:", gErr);
      req.user.roles = [];
    }

    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(401).json({ error: "Unauthorized: invalid or expired token." });
  }
}