import { useState, useEffect, useRef } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import SettingsIcon from "@mui/icons-material/Settings";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useThemeMode } from "../context/ThemeContext.js";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { darkMode, setDarkMode } = useThemeMode();
  const menuRef = useRef(null);

  const userGroups = user?.groups || [];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  const getInitials = () => {
    const first = user?.given_name?.[0] || "";
    const last = user?.family_name?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  const getAvatarColor = () => {
    const email = user?.email || "";
    const colors = ["#1d4ed8", "#0f766e", "#7c3aed", "#b45309", "#be123c"];
    const index = email.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const menuItemStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 14px",
    cursor: "pointer",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#e0e0e0",
    whiteSpace: "nowrap",
    transition: "background 0.15s",
  };

  return (
    <AppBar position="static" sx={{ background: "#1a1a1a", boxShadow: "none", borderBottom: "1px solid #2a2a2a" }}>
      <Toolbar sx={{ gap: 1 }}>
        {/* Logo */}
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ flexGrow: 1, textDecoration: "none", color: "#61dafb", fontWeight: "bold" }}
        >
          SAACGAIS
        </Typography>

        {/* Nav links */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Button color="inherit" component={Link} to="/" sx={{ color: "white", fontSize: "12px" }}>
            Home
          </Button>

          {userGroups.includes("Patient") && (
            <Button color="inherit" component={Link} to="/upload" sx={{ color: "white", fontSize: "12px" }}>
              Upload
            </Button>
          )}

          {(userGroups.includes("Healthcare-Provider")) && (
            <Button color="inherit" component={Link} to="/provider-chat" sx={{ color: "white", fontSize: "12px" }}>
              Provider Chat
            </Button>
          )}

          {userGroups.includes("Patient") && (
            <Button color="inherit" component={Link} to="/select-provider" sx={{ color: "white", fontSize: "12px" }}>
              Select Provider
            </Button>
          )}
          

          <Button color="inherit" component={Link} to="/about" sx={{ color: "white", fontSize: "12px" }}>
            About
          </Button>

          <Button color="inherit" component={Link} to="/Team" sx={{ color: "white", fontSize: "12px" }}>
            Team
          </Button>

          {/* Authenticated: avatar dropdown */}
          {isAuthenticated ? (
            <Box ref={menuRef} sx={{ position: "relative", ml: 1 }}>
              {/* Avatar pill trigger */}
              <Box
                onClick={() => setMenuOpen((o) => !o)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#2a2a2a",
                  border: "1px solid #3a3a3a",
                  borderRadius: "20px",
                  padding: "5px 12px 5px 6px",
                  cursor: "pointer",
                  userSelect: "none",
                  "&:hover": { background: "#333" },
                  transition: "background 0.15s",
                }}
              >
                {/* Initials avatar */}
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: getAvatarColor(),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {getInitials()}
                </Box>
                <Typography sx={{ fontSize: "13px", color: "#ddd" }}>
                  {user?.given_name}
                </Typography>
                <Typography sx={{ fontSize: "10px", color: "#888", mt: "1px" }}>▼</Typography>
              </Box>

              {/* Dropdown menu */}
              {menuOpen && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    background: "#1e1e1e",
                    border: "1px solid #333",
                    borderRadius: "12px",
                    padding: "6px",
                    minWidth: "220px",
                    zIndex: 9999,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  }}
                >
                  {/* User info header */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px 10px", borderBottom: "1px solid #2a2a2a", mb: "4px" }}>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: getAvatarColor(),
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {getInitials()}
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: "13px", fontWeight: 500, color: "#eee", lineHeight: 1.3 }}>
                        {user?.given_name} {user?.family_name}
                      </Typography>
                      <Typography sx={{ fontSize: "11px", color: "#888", lineHeight: 1.3 }}>
                        {user?.email}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Account settings */}
                  <Box
                    sx={menuItemStyle}
                    onClick={() => { navigate("/account-settings"); setMenuOpen(false); }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#2a2a2a"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <SettingsIcon sx={{ fontSize: 16, color: "#888" }} />
                    Account settings
                  </Box>

                  {/* Change role — admin only */}
                  {userGroups.includes("Administrator") && (
                    <Box
                      sx={menuItemStyle}
                      onClick={() => { navigate("/change-role"); setMenuOpen(false); }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#2a2a2a"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <SupervisorAccountIcon sx={{ fontSize: 16, color: "#888" }} />
                      Change role
                    </Box>
                  )}

                  {/* Dark mode toggle */}
                  <Box
                    sx={{ ...menuItemStyle, justifyContent: "space-between" }}
                    onClick={() => setDarkMode((d) => !d)}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#2a2a2a"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {darkMode ? <DarkModeIcon sx={{ fontSize: 16, color: "#888" }} /> : <LightModeIcon sx={{ fontSize: 16, color: "orange" }} />}
                      {darkMode ? "Dark mode" : "Light mode"}
                    </Box>
                    {/* Toggle switch */}
                    <Box
                      sx={{
                        width: 32,
                        height: 18,
                        borderRadius: "9px",
                        background: darkMode ? "#38bdf8" : "#444",
                        position: "relative",
                        transition: "background 0.2s",
                        flexShrink: 0,
                      }}
                    >
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: "#fff",
                          position: "absolute",
                          top: "2px",
                          left: darkMode ? "16px" : "2px",
                          transition: "left 0.2s",
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Logout */}
                  <Box sx={{ borderTop: "1px solid #2a2a2a", mt: "4px", pt: "4px" }}>
                    <Box
                      sx={{ ...menuItemStyle, color: "#f87171" }}
                      onClick={handleLogout}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#2a1a1a"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <span style={{ fontSize: "15px" }}>→</span>
                      Log out
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Button color="inherit" sx={{ color: "white", fontSize: "12px" }} onClick={handleLogin}>
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}