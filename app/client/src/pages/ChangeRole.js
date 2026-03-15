import { useEffect, useState } from "react";
import { Box, TextField, Button, Typography, CircularProgress, Autocomplete, Alert, FormControl, InputLabel, Select, MenuItem, Chip, OutlinedInput } from "@mui/material";
import { useAuth } from "../context/AuthContext.js";
import { userService } from "../api.js";
import PageCard from "../components/PageCard.js";

function ChangeRole() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [currentRoles, setCurrentRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [roles, setRoles] = useState([]);
  const { user, refreshUser } = useAuth();

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => {
    const fetchAvailableRoles = async () => {
      try {
        const data = await userService.getUserRoles();
        setRoles(data.roles.map((r) => r.name));
      } catch (err) {
        console.error("Error fetching roles:", err);
        setRoles(["Patient", "Healthcare-Provider", "Administrator"]);
      }
    };
    fetchAvailableRoles();
  }, []);

  useEffect(() => {
    if (!open || !input) { setOptions([]); return; }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await userService.searchUsers(input);
        setOptions(data);
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [input, open]);

  useEffect(() => {
    if (!selected) { setCurrentRoles([]); setSelectedRoles([]); return; }
    const fetchUserRoles = async () => {
      try {
        setLoadingRoles(true);
        const data = await userService.getUserRolesById(selected.sub);
        setCurrentRoles(data.roles || []);
        setSelectedRoles(data.roles || []);
      } catch (err) {
        console.error("Error fetching user roles:", err);
        setCurrentRoles([]);
        setSelectedRoles([]);
      } finally {
        setLoadingRoles(false);
      }
    };
    fetchUserRoles();
  }, [selected]);

  const handleSubmit = async () => {
    if (!selected || selectedRoles.length === 0) return;
    setSubmitting(true);
    setMessage(null);

    try {
      await userService.updateUserRoles({ 
        targetUserId: selected.sub, 
        newRoles: selectedRoles 
      });

      // Update local UI immediately
      setCurrentRoles(selectedRoles);
      showMessage("success", `Successfully updated ${selected.firstName}'s roles`);

      if (selected.sub === user?.sub) {
        await refreshUser(); 
      }
    } catch (err) {
      showMessage("error", err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearForm = () => {
    setSelected(null); setSelectedRoles([]); setInput(""); setMessage(null); setCurrentRoles([]);
  };

  return (
    <PageCard>
      <Typography variant="h4" gutterBottom>Change User Roles</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Search for a user and assign them new roles
      </Typography>

      {message && (
        <Alert
          severity={message.type}
          sx={{ mb: 2 }}
          onClose={() => setMessage(null)}
          action={message.type === "success" ? (
            <Button color="inherit" size="small" onClick={handleClearForm}>Update Another</Button>
          ) : null}
        >
          {message.text}
        </Alert>
      )}

      <Autocomplete
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        options={options}
        loading={loading}
        value={selected}
        inputValue={input}
        onInputChange={(_, v) => setInput(v)}
        onChange={(_, v) => { setSelected(v); setMessage(null); }}
        filterOptions={(x) => x}
        isOptionEqualToValue={(a, b) => a.sub === b.sub}
        getOptionLabel={(o) => {
          const isCurrentUser = o.sub === user?.sub;
          return `${o.firstName} ${o.lastName} (${o.email})${isCurrentUser ? " (You)" : ""}`;
        }}
        renderOption={(props, o) => {
          const isCurrentUser = o.sub === user?.sub;
          return (
            <li {...props} key={o.sub}>
              {o.firstName} {o.lastName} ({o.email})
              {isCurrentUser && <Chip label="You" size="small" sx={{ ml: 1 }} />}
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search User"
            placeholder="Type to search by name..."
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>{loading ? <CircularProgress size={20} /> : null}{params.InputProps.endAdornment}</>
              ),
            }}
          />
        )}
        sx={{ mb: 3 }}
      />

      {selected && (
        <Box sx={{ mb: 3, p: 2, bgcolor: "background.default", borderRadius: 1, border: "1px solid", borderColor: "divider" }}>
          <Typography variant="body2" color="text.secondary">Selected User:</Typography>
          <Typography variant="body1" sx={{ fontWeight: "bold" }}>{selected.firstName} {selected.lastName}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{selected.email}</Typography>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Current Roles:</Typography>
            {loadingRoles ? <CircularProgress size={20} /> : currentRoles.length > 0 ? (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {currentRoles.map((role) => <Chip key={role} label={role} size="small" color="primary" />)}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>No roles assigned</Typography>
            )}
          </Box>
        </Box>
      )}

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>New Roles</InputLabel>
        <Select
          multiple
          value={selectedRoles}
          onChange={(e) => setSelectedRoles(e.target.value)}
          input={<OutlinedInput label="New Roles" />}
          disabled={!selected || loadingRoles || submitting}
          renderValue={(sel) => (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {sel.map((value) => <Chip key={value} label={value} size="small" />)}
            </Box>
          )}
        >
          {roles.map((role) => <MenuItem key={role} value={role}>{role}</MenuItem>)}
        </Select>
      </FormControl>

      <Button
        variant="contained"
        fullWidth
        disabled={!selected || selectedRoles.length === 0 || submitting || loadingRoles}
        onClick={handleSubmit}
      >
        {submitting ? <CircularProgress size={24} color="inherit" /> : "Update Roles"}
      </Button>
    </PageCard>
  );
}

export default ChangeRole;