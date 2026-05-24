import logger from "../services/logger.js";

/**
 * HIPAA §164.312(b) — Audit Controls
 * Logs every PHI access attempt and its outcome.
 *
 * @param {string} action - OPA action name (e.g. "ai_query_provider")
 * @param {(req: import('express').Request) => string[]} getSubjectIds
 *   Returns the patient/user IDs whose PHI is being accessed.
 *   Defaults to the authenticated user's own sub.
 */
export default function auditLog(action, getSubjectIds = (req) => [req.user?.sub]) {
  return function (req, res, next) {
    if (!req.user) return next();

    const subjectIds = getSubjectIds(req) ?? [];
    const attemptedAt = new Date().toISOString();

    logger.info("PHI_AUDIT", {
      event: "access_attempt",
      timestamp: attemptedAt,
      userId: req.user.sub,
      userRoles: req.user.roles ?? [],
      action,
      subjectIds,
      method: req.method,
      path: req.path,
      ip: req.ip,
    });

    // Intercept response end to record outcome
    const originalEnd = res.end.bind(res);
    res.end = function (...args) {
      logger.info("PHI_AUDIT", {
        event: "access_outcome",
        timestamp: new Date().toISOString(),
        userId: req.user?.sub,
        action,
        subjectIds,
        outcome: res.statusCode < 400 ? "success" : "denied",
        statusCode: res.statusCode,
      });
      return originalEnd(...args);
    };

    next();
  };
}
