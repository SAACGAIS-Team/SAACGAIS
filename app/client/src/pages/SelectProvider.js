import { useEffect, useState } from "react";
import { Box, TextField, Button, Typography, CircularProgress, Autocomplete, Alert } from "@mui/material";
import { useAuth } from "react-oidc-context";

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
    const auth = useAuth();

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
                
                if (!userId) {
                    console.log("User not authenticated");
                    setLoadingCurrentProvider(false);
                    setCurrentProvider(null);
                    return;
                }

                // Get provider UID from database
                const res = await fetch(
                    `http://localhost:3001/api/provider?user=${encodeURIComponent(userId)}`, 
                    { signal: controller.signal }
                );
                
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                
                const response = await res.json();
                
                if (response.ok && response.data && response.data.Provider_UID) {
                    const providerRes = await fetch(
                        `http://localhost:3001/api/search-users/${response.data.Provider_UID}`,
                        { signal: controller.signal }
                    );
                    
                    if (!providerRes.ok) {
                        throw new Error(`HTTP error! status: ${providerRes.status}`);
                    }
                    
                    const providerInfo = await providerRes.json();
                    
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
                const res = await fetch(
                    `http://localhost:3001/api/search-users?role=Healthcare-Provider&search=${encodeURIComponent(input)}`, 
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

    const handleSubmit = async () => {
        if (!selected) return;

        setSubmitting(true);
        setMessage(null);

        try {
            const userId = auth.user?.profile?.sub;

            if (!userId) {
                setMessage({ type: "error", text: "User not authenticated" });
                return;
            }

            const res = await fetch("http://localhost:3001/api/provider", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: userId,
                    providerId: selected.sub,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to set provider");
            }

            setMessage({ type: "success", text: "Provider updated successfully!" });
            
            // Update current provider with selection time
            setCurrentProvider({
                ...selected,
                selectionTime: new Date().toISOString()
            });
            
            setSelected(null);
            setInput("");
        } catch (err) {
            console.error("Error setting provider:", err);
            setMessage({ type: "error", text: err.message });
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
        <Box sx={{ p: 4, maxWidth: 500 }}>
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
                onClick={handleSubmit}
            >
                {submitting ? <CircularProgress size={24} /> : "Submit"}
            </Button>
        </Box>
    );
}

export default SelectProvider;