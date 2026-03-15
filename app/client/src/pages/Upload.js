import { useState, useEffect } from "react";
import {
  Box, Button, Typography, TextField, CircularProgress,
  Alert, Divider, List, ListItem, ListItemText, Chip, IconButton, Tooltip
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { uploadService } from "../api.js";
import { useAuth } from "../context/AuthContext.js";
import PageCard from "../components/PageCard.js";

const ALLOWED_EXTENSIONS = ".pdf,.txt,.md,.csv,.json,.xml,.html";
const ALLOWED_LABEL = "PDF, TXT, MD, CSV, JSON, XML, HTML (max 10MB)";

export default function Upload() {
  const { isAuthenticated } = useAuth();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileMessage, setFileMessage] = useState(null);
  const [fileHistory, setFileHistory] = useState([]);

  const [text, setText] = useState("");
  const [textLoading, setTextLoading] = useState(false);
  const [textMessage, setTextMessage] = useState(null);
  const [textHistory, setTextHistory] = useState([]);

  const [downloadingKey, setDownloadingKey] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const showFileMessage = (type, text) => {
    setFileMessage({ type, text });
    setTimeout(() => setFileMessage(null), 5000);
  };

  const showTextMessage = (type, text) => {
    setTextMessage({ type, text });
    setTimeout(() => setTextMessage(null), 5000);
  };

  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const [fileRes, textRes] = await Promise.all([
          uploadService.getFileUploads(),
          uploadService.getTextUploads(),
        ]);
        setFileHistory(fileRes.uploads || []);
        setTextHistory(textRes.uploads || []);
      } catch (err) {
        console.error("Error fetching upload history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    if (isAuthenticated) fetchHistory();
  }, [isAuthenticated]);

  const handleFileSelect = (e) => {
    const newFiles = Array.from(e.target.files);
    setSelectedFiles((prev) => {
      const existingNames = prev.map((f) => f.name);
      return [...prev, ...newFiles.filter((f) => !existingNames.includes(f.name))];
    });
    e.target.value = "";
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;
    setFileLoading(true);
    setFileMessage(null);
    try {
      await uploadService.uploadFiles(selectedFiles);
      showFileMessage("success", `${selectedFiles.length} file(s) uploaded successfully`);
      setSelectedFiles([]);
      const res = await uploadService.getFileUploads();
      setFileHistory(res.uploads || []);
    } catch (err) {
      showFileMessage("error", err.response?.data?.error || err.message);
    } finally {
      setFileLoading(false);
    }
  };

  const handleTextUpload = async () => {
    if (!text.trim()) return;
    setTextLoading(true);
    setTextMessage(null);
    try {
      await uploadService.uploadText(text);
      showTextMessage("success", "Text saved successfully");
      setText("");
      const res = await uploadService.getTextUploads();
      setTextHistory(res.uploads || []);
    } catch (err) {
      showTextMessage("error", err.response?.data?.error || err.message);
    } finally {
      setTextLoading(false);
    }
  };

  const handleDownload = async (s3Key, fileName) => {
    setDownloadingKey(s3Key);
    try {
      const blob = await uploadService.downloadFile(s3Key);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setDownloadingKey(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <PageCard>
      <Typography variant="h4" gutterBottom>Upload</Typography>

      <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {/* File Upload Section */}
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Typography variant="h6" gutterBottom>File Upload</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Allowed: {ALLOWED_LABEL}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2, mb: 2 }}>
            <input
              type="file"
              id="file-upload"
              multiple
              accept={ALLOWED_EXTENSIONS}
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
            <label htmlFor="file-upload">
              <Button variant="outlined" component="span">Choose Files</Button>
            </label>
            <Button
              variant="contained"
              onClick={handleFileUpload}
              disabled={fileLoading || selectedFiles.length === 0}
            >
              {fileLoading ? <CircularProgress size={24} color="inherit" /> : "Upload Files"}
            </Button>
          </Box>

          {selectedFiles.length > 0 && (
            <Box sx={{ mb: 2 }}>
              {selectedFiles.map((file, i) => (
                <Chip key={i} label={file.name} onDelete={() => handleRemoveFile(i)} sx={{ mr: 0.5, mb: 0.5 }} />
              ))}
            </Box>
          )}

          {fileMessage && (
            <Alert severity={fileMessage.type} sx={{ mb: 2 }} onClose={() => setFileMessage(null)}>
              {fileMessage.text}
            </Alert>
          )}

          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle1" gutterBottom>File History</Typography>
          {loadingHistory ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : fileHistory.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No files uploaded yet.</Typography>
          ) : (
            <List dense>
              {fileHistory.map((f) => (
                <ListItem
                  key={f.File_Upload_ID}
                  disableGutters
                  secondaryAction={
                    <Tooltip title="Download">
                      <IconButton
                        edge="end"
                        onClick={() => handleDownload(f.S3_Key, f.File_Name)}
                        disabled={downloadingKey === f.S3_Key}
                      >
                        {downloadingKey === f.S3_Key ? <CircularProgress size={18} /> : <DownloadIcon />}
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemText primary={f.File_Name} secondary={formatDate(f.Upload_Time)} />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Text Upload Section */}
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Typography variant="h6" gutterBottom>Text Upload</Typography>
          <TextField
            label="Enter text"
            multiline
            minRows={6}
            maxRows={12}
            variant="outlined"
            fullWidth
            value={text}
            onChange={(e) => setText(e.target.value)}
            sx={{ mb: 2 }}
          />
          {textMessage && (
            <Alert severity={textMessage.type} sx={{ mb: 2 }} onClose={() => setTextMessage(null)}>
              {textMessage.text}
            </Alert>
          )}
          <Button
            variant="contained"
            onClick={handleTextUpload}
            disabled={textLoading || !text.trim()}
            sx={{ mb: 3 }}
          >
            {textLoading ? <CircularProgress size={24} color="inherit" /> : "Save Text"}
          </Button>

          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle1" gutterBottom>Text History</Typography>
          {loadingHistory ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : textHistory.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No text uploaded yet.</Typography>
          ) : (
            <List dense>
              {textHistory.map((t) => (
                <ListItem key={t.Text_Upload_ID} disableGutters>
                  <ListItemText
                    primary={t.Text_Content.length > 80 ? t.Text_Content.slice(0, 80) + "..." : t.Text_Content}
                    secondary={formatDate(t.Upload_Time)}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Box>
    </PageCard>
  );
}