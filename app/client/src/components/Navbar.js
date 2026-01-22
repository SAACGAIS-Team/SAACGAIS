import { useState, useEffect } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { cognitoAuthConfig } from "../cognitoAuthConfig.js";
import { listenForRoleUpdates } from "../utils/roleUpdateEvent.js";

export default function Navbar() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [userGroups, setUserGroups] = useState([]);
  
  useEffect(() => {
    setUserGroups(auth.user?.profile?.["cognito:groups"] || []);
  }, [auth.user]);

  // Listen for role update events
  useEffect(() => {
    const handleRoleUpdate = async () => {
      console.log("Role update detected, refreshing token...");
      try {
        await auth.signinSilent();
      } catch (err) {
        console.error("Error refreshing token:", err);
      }
    };

    const cleanup = listenForRoleUpdates(handleRoleUpdate);
    return cleanup;
  }, [auth]);

  const handleLogout = async () => {
    navigate("/");
    const clientId = cognitoAuthConfig.client_id;
    const logoutUri = encodeURIComponent(cognitoAuthConfig.post_logout_redirect_uri);
    const cognitoDomain = "https://us-east-2syjjxolri.auth.us-east-2.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${logoutUri}`;
    await auth.removeUser();
  };

  const handleLogin = () => {
    auth.signinRedirect();
  };

  return (
    <AppBar position="static" sx={{ background: "#1a1a1a" }}>
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: "none",
            color: "#61dafb",
            fontWeight: "bold",
          }}
        >
          SAACGAIS
        </Typography>

        <Box>
          <Button color="inherit" component={Link} to="/" sx={{ color: "white" }}>
            Home
          </Button>

          {(userGroups.includes("Patient")) && (
            <Button color="inherit" component={Link} to="/upload" sx={{ color: "white" }}>
              Upload
            </Button>
          )}
          
          {(userGroups.includes("Patient")) && (
            <Button color="inherit" component={Link} to="/select-provider" sx={{ color: "white" }}>
              Select Provider
            </Button>
          )}

          {(userGroups.includes("Administrator")) && (
            <Button color="inherit" component={Link} to="/change-role" sx={{ color: "white" }}>
              Change Role
            </Button>
          )}

          <Button color="inherit" component={Link} to="/about" sx={{ color: "white" }}>
            About
          </Button>
          
          {auth.isAuthenticated ? (
            <>
              <Typography
                variant="body1"
                sx={{
                  display: "inline-block",
                  marginLeft: 2,
                  marginRight: 2,
                  color: "#ccc",
                }}
              >
                {auth.user?.profile?.given_name} {auth.user?.profile?.family_name}
              </Typography>

              <Button color="inherit" sx={{ color: "white" }} onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Button color="inherit" sx={{ color: "white" }} onClick={handleLogin}>
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}