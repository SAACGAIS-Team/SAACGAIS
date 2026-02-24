import jwt from "jsonwebtoken";

export default function authzContext(action, resource, getTarget = () => null) {
  return function (req, res, next) {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(403).json({ error: "Token does not exist" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.log("Token is invalid");
      return res.status(403).json({ error: "Invalid token" });
    }

    const userId = decoded.sub;
    const roles = decoded.roles || [];
    const target = getTarget(req);

    req.authz = {
      identity: {
        sub: userId,
        roles: roles,
      },
      action: action,
      resource: resource,
      target: target,
    };

    next();
  };
}