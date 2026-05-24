import logger from "../services/logger.js";

export default function authorize() {
  return async function (req, res, next) {
    // Skip OPA in test environment — tests don't spin up an OPA server
    if (process.env.NODE_ENV === "test") return next();

    if (!req.authz) {
      return res.status(500).json({ error: "Authorization context missing" });
    }

    try {
      const opaUrl = process.env.OPA_URL || "http://localhost:8181";
      const response = await fetch(`${opaUrl}/v1/data/authz/allow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: req.authz }),
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`OPA HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.result) {
        logger.warn("OPA access denied", {
          userId: req.user?.sub,
          action: req.authz.action,
          resource: req.authz.resource,
          path: req.path,
        });
        return res.status(403).json({ error: "Access denied by policy" });
      }

      next();
    } catch (err) {
      // Fail closed — deny on OPA unavailable (HIPAA §164.312(a)(1))
      logger.error("OPA authorization error", {
        error: err.message,
        userId: req.user?.sub,
        action: req.authz?.action,
      });
      return res.status(503).json({ error: "Authorization service unavailable" });
    }
  };
}