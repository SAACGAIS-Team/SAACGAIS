import winston from "winston";

// Only let PHI audit entries through to the audit log file
const phiAuditOnly = winston.format((info) => {
  return info.message === "PHI_AUDIT" ? info : false;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    // HIPAA §164.312(b) — persistent audit log for PHI access events
    new winston.transports.File({
      filename: "logs/phi_audit.log",
      format: winston.format.combine(
        phiAuditOnly(),
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});

export default logger;