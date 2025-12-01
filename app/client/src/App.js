// import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import Navbar from "./components/Navbar.js";
import Home from "./pages/Home.js";
import Upload from "./pages/Upload.js";
import About from "./pages/About.js";
import Callback from "./pages/Callback.js";

function ProtectedRoute({ children, allowedGroups = [] }) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Error: {auth.error.message}</div>;
  }

  if (!auth.isAuthenticated) {
    auth.signinRedirect({ state: { from: location.pathname } });
    return <div>Redirecting to sign in...</div>;
  }

  const userGroups = auth.user?.profile?.["cognito:groups"] || [];
  const isAllowed = allowedGroups.length === 0 || userGroups.some((g) => allowedGroups.includes(g));

  if (!isAllowed) {
    return <div>You do not have permission to view this page.</div>;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedGroups: PropTypes.arrayOf(PropTypes.string),
};

function App() {
  const auth = useAuth();

  return (
    <Router>
      <Navbar auth={auth} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/upload"
          element={
            <ProtectedRoute allowedGroups={["Administrator", "Patient"]}>
              <Upload />
            </ProtectedRoute>
          }
        />
        <Route path="/about" element={<About />} />

        <Route path="/callback" element={<Callback />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
