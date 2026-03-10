// authorize.js
// Middleware: calls OPA and enforces allow/deny.
// Returns the OPA `reason` field in denial responses so the
// server and client have actionable context.

export default function authorize() {
  return async function (req, res, next) {
    if (!req.authz) {
      return res.status(500).json({ error: "Authorization context missing" });
    }

    try {
      // --- 1. Check allow ---
      const allowRes = await fech(
        "http://localhost:8181/v1/data/saacgais/authz/allow",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: req.authz }),
        }
      );

      if (!allowRes.ok) {
        throw new Error(`OPA HTTP error: ${allowRes.status}`);
      }

      const allowData = await allowRes.json();

      if (!allowData.result) {
        // --- 2. Fetch reason for logging / client response ---
        let reason = "access_denied";
        try {
          const reasonRes = await fetch(
            "http://localhost:8181/v1/data/saacgais/authz/reason",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ input: req.authz }),
            }
          );
          const reasonData = await reasonRes.json();
          reason = reasonData.result ?? "access_denied";
        } catch {
          // reason fetch is best-effort; don't block on it
        }

        console.warn("OPA denied request:", {
          sub: req.authz?.identity?.sub,
          action: req.authz?.action,
          resource: req.authz?.resource,
          reason,
        });

        return res.status(403).json({ error: "Access denied by policy", reason });
      }

      next();
    } catch (err) {
      console.error("OPA authorization error:", err);
      return res.status(500).json({ error: "Authorization service failure" });
    }
  };
}
