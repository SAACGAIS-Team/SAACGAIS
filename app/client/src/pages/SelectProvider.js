import { useEffect, useState } from "react";
import { Box, TextField, Button, Typography, CircularProgress, Autocomplete, Alert } from "@mui/material";
import { useAuth } from "react-oidc-context";
import { providerService, userService } from "../api.js";
import ConfirmationDialog from "../components/ConfirmationDialog.js";

function SelectProvider() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [options, setOptions] = useState([]);
    const [selected, setSelected] = useState(null);
    const [currentProvider, setCurrentProvider] = useState(null);
    const [loadingCurrentProvider, setLoadingCurrentProvider] = useState(true);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const auth = useAuth();

    const showMessage = (type, text) => {
        setMessage({ type: type, text: text });
        setTimeout(() => setMessage(null), 5000);
    };

    useEffect(() => {
        // Keep showing loading while auth is loading
        if (auth.isLoading) {
            setLoadingCurrentProvider(true);
            return;
        }

        const controller = new AbortController();
        
        const fetchProviders = async () => {
            try {
                setLoadingCurrentProvider(true);

                const userId = auth.user?.profile?.sub;
                const token = auth.user?.id_token;
                
                if (!userId) {
                    console.log("User not authenticated");
                    setLoadingCurrentProvider(false);
                    setCurrentProvider(null);
                    return;
                }

                const response = await providerService.getByUserId(token);
                
                if (response.ok && response.data && response.data.Provider_UID) {
                    const providerInfo = await userService.getUserById(response.data.Provider_UID, token);
                    
                    setCurrentProvider({
                        ...providerInfo,
                        selectionTime: response.data.Selection_Time
                    });
                } else {
                    setCurrentProvider(null);
                }
            } catch (e) {
                if (e.name !== 'AbortError') {
                    console.error("Error fetching providers:", e);
                    setCurrentProvider(null);
                }
            } finally {
                setLoadingCurrentProvider(false);
            }
        };

        fetchProviders();

        return () => controller.abort();
    }, [auth.user, auth.isLoading]);

    useEffect(() => {
        if (!open || !input) return setOptions([]);

        const controller = new AbortController();
        const timeout = setTimeout(async () => {
            try {
                setLoading(true);
                const data = await userService.searchUsersByRole("Healthcare-Provider", input, auth.user?.id_token);
                setOptions(data);
            } catch (e) {
                if (e.name !== "AbortError") console.error(e);
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => { clearTimeout(timeout); controller.abort(); };
    }, [input, open]);

    const handleSubmit = async () => {
        if (!selected) return;

        setSubmitting(true);
        setMessage(null);

        try {
            const userId = auth.user?.profile?.sub;
            const token = auth.user?.id_token;

            if (!userId) {
                showMessage("error", "User not authenticated");
                return;
            }

            await providerService.selectProvider({ providerId: selected.sub }, token);

            showMessage("success", "Provider updated successfully!");
            
            setCurrentProvider({
                ...selected,
                selectionTime: new Date().toISOString()
            });
            
            setSelected(null);
            setInput("");
            setConfirmOpen(false);
        } catch (err) {
            console.error("Error setting provider:", err);
            showMessage("error", err.response?.data?.error || err.message);
            setConfirmOpen(false);
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    return (
        <Box sx={{ padding: 4, maxWidth: 900, margin: "0 auto" }}>
            <Typography variant="h4" gutterBottom>
                Select Primary Care Provider
            </Typography>

            <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>Current provider:</Typography>
                    {loadingCurrentProvider || auth.isLoading ? (
                        <CircularProgress size={20} />
                    ) : (
                        <Typography component="strong" sx={{ fontWeight: 'bold' }}>
                            {currentProvider === null 
                                ? "No provider selected" 
                                : `${currentProvider.firstName} ${currentProvider.lastName} (${currentProvider.email})`
                            }
                        </Typography>
                    )}
                </Box>
                {!loadingCurrentProvider && currentProvider && currentProvider.selectionTime && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Selected on {formatDate(currentProvider.selectionTime)}
                    </Typography>
                )}
            </Box>

            {message && (
                <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
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
                onChange={(_, v) => setSelected(v)}
                filterOptions={(x) => x}
                isOptionEqualToValue={(a, b) => a.sub === b.sub}
                getOptionLabel={(o) => `${o.firstName} ${o.lastName} (${o.email})`}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Search healthcare provider"
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
            />

            <Button 
                variant="contained" 
                sx={{ mt: 2 }} 
                disabled={!selected || submitting} 
                onClick={() => setConfirmOpen(true)}
            >
                {submitting || confirmOpen ? <CircularProgress size={24} /> : "Submit"}
            </Button>

            <ConfirmationDialog
                open={confirmOpen}
                title="Confirm Provider Selection"
                body={`Are you sure you want to select ${selected ? `${selected.firstName} ${selected.lastName}` : "this provider"} as your primary care provider? They will be able to view your uploaded documents and text entries, but not your private notes.`}
                onConfirm={handleSubmit}
                onCancel={() => !submitting && setConfirmOpen(false)}
                loading={submitting}
            />
        </Box>
    );
}

export default SelectProvider;