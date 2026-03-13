import { Typography, Box, Chip } from "@mui/material";
import { useAuth } from "../context/AuthContext.js";
import PageCard from "../components/PageCard.js";

function Home() {
  const { user, isAuthenticated } = useAuth();
  const userGroups = user?.groups || [];

  return (
    <PageCard>
      <Typography variant="h3" sx={{ mb: 2, fontWeight: "bold" }}>
        Welcome to SAACGAIS
      </Typography>

      {isAuthenticated ? (
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
    </PageCard>
  );
}

export default Home;