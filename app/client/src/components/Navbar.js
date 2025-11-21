import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { Link } from "react-router-dom";
import { useAuth } from "react-oidc-context";

export default function Navbar() {
  const auth = useAuth();

  const handleLogout = () => {
    const clientId = "7lua5mn5k5i6cffirttl5qa5b";
    const logoutUri = "http://localhost:3000/";
    const cognitoDomain = "https://us-east-2c7yjbxcu3.auth.us-east-2.amazoncognito.com";
    auth.removeUser();
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
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
          <Button color="inherit" component={Link} to="/upload" sx={{ color: "white" }}>
            Upload
          </Button>
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
            <Button color="inherit" sx={{ color: "white" }} onClick={() => auth.signinRedirect()}>
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
