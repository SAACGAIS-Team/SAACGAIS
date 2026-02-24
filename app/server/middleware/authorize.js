export default function authorize() {
  return async function (req, res, next) {
    if (!req.authz) {
      return res.status(500).json({ error: "Authorization context missing" });
    }

    try {
      const response = await fetch(
        "http://localhost:8181/v1/data/authz/allow",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: req.authz }),
        }
      );

      if (!response.ok) {
        throw new Error(`OPA HTTP error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.result) {
        return res.status(403).json({ error: "Access denied by policy" });
      }

      next();
    } catch (err) {
      console.error("OPA authorization error:", err);
      return res.status(500).json({ error: "Authorization service failure" });
    }
  };
}