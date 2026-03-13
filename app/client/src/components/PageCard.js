import Box from "@mui/material/Box";
import PropTypes from "prop-types";

export default function PageCard({ children, maxWidth = 900 }) {
  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
        py: 4,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "16px",
          padding: "40px 36px",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

PageCard.propTypes = {
  children: PropTypes.node.isRequired,
  maxWidth: PropTypes.number,
};