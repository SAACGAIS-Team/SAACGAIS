export default function csrfCheck(req, res, next) {
  const publicPaths = ['/auth/login', '/auth/signup', '/auth/resend-code', '/auth/confirm', '/auth/csrf-token'];

  if (publicPaths.includes(req.path)) {
    return next();
  }
  
  if (["POST", "PUT", "DELETE"].includes(req.method)) {
    const clientToken = req.headers["x-csrf-token"];
    const cookieToken = req.cookies["XSRF-TOKEN"];

    if (!clientToken || clientToken !== cookieToken) {
      return res.status(403).json({ error: "Invalid CSRF token" });
    }
  }
  next();
}