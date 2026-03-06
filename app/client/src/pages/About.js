import { Box, Typography } from "@mui/material";

function About() {
  return (
    <Box sx={{ padding: 4, maxWidth: 900, margin: "0 auto" }}>
      <Typography variant="h4" gutterBottom>
        About Our Project
      </Typography>
      <Typography variant="body1">
        Information about the project goes here.
      </Typography>
    </Box>
  );
}

export default About;