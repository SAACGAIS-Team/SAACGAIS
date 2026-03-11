import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

function ConfirmationDialog({ open, title, body, onConfirm, onCancel, loading = false }) {
    return (
        <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{body}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button variant="contained" onClick={onConfirm} disabled={loading}>
                    {loading ? <CircularProgress size={20} /> : "Confirm"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ConfirmationDialog;
