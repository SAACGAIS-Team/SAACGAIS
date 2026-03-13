import { useState, useRef, useEffect } from "react";
import { Box, Button, Typography, TextField, CircularProgress, Avatar } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { aiService } from "../api.js";
import { useAuth } from "react-oidc-context";

function Chat() {
  const auth = useAuth();
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi! I'm your AI assistant. How can I help you today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const trimmed = userMessage.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setUserMessage("");
    setLoading(true);

    try {
      const token = auth.user?.id_token;
      const data = await aiService.uploadFile(trimmed, null, token);
      setMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const userInitial = auth.user?.profile?.given_name?.[0]?.toUpperCase() || "U";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", bgcolor: "background.default" }}>

      {/* Header */}
      <Box sx={{ px: 3, py: 2, bgcolor: "background.paper", borderBottom: "1px solid", borderColor: "divider", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: "#61dafb", color: "background.paper", fontSize: "1rem", fontWeight: "bold" }}>
            AI
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              AI Assistant
            </Typography>
            <Typography variant="caption" sx={{ color: "#4caf50" }}>
              ● Online
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflowY: "auto", px: { xs: 2, sm: 4 }, py: 3, display: "flex", flexDirection: "column", gap: 2 }}>
        {messages.map((msg, i) => (
          <Box
            key={i}
            sx={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 1 }}
          >
            {msg.role === "ai" && (
              <Avatar sx={{ width: 30, height: 30, bgcolor: "text.primary", color: "#61dafb", fontSize: "0.65rem", fontWeight: "bold", flexShrink: 0, mb: 0.25 }}>
                AI
              </Avatar>
            )}

            <Box
              sx={{
                maxWidth: { xs: "85%", sm: "65%" },
                px: 2,
                py: 1.25,
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                bgcolor: msg.role === "user"
                  ? "text.primary"
                  : msg.isError
                  ? "error.light"
                  : "background.paper",
                color: msg.role === "user"
                  ? "background.paper"
                  : msg.isError
                  ? "error.dark"
                  : "text.primary",
                boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
                border: msg.role === "ai" && !msg.isError ? "1px solid" : "none",
                borderColor: "divider",
              }}
            >
              <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {msg.text}
              </Typography>
            </Box>

            {msg.role === "user" && (
              <Avatar sx={{ width: 30, height: 30, bgcolor: "#61dafb", color: "text.primary", fontSize: "0.75rem", fontWeight: "bold", flexShrink: 0, mb: 0.25 }}>
                {userInitial}
              </Avatar>
            )}
          </Box>
        ))}

        {loading && (
          <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
            <Avatar sx={{ width: 30, height: 30, bgcolor: "text.primary", color: "#61dafb", fontSize: "0.65rem", fontWeight: "bold", flexShrink: 0 }}>
              AI
            </Avatar>
            <Box sx={{ px: 2, py: 1.5, borderRadius: "18px 18px 18px 4px", bgcolor: "background.paper", border: "1px solid", borderColor: "divider", boxShadow: "0 1px 6px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={14} thickness={5} sx={{ color: "#61dafb" }} />
              <Typography variant="body2" color="text.secondary">
                Thinking...
              </Typography>
            </Box>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </Box>

      {/* Input Area */}
      <Box sx={{ px: { xs: 2, sm: 4 }, py: 2, bgcolor: "background.paper", borderTop: "1px solid", borderColor: "divider", boxShadow: "0 -1px 4px rgba(0,0,0,0.04)" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            gap: 1.5,
            bgcolor: "background.default",
            borderRadius: "24px",
            px: 2,
            py: 1,
            border: "1.5px solid",
            borderColor: "divider",
            transition: "border-color 0.2s",
            "&:focus-within": { borderColor: "#61dafb" },
          }}
        >
          <TextField
            multiline
            maxRows={5}
            placeholder="Type a message… (Shift+Enter for new line)"
            variant="standard"
            fullWidth
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            InputProps={{ disableUnderline: true }}
            sx={{ "& .MuiInputBase-root": { fontSize: "0.95rem", lineHeight: 1.5, py: 0.5 } }}
          />
          <Button
            onClick={handleSend}
            disabled={loading || !userMessage.trim()}
            sx={{
              minWidth: 40,
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: userMessage.trim() ? "text.primary" : "action.disabledBackground",
              color: userMessage.trim() ? "#61dafb" : "text.disabled",
              flexShrink: 0,
              mb: 0.25,
              "&:hover": { bgcolor: userMessage.trim() ? "text.secondary" : "action.disabledBackground" },
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

export default Chat;