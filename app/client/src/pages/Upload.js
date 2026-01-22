import { useState } from "react";
import { Box, Button, Typography, Paper, TextField, CircularProgress } from "@mui/material";

function Upload() {
  const [aiReply, setAiReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [userMessage, setUserMessage] = useState("");

  const handleSend = async () => {
    if (!userMessage && !selectedFile) return;

    setAiReply("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("userMessage", userMessage);
      if (selectedFile) formData.append("file", selectedFile);

      const response = await fetch("http://localhost:3001/api/ai/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setAiReply(data.reply);
      } else {
        setAiReply("Error: " + data.error);
      }
    } catch (err) {
      setAiReply("Network error: " + err.message);
    } finally {
      setLoading(false);
      setUserMessage("");
      setSelectedFile(null);
    }
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Upload Documents & Send Message
      </Typography>

      {/* Large Text Box */}
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

      {/* File Upload */}
      <input
        type="file"
        id="file-upload"
        style={{ display: "none" }}
        onChange={(e) => setSelectedFile(e.target.files[0])}
      />
      <label htmlFor="file-upload">
        <Button variant="contained" component="span" color="primary" sx={{ mb: 2 }}>
          {selectedFile ? "Change File" : "Choose File"}
        </Button>
      </label>
      {selectedFile && (
        <Paper sx={{ mt: 1, p: 1, backgroundColor: "#f5f5f5" }}>
          Selected file: {selectedFile.name}
        </Paper>
      )}

      {/* Send Button */}
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSend}
          disabled={loading || (!userMessage && !selectedFile)}
        >
          Send to AI
        </Button>
      </Box>

      {/* AI Reply */}
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

export default Upload;
