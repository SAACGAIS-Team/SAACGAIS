import { Typography } from "@mui/material";
import PageCard from "../components/PageCard.js";

function About() {
  return (
    <PageCard>
      <Typography variant="h4" gutterBottom>
        About Our Project
      </Typography>
      <Typography variant="body1">
        Information about the project goes here.
      </Typography>
    </PageCard>
  );
}

export default About;