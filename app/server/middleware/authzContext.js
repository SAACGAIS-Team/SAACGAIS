export default function authzContext(action, resource, getTarget = () => null) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    req.authz = {
      identity: {
        sub: req.user.sub,
        roles: req.user.roles,
      },
      action,
      resource,
      target: getTarget(req),
    };

    next();
  };
}