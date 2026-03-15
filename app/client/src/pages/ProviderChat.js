import { useState, useRef, useEffect } from "react";
import {
  Box, Button, Typography, TextField, CircularProgress,
  Avatar, Chip, Autocomplete, Paper, Divider, Collapse, IconButton, Alert,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ArticleIcon from "@mui/icons-material/Article";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import PersonIcon from "@mui/icons-material/Person";
import DownloadIcon from "@mui/icons-material/Download";
import PropTypes from "prop-types";
import { useAuth } from "../context/AuthContext.js";
import { aiService, providerService, uploadService } from "../api.js";
import PageCard from "../components/PageCard.js";

// ── Result card for a single patient ─────────────────────────────────────────
function PatientResultCard({ result }) {
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [citationsOpen, setCitationsOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownload = async (rec) => {
    if (rec.type !== "file") return;
    setDownloadingId(rec.id);
    try {
      const blob = await uploadService.downloadFile(rec.id);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = rec.fileName || rec.id.split("/").pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  if (result.error) {
    return (
      <Alert severity="error" sx={{ mb: 1 }}>
        <strong>{result.name}:</strong> {result.error}
      </Alert>
    );
  }

  return (
    <Paper variant="outlined" sx={{ mb: 2, borderRadius: 2, overflow: "hidden", borderColor: "divider" }}>
      {/* Patient header */}
      <Box sx={{ px: 2.5, py: 1.5, bgcolor: "background.default", display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: "0.8rem" }}>
          <PersonIcon sx={{ fontSize: 18 }} />
        </Avatar>
        <Typography variant="subtitle1" fontWeight={700}>{result.name}</Typography>
      </Box>

      <Divider />

      {/* Summary */}
      <Box sx={{ px: 2.5, py: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", py: 0.5 }} onClick={() => setSummaryOpen((o) => !o)}>
          <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 0.8 }}>
            Clinical Summary
          </Typography>
          <IconButton size="small">{summaryOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}</IconButton>
        </Box>
        <Collapse in={summaryOpen}>
          {typeof result.summary === "object" && result.summary !== null ? (
            <Box sx={{ pb: 1.5 }}>
              {Object.entries(result.summary).map(([key, value]) => (
                <Box key={key} sx={{ mb: 1 }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.65rem", letterSpacing: 0.8 }}>
                    {key}
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                    {value || "Not mentioned"}
                  </Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" sx={{ pb: 1.5, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {result.summary}
            </Typography>
          )}
        </Collapse>
      </Box>

      {/* Cited Records */}
      {result.citedRecords?.length > 0 && (
        <>
          <Divider />
          <Box sx={{ px: 2.5, py: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", py: 0.5 }} onClick={() => setCitationsOpen((o) => !o)}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 0.8 }}>Sources</Typography>
                <Chip label={result.citedRecords.length} size="small" sx={{ height: 18, fontSize: "0.65rem" }} />
              </Box>
              <IconButton size="small">{citationsOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}</IconButton>
            </Box>
            <Collapse in={citationsOpen}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, pb: 1.5 }}>
                {result.citedRecords.map((rec) => (
                  <Box key={rec.id} sx={{ display: "flex", alignItems: "center", gap: 1, p: 1, bgcolor: "background.default", borderRadius: 1, border: "1px solid", borderColor: "divider" }}>
                    <ArticleIcon sx={{ fontSize: 16, color: "text.secondary", flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" noWrap fontWeight={500}>
                        {rec.fileName || (rec.type === "text" ? "Text entry" : rec.id)}
                      </Typography>
                      {rec.uploadedAt && (
                        <Typography variant="caption" color="text.secondary">
                          {new Date(rec.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </Typography>
                      )}
                    </Box>
                    <Chip label={rec.type} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.65rem", flexShrink: 0 }} />
                    {rec.type === "file" && (
                      <IconButton
                        size="small"
                        onClick={() => handleDownload(rec)}
                        disabled={downloadingId === rec.id}
                        sx={{ flexShrink: 0 }}
                      >
                        {downloadingId === rec.id
                          ? <CircularProgress size={14} />
                          : <DownloadIcon sx={{ fontSize: 16 }} />
                        }
                      </IconButton>
                    )}
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>
        </>
      )}

      {/* Suggestions */}
      {result.suggestions?.length > 0 && (
        <>
          <Divider />
          <Box sx={{ px: 2.5, py: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", py: 0.5 }} onClick={() => setSuggestionsOpen((o) => !o)}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <LightbulbIcon sx={{ fontSize: 14, color: "warning.main" }} />
                <Typography variant="body2" fontWeight={600} color="text.secondary" sx={{ textTransform: "uppercase", fontSize: "0.7rem", letterSpacing: 0.8 }}>Suggestions</Typography>
              </Box>
              <IconButton size="small">{suggestionsOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}</IconButton>
            </Box>
            <Collapse in={suggestionsOpen}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, pb: 1.5 }}>
                {result.suggestions.map((s, i) => {
                  const isObject = typeof s === "object" && s !== null;
                  return (
                    <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "flex-start", p: 1.5, bgcolor: "background.default", borderRadius: 1, border: "1px solid", borderColor: "divider" }}>
                      <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "warning.main", mt: 0.75, flexShrink: 0 }} />
                      <Box sx={{ minWidth: 0 }}>
                        {isObject ? (
                          <>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5, flexWrap: "wrap" }}>
                              {s.category && <Chip label={s.category} size="small" variant="outlined" sx={{ height: 18, fontSize: "0.65rem" }} />}
                              {s.urgency && (
                                <Chip
                                  label={s.urgency}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: "0.65rem",
                                    bgcolor: s.urgency === "Emergency" ? "error.light" : s.urgency?.includes("Urgent") ? "warning.light" : "success.light",
                                    color: s.urgency === "Emergency" ? "error.dark" : s.urgency?.includes("Urgent") ? "warning.dark" : "success.dark",
                                  }}
                                />
                              )}
                            </Box>
                            <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 0.5 }}>{s.suggestion}</Typography>
                            {s.rationale && (
                              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                                {s.rationale}
                              </Typography>
                            )}
                          </>
                        ) : (
                          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{s}</Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Collapse>
          </Box>
        </>
      )}
    </Paper>
  );
}

PatientResultCard.propTypes = {
  result: PropTypes.shape({
    error: PropTypes.string,
    name: PropTypes.string,
    summary: PropTypes.string,
    citedRecords: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      type: PropTypes.string,
      fileName: PropTypes.string,
      uploadedAt: PropTypes.string,
    })),
    suggestions: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          category: PropTypes.string,
          suggestion: PropTypes.string,
          rationale: PropTypes.string,
          urgency: PropTypes.string,
        })
      ])
    ),
  }).isRequired,
};

// ── Chat message bubble ───────────────────────────────────────────────────────
function MessageBubble({ msg, userInitial }) {
  if (msg.role === "results") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, maxWidth: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <Avatar sx={{ width: 28, height: 28, bgcolor: "text.primary", color: "#61dafb", fontSize: "0.6rem", fontWeight: 700 }}>AI</Avatar>
          <Typography variant="caption" color="text.secondary">
            Analysis complete — {msg.results.length} patient{msg.results.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
        {msg.results.map((r) => <PatientResultCard key={r.patientUid} result={r} />)}
      </Box>
    );
  }

  if (msg.role === "ai") {
    return (
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
        <Avatar sx={{ width: 30, height: 30, bgcolor: "text.primary", color: "#61dafb", fontSize: "0.65rem", fontWeight: "bold", flexShrink: 0, mb: 0.25 }}>AI</Avatar>
        <Box sx={{
          maxWidth: { xs: "85%", sm: "65%" }, px: 2, py: 1.25,
          borderRadius: "18px 18px 18px 4px",
          bgcolor: msg.isError ? "error.light" : "background.paper",
          color: msg.isError ? "error.dark" : "text.primary",
          boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
          border: !msg.isError ? "1px solid" : "none", borderColor: "divider",
        }}>
          <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.text}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end", gap: 1 }}>
      <Box sx={{
        maxWidth: { xs: "85%", sm: "65%" }, px: 2, py: 1.25,
        borderRadius: "18px 18px 4px 18px",
        bgcolor: "text.primary", color: "background.paper",
        boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
      }}>
        <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.text}</Typography>
      </Box>
      <Avatar sx={{ width: 30, height: 30, bgcolor: "#61dafb", color: "text.primary", fontSize: "0.75rem", fontWeight: "bold", flexShrink: 0, mb: 0.25 }}>{userInitial}</Avatar>
    </Box>
  );
}

MessageBubble.propTypes = {
  msg: PropTypes.shape({
    role: PropTypes.string.isRequired,
    text: PropTypes.string,
    isError: PropTypes.bool,
    results: PropTypes.array,
  }).isRequired,
  userInitial: PropTypes.string.isRequired,
};

// ── Main page ─────────────────────────────────────────────────────────────────
function ProviderChat() {
  const { user } = useAuth();
  const userGroups = user?.groups || [];
  const isProvider = userGroups.includes("Healthcare-Provider");

  const [messages, setMessages] = useState([
    { role: "ai", text: "Select patients from your panel and enter a clinical query. I'll analyze their records and provide a summary with suggestions." },
  ]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [patientOptions, setPatientOptions] = useState([]);
  const [patientInput, setPatientInput] = useState("");
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [patientPanelLoading, setPatientPanelLoading] = useState(true);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Load the provider's patient panel once on mount
  useEffect(() => {
    if (!isProvider) return;
    const fetchPanel = async () => {
      try {
        setPatientPanelLoading(true);
        const data = await providerService.getMyPatients();
        // Supabase RPC returns snake_case — normalize to match user search shape
        const normalized = (data.patients || []).map((p) => ({
          sub: p.sub,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
        }));
        setPatientOptions(normalized);
      } catch (e) {
        console.error("Failed to load patient panel:", e);
      } finally {
        setPatientPanelLoading(false);
      }
    };
    fetchPanel();
  }, [isProvider]);

  const handleSend = async () => {
    const trimmed = query.trim();
    if (!trimmed || loading || selectedPatients.length === 0) return;

    const patientNames = selectedPatients.map((p) => `${p.firstName} ${p.lastName}`).join(", ");
    setMessages((prev) => [...prev, { role: "user", text: `Patients: ${patientNames}\n\n${trimmed}` }]);
    setQuery("");
    setLoading(true);

    try {
      const data = await aiService.queryPatients(trimmed, selectedPatients.map((p) => p.sub));
      setMessages((prev) => [...prev, { role: "results", results: data.results }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Error: " + (err.response?.data?.error || err.message), isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const userInitial = user?.given_name?.[0]?.toUpperCase() || "U";
  const canSend = query.trim() && selectedPatients.length > 0 && !loading;

  if (!isProvider) {
    return (
      <PageCard>
        <Typography variant="h5" gutterBottom>Access Denied</Typography>
        <Typography color="text.secondary">This page is only available to Healthcare Providers.</Typography>
      </PageCard>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", bgcolor: "background.default" }}>

      {/* Header */}
      <Box sx={{ px: 3, py: 2, bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: "#61dafb", color: "background.paper", fontSize: "1rem", fontWeight: "bold" }}>AI</Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>AI Assistant</Typography>
            <Typography variant="caption" sx={{ color: "#4caf50" }}>● Online</Typography>
          </Box>
        </Box>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflowY: "auto", px: { xs: 2, sm: 4 }, py: 3, display: "flex", flexDirection: "column", gap: 2 }}>
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} userInitial={userInitial} />)}

        {loading && (
          <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
            <Avatar sx={{ width: 30, height: 30, bgcolor: "text.primary", color: "#61dafb", fontSize: "0.65rem", fontWeight: "bold", flexShrink: 0 }}>AI</Avatar>
            <Box sx={{ px: 2, py: 1.5, borderRadius: "18px 18px 18px 4px", bgcolor: "background.paper", border: "1px solid", borderColor: "divider", boxShadow: "0 1px 6px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={14} thickness={5} sx={{ color: "#61dafb" }} />
              <Typography variant="body2" color="text.secondary">Analyzing records…</Typography>
            </Box>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box sx={{ px: { xs: 2, sm: 4 }, py: 2, bgcolor: "background.paper", borderTop: "1px solid", borderColor: "divider", boxShadow: "0 -1px 4px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", gap: 1.5 }}>

        {/* Patient picker */}
        <Autocomplete
          multiple
          options={patientOptions}
          loading={patientPanelLoading}
          value={selectedPatients}
          inputValue={patientInput}
          onInputChange={(_, v) => setPatientInput(v)}
          onChange={(_, v) => setSelectedPatients(v)}
          isOptionEqualToValue={(a, b) => a.sub === b.sub}
          getOptionLabel={(o) => `${o.firstName} ${o.lastName} (${o.email})`}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip {...getTagProps({ index })} key={option.sub} label={`${option.firstName} ${option.lastName}`} size="small" icon={<PersonIcon />} />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder={selectedPatients.length === 0 ? "Search your patients…" : ""}
              label="Patients"
              InputProps={{
                ...params.InputProps,
                endAdornment: <>{patientPanelLoading ? <CircularProgress size={16} /> : null}{params.InputProps.endAdornment}</>,
              }}
            />
          )}
        />

        {/* Query input */}
        <Box sx={{
          display: "flex", alignItems: "flex-end", gap: 1.5,
          bgcolor: "background.default", borderRadius: "24px", px: 2, py: 1,
          border: "1.5px solid", borderColor: "divider",
          transition: "border-color 0.2s", "&:focus-within": { borderColor: "#61dafb" },
        }}>
          <TextField
            multiline maxRows={5}
            placeholder={selectedPatients.length === 0 ? "Select patients first…" : "Type a message… (Shift+Enter for new line)"}
            variant="standard" fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={selectedPatients.length === 0 || loading}
            InputProps={{ disableUnderline: true }}
            sx={{ "& .MuiInputBase-root": { fontSize: "0.95rem", lineHeight: 1.5, py: 0.5 } }}
          />
          <Button
            onClick={handleSend}
            disabled={!canSend}
            sx={{
              minWidth: 40, width: 40, height: 40, borderRadius: "50%",
              bgcolor: canSend ? "text.primary" : "action.disabledBackground",
              color: canSend ? "#61dafb" : "text.disabled",
              flexShrink: 0, mb: 0.25,
              "&:hover": { bgcolor: canSend ? "text.secondary" : "action.disabledBackground" },
              transition: "background-color 0.2s",
            }}
          >
            <SendIcon sx={{ fontSize: 18 }} />
          </Button>
        </Box>
        <Typography variant="caption" color="text.disabled" sx={{ pl: 2, mt: 0.5, display: "block" }}>
          Press Enter to send
        </Typography>
      </Box>
    </Box>
  );
}

export default ProviderChat;