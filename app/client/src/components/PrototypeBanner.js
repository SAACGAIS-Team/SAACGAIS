import { useState } from "react";
import { Alert } from "@mui/material";
import PropTypes from "prop-types";

export default function PrototypeBanner({ message }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <Alert
      severity="info"
      onClose={() => setOpen(false)}
      sx={{ borderRadius: 0, borderBottom: "1px solid", borderColor: "info.main", fontSize: "0.78rem" }}
    >
      <strong>Research Prototype:</strong> {message}
    </Alert>
  );
}

PrototypeBanner.propTypes = {
  message: PropTypes.string.isRequired,
};