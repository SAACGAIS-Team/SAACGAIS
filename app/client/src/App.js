import PropTypes from "prop-types";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.js";
import Navbar from "./components/Navbar.js";
import Home from "./pages/Home.js";
import Upload from "./pages/Upload.js";
import SelectProvider from "./pages/SelectProvider.js";
import ChangeRole from "./pages/ChangeRole.js";
import About from "./pages/About.js";
import Chat from "./pages/Chat.js";
import AccountSettings from "./pages/AccountSettings.js";
import Login from "./pages/Login.js";
import Signup from "./pages/Signup.js";

function ProtectedRoute({ children, allowedGroups = [] }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const userGroups = user?.groups || [];
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
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/upload"
          element={
            <ProtectedRoute allowedGroups={["Patient"]}>
              <Upload />
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute allowedGroups={["Patient", "Healthcare-Provider"]}>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/select-provider"
          element={
            <ProtectedRoute allowedGroups={["Patient"]}>
              <SelectProvider />
            </ProtectedRoute>
          }
        />

        <Route
          path="/change-role"
          element={
            <ProtectedRoute allowedGroups={["Administrator"]}>
              <ChangeRole />
            </ProtectedRoute>
          }
        />

        <Route
          path="/account-settings"
          element={
            <ProtectedRoute>
              <AccountSettings />
            </ProtectedRoute>
          }
        />

        <Route path="/about" element={<About />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;