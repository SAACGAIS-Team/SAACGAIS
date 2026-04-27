import { CognitoJwtVerifier } from "aws-jwt-verify";
import * as cognito from "../services/cognitoService.js";
import logger from "../services/logger.js";

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
      logger.error("Error fetching user roles in middleware", { error: gErr.message, userId: payload?.sub });
      req.user.roles = [];
    }

    next();
  } catch (err) {
    logger.error("Token verification failed", { error: err.message });
    return res.status(401).json({ error: "Unauthorized: invalid or expired token." });
  }
}