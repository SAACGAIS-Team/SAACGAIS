import React, { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";

export default function Callback() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated) {
      const redirectTo = auth.state?.from || "/";
      navigate(redirectTo, { replace: true });
    }
  }, [auth.isAuthenticated, auth.state, navigate]);

  return <div>Signing you in...</div>;
}
