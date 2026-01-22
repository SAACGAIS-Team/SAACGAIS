import { useEffect, useState } from "react";
import { Box, TextField, Button, Typography, CircularProgress, Autocomplete, Alert, FormControl, InputLabel, Select, MenuItem, Chip, OutlinedInput } from "@mui/material";
import { useAuth } from "react-oidc-context";
import { triggerRoleUpdate } from "../utils/roleUpdateEvent.js";

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
    const auth = useAuth();

    useEffect(() => {
        const fetchAvailableRoles = async () => {
            try {
                const res = await fetch("http://localhost:3001/api/user-roles");
                const data = await res.json();
                setRoles(data.roles.map(r => r.name));
            } catch (err) {
                console.error("Error fetching roles:", err);
                setRoles(["Patient", "Healthcare-Provider", "Administrator"]);
            }
        };
        
        fetchAvailableRoles();
    }, []);

    useEffect(() => {
        if (!open || !input) {
            setOptions([]);
            return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(async () => {
            try {
                setLoading(true);
                const res = await fetch(
                    `http://localhost:3001/api/search-users?search=${encodeURIComponent(input)}`, 
                    { signal: controller.signal }
                );
                setOptions(await res.json());
            } catch (e) {
                if (e.name !== "AbortError") console.error(e);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => { clearTimeout(timeout); controller.abort(); };
    }, [input, open]);

    useEffect(() => {
        if (!selected) {
            setCurrentRoles([]);
            setSelectedRoles([]);
            return;
        }

        const fetchUserRoles = async () => {
            try {
                setLoadingRoles(true);
                const res = await fetch(
                    `http://localhost:3001/api/user-roles/${selected.sub}`
                );
                
                if (!res.ok) {
                    throw new Error("Failed to fetch user roles");
                }
                
                const data = await res.json();
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
            const userId = auth.user?.profile?.sub;

            if (!userId) {
                setMessage({ type: "error", text: "User not authenticated" });
                return;
            }

            const res = await fetch("http://localhost:3001/api/user-roles", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    adminUserId: userId,
                    targetUserId: selected.sub,
                    newRoles: selectedRoles,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to change roles");
            }

            // Update current roles to show the change immediately
            setCurrentRoles(selectedRoles);
            
            // Show success message
            setMessage({ 
                type: "success", 
                text: `Successfully updated ${selected.firstName} ${selected.lastName}'s roles` 
            });
            
            // Only trigger role update if we modified the current user's roles
            const isCurrentUser = selected.sub === userId;
            if (isCurrentUser) {
                console.log("Updated current user's roles, triggering token refresh...");
                // Trigger after a short delay so success message shows first
                setTimeout(() => {
                    triggerRoleUpdate(selected.sub);
                }, 100);
            } else {
                console.log("Updated another user's roles, no token refresh needed");
            }
            
        } catch (err) {
            console.error("Error changing roles:", err);
            setMessage({ type: "error", text: err.message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleClearForm = () => {
        setSelected(null);
        setSelectedRoles([]);
        setInput("");
        setMessage(null);
        setCurrentRoles([]);
    };

    return (
        <Box sx={{ p: 4, maxWidth: 600 }}>
            <Typography variant="h4" gutterBottom>
                Change User Roles
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Search for a user and assign them new roles
            </Typography>

            {message && (
                <Alert 
                    severity={message.type} 
                    sx={{ mb: 2 }} 
                    onClose={() => setMessage(null)}
                    action={
                        message.type === "success" ? (
                            <Button color="inherit" size="small" onClick={handleClearForm}>
                                Update Another
                            </Button>
                        ) : null
                    }
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
                onChange={(_, v) => {
                    setSelected(v);
                    setMessage(null);
                }}
                filterOptions={(x) => x}
                isOptionEqualToValue={(a, b) => a.sub === b.sub}
                getOptionLabel={(o) => `${o.firstName} ${o.lastName} (${o.email})`}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Search User"
                        placeholder="Type to search by name..."
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {loading ? <CircularProgress size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </>
                            )
                        }}
                    />
                )}
                sx={{ mb: 3 }}
            />

            {selected && (
                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Selected User:
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {selected.firstName} {selected.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {selected.email}
                    </Typography>
                    
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Current Roles:
                        </Typography>
                        {loadingRoles ? (
                            <CircularProgress size={20} />
                        ) : currentRoles.length > 0 ? (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {currentRoles.map((role) => (
                                    <Chip key={role} label={role} size="small" color="primary" />
                                ))}
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                No roles assigned
                            </Typography>
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
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                                <Chip key={value} label={value} size="small" />
                            ))}
                        </Box>
                    )}
                >
                    {roles.map((role) => (
                        <MenuItem key={role} value={role}>
                            {role}
                        </MenuItem>
                    ))}
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
        </Box>
    );
}

export default ChangeRole;