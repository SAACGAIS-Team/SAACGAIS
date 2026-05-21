import { useState } from "react";
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Typography, Box, Divider,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import PropTypes from "prop-types";

const SESSION_KEY = "disclaimer_acknowledged";

export default function DisclaimerModal({ open, onAcknowledge }) {
    return (
        <Dialog open={open} maxWidth="sm" fullWidth disableEscapeKeyDown>

            <DialogTitle sx={{ pb: 1.5, pt: 2.5, px: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <WarningAmberIcon color="warning" sx={{ fontSize: 28 }} />
                    <Box>
                        <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                            Research Prototype Notice
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            Oregon State University — CS Capstone Project
                        </Typography>
                    </Box>
                </Box>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{ px: 3, py: 2.5 }}>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, lineHeight: 1.8 }}>
                    This application is a <strong style={{ color: "inherit" }}>proof-of-concept prototype</strong> built
                    for academic research. It is <strong style={{ color: "inherit" }}>not a real healthcare product</strong> and
                    carries no clinical, legal, or regulatory certifications.
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
                        <CheckCircleOutlineIcon sx={{ fontSize: 18, color: "success.main", mt: "2px", flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                            Security and privacy controls were <strong>designed following HIPAA guidelines</strong> as part of our research into securing AI agent communication.
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
                        <CancelOutlinedIcon sx={{ fontSize: 18, color: "error.main", mt: "2px", flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                            This system is <strong>not HIPAA-certified</strong> and provides no legal data protection guarantees.
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
                        <CancelOutlinedIcon sx={{ fontSize: 18, color: "error.main", mt: "2px", flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                            AI-generated responses are <strong>not a substitute for professional clinical judgment</strong>.
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{
                    bgcolor: "#7f1d1d",
                    border: "1px solid #ef4444",
                    borderRadius: 1.5,
                    px: 2, py: 1.5,
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.25,
                }}>
                    <WarningAmberIcon sx={{ fontSize: 18, color: "#fca5a5", mt: "2px", flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: "#fef2f2", fontWeight: 600, lineHeight: 1.7 }}>
                        Do not upload real medical records or personal health information.
                        Use synthetic or fictional data only.
                    </Typography>
                </Box>

            </DialogContent>

            <Divider />

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button variant="contained" onClick={onAcknowledge} fullWidth size="large">
                    I Understand — Continue
                </Button>
            </DialogActions>

        </Dialog>
    );
}

DisclaimerModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onAcknowledge: PropTypes.func.isRequired,
};

export function useDisclaimerModal() {
    const [open, setOpen] = useState(
        () => !sessionStorage.getItem(SESSION_KEY)
    );

    const acknowledge = () => {
        sessionStorage.setItem(SESSION_KEY, "true");
        setOpen(false);
    };

    return { open, acknowledge };
}