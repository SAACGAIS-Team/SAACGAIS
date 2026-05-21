import PropTypes from "prop-types";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.js";
import Navbar from "./components/Navbar.js";
import Home from "./pages/Home.js";
import Upload from "./pages/Upload.js";
import SelectProvider from "./pages/SelectProvider.js";
import ChangeRole from "./pages/ChangeRole.js";
import ProviderChat from "./pages/ProviderChat.js";
import PatientChat from "./pages/PatientChat.js";
import Contact from "./pages/Contact.js";
import AccountSettings from "./pages/AccountSettings.js";
import Login from "./pages/Login.js";
import Signup from "./pages/Signup.js";
import ErrorBoundary from "./components/ErrorBoundary.js";
import DisclaimerModal, { useDisclaimerModal } from "./components/DisclaimerModal.js";

function ProtectedRoute({ children, allowedGroups = [] }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <div>Loading...</div>;

  // Redirect to home if disclaimer hasn't been acknowledged yet
  if (!sessionStorage.getItem("disclaimer_acknowledged")) {
    return <Navigate to="/" replace />;
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
  const { open, acknowledge } = useDisclaimerModal();

  return (
    <ErrorBoundary>
      <Router>
        <Navbar />
        <DisclaimerModal open={open} onAcknowledge={acknowledge} />

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
            path="/provider-chat"
            element={
              <ProtectedRoute allowedGroups={["Healthcare-Provider"]}>
                <ProviderChat />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient-chat"
            element={
              <ProtectedRoute allowedGroups={["Patient"]}>
                <PatientChat />
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

          <Route path="/contact" element={<Contact />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;