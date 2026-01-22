import React, { useEffect, useRef } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";

export default function Callback() {
  const auth = useAuth();
  const navigate = useNavigate();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (auth.isAuthenticated && !hasNavigated.current) {
      hasNavigated.current = true;
      const redirectTo = auth.state?.from || "/";
      navigate(redirectTo, { replace: true });
    }
  }, [auth.isAuthenticated, auth.state, navigate]);

  return <div>Signing you in...</div>;
}