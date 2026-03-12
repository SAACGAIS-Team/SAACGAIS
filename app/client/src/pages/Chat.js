import { useState } from "react";
import { Box, Button, Typography, Paper, TextField, CircularProgress } from "@mui/material";
import { aiService } from "../api.js";
import { useAuth } from "react-oidc-context";

function Chat() {
  const auth = useAuth();
  const [aiReply, setAiReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [userMessage, setUserMessage] = useState("");

  const handleSend = async () => {
    if (!userMessage) return;
    setAiReply("");
    setLoading(true);

    try {
      const token = auth.user?.id_token;
      const data = await aiService.uploadFile(userMessage, null, token);
      setAiReply(data.reply);
    } catch (err) {
      setAiReply("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
      setUserMessage("");
    }
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Chat with AI
      </Typography>

      <TextField
        label="Message to AI"
        multiline
        minRows={6}
        maxRows={12}
        variant="outlined"
        fullWidth
        value={userMessage}
        onChange={(e) => setUserMessage(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSend}
          disabled={loading || !userMessage}
        >
          Send to AI
        </Button>
      </Box>

      <Box sx={{ minHeight: 300 }}>
        {loading && (
          <Paper sx={{ mt: 2, p: 2, backgroundColor: "#f5f5f5" }}>
            <CircularProgress color="primary" />
          </Paper>
        )}
        {!loading && aiReply && (
          <Paper sx={{ mt: 2, p: 2, backgroundColor: "#f5f5f5" }}>
            <strong>AI Reply:</strong> {aiReply}
          </Paper>
        )}
      </Box>
    </Box>
  );
}

export default Chat;
