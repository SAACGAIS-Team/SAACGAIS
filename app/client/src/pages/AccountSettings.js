import { useState } from "react";
import { Box, Typography, TextField, Button, Alert, Chip, Paper, Divider } from "@mui/material";
import { useAuth } from "react-oidc-context";
import { userService } from "../api.js";

export default function AccountSettings() {
  const auth = useAuth();
  const userGroups = auth.user?.profile?.["cognito:groups"] || [];

  const [nameForm, setNameForm] = useState({
    given_name: auth.user?.profile?.given_name || "",
    family_name: auth.user?.profile?.family_name || "",
  });
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleNameSubmit = async () => {
    setNameSuccess(false);
    setNameError("");
    try {
        await userService.updateUserAttributes({
        given_name: nameForm.given_name,
        family_name: nameForm.family_name,
        }, auth.user?.id_token);
        await auth.signinSilent(); // refreshes token so navbar name updates immediately
        setNameSuccess(true);
    } catch (err) {
        setNameError(err.message || "Failed to update name. Please try again.");
    }
  };

  const handlePasswordSubmit = async () => {
    setPasswordSuccess(false);
    setPasswordError("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordError("New passwords do not match.");
        return;
    }
    if (passwordForm.newPassword.length < 8) {
        setPasswordError("Password must be at least 8 characters.");
        return;
    }
    try {
        await userService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        }, auth.user?.id_token);
        setPasswordSuccess(true);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
        setPasswordError(err.message || "Failed to update password. Please try again.");
    }
  };

  const sectionStyle = {
    p: 3,
    mb: 3,
    borderRadius: 2,
    border: "1px solid",
    borderColor: "divider",
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", mt: 6, px: 2, pb: 6 }}>
      <Typography variant="h5" fontWeight={500} mb={1}>
        Account Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Manage your name, password, and role
      </Typography>

      {/* Current Role */}
      <Paper elevation={0} sx={sectionStyle}>
        <Typography variant="subtitle1" fontWeight={500} mb={2}>
          {userGroups.length === 1 ? "Current Role" : "Current Roles"}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {userGroups.length > 0 ? (
            userGroups.map((group) => (
              <Chip key={group} label={group} variant="outlined" size="small" />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              No roles assigned
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Name & Email */}
      <Paper elevation={0} sx={sectionStyle}>
        <Typography variant="subtitle1" fontWeight={500} mb={1}>
          Name & Email
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Email: {auth.user?.profile?.email}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            label="First name"
            size="small"
            fullWidth
            value={nameForm.given_name}
            onChange={(e) =>
              setNameForm({ ...nameForm, given_name: e.target.value })
            }
          />
          <TextField
            label="Last name"
            size="small"
            fullWidth
            value={nameForm.family_name}
            onChange={(e) =>
              setNameForm({ ...nameForm, family_name: e.target.value })
            }
          />
        </Box>
        {nameSuccess && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNameSuccess(false)}>
            Name updated successfully.
          </Alert>
        )}
        {nameError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setNameError("")}>
            {nameError}
          </Alert>
        )}
        <Button variant="contained" size="small" onClick={handleNameSubmit}>
          Save name
        </Button>
      </Paper>

      {/* Change Password */}
      <Paper elevation={0} sx={sectionStyle}>
        <Typography variant="subtitle1" fontWeight={500} mb={1}>
          Change Password
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Must be at least 8 characters
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
          <TextField
            label="Current password"
            type="password"
            size="small"
            fullWidth
            value={passwordForm.currentPassword}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
            }
          />
          <TextField
            label="New password"
            type="password"
            size="small"
            fullWidth
            value={passwordForm.newPassword}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, newPassword: e.target.value })
            }
          />
          <TextField
            label="Confirm new password"
            type="password"
            size="small"
            fullWidth
            value={passwordForm.confirmPassword}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
            }
          />
        </Box>
        {passwordSuccess && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setPasswordSuccess(false)}>
            Password updated successfully.
          </Alert>
        )}
        {passwordError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPasswordError("")}>
            {passwordError}
          </Alert>
        )}
        <Button variant="contained" size="small" onClick={handlePasswordSubmit}>
          Update password
        </Button>
      </Paper>
    </Box>
  );
}