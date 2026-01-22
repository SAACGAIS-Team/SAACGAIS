import { Typography, Box, Chip } from "@mui/material";
import { useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";

function Home() {
  const auth = useAuth();
  const [userGroups, setUserGroups] = useState([]);

  useEffect(() => {
    setUserGroups(auth.user?.profile?.["cognito:groups"] || []);
  }, [auth.user]);

  return (
    <Box sx={{ p: 4, maxWidth: 800}}>
      <Typography variant="h3" sx={{ mb: 2, fontWeight: "bold" }}>
        Welcome to SAACGAIS
      </Typography>

      {auth.isAuthenticated ? (
        <>
          {userGroups.length > 0 ? (
            <>
              <Typography variant="body1" component="p" sx={{ mb: 1, color: "text.secondary" }}>
                You are assigned the following roles:
              </Typography>

              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {userGroups.map((role) => (
                  <Chip key={role} label={role} color="primary" variant="outlined" />
                ))}
              </Box>
            </>
          ) : (
            <Typography variant="body1" component="p" sx={{ mb: 1, color: "text.secondary" }}>
              You are not assigned to any roles
            </Typography>
          )}
        </>
      ) : (
        <Typography variant="body1" component="p" sx={{ color: "text.secondary" }}>
          You are not logged in
        </Typography>
      )}
    </Box>
  );
}

export default Home;
