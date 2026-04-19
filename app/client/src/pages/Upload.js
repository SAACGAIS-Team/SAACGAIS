import { useState, useEffect } from "react";
import {
  Box, Button, Typography, TextField, CircularProgress,
  Alert, Divider, List, ListItem, ListItemText, Chip, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import { uploadService } from "../api.js";
import { useAuth } from "../context/AuthContext.js";
import PageCard from "../components/PageCard.js";
import PropTypes from "prop-types";

const ALLOWED_EXTENSIONS = ".pdf,.txt,.md,.csv,.json,.xml,.html";
const ALLOWED_LABEL = "PDF, TXT, MD, CSV, JSON, XML, HTML (max 10MB)";

// ── Text View Dialog ──────────────────────────────────────────────────────────
function TextViewDialog({ item, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(item.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Text Upload</Typography>
          <Typography variant="caption" color="text.secondary">{item.uploadedAt}</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{
          bgcolor: "background.default", borderRadius: 1, p: 2,
          fontFamily: "monospace", fontSize: "0.875rem",
          whiteSpace: "pre-wrap", wordBreak: "break-word",
          maxHeight: "60vh", overflowY: "auto", lineHeight: 1.7,
        }}>
          {item.content}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" startIcon={<ContentCopyIcon />} onClick={handleCopy}>
          {copied ? "Copied!" : "Copy"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

TextViewDialog.propTypes = {
  item: PropTypes.shape({
    content: PropTypes.string.isRequired,
    uploadedAt: PropTypes.string.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

// ── File View Dialog ──────────────────────────────────────────────────────────
function FileViewDialog({ item, onClose, onDownload, downloading }) {
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" noWrap sx={{ maxWidth: "75%" }}>{item.fileName}</Typography>
          <Typography variant="caption" color="text.secondary">{item.uploadedAt}</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {item.loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : item.error ? (
          <Alert severity="error">{item.error}</Alert>
        ) : item.contentType === "pdf" ? (
          <Box
            component="iframe"
            src={item.content}
            sx={{ width: "100%", height: "65vh", border: "none" }}
            title={item.fileName}
          />
        ) : (
          <Box sx={{
            bgcolor: "background.default", borderRadius: 1, p: 2,
            fontFamily: "monospace", fontSize: "0.875rem",
            whiteSpace: "pre-wrap", wordBreak: "break-word",
            maxHeight: "65vh", overflowY: "auto", lineHeight: 1.7,
          }}>
            {item.content}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
          onClick={onDownload}
          disabled={downloading || item.loading}
        >
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
}

FileViewDialog.propTypes = {
  item: PropTypes.shape({
    fileName: PropTypes.string.isRequired,
    uploadedAt: PropTypes.string.isRequired,
    content: PropTypes.string,
    contentType: PropTypes.string,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired,
  downloading: PropTypes.bool.isRequired,
};

// ── Main Upload Page ──────────────────────────────────────────────────────────
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

  const [viewTextDialog, setViewTextDialog] = useState(null);
  const [viewFileDialog, setViewFileDialog] = useState(null);

  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

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

  const handleDownload = async (id, fileName) => {
    setDownloadingKey(id);
    try {
      const blob = await uploadService.downloadFile(id);
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

  const handleViewText = (t) => {
    setViewTextDialog({ content: t.Text_Content, uploadedAt: formatDate(t.Upload_Time) });
  };

  const handleViewFile = async (f) => {
    setViewFileDialog({
      fileName: f.File_Name,
      id: f.File_Upload_ID,
      uploadedAt: formatDate(f.Upload_Time),
      content: null, contentType: null, loading: true, error: null,
    });
    try {
      const blob = await uploadService.downloadFile(f.File_Upload_ID);
      const ext = f.File_Name.split(".").pop().toLowerCase();
      if (ext === "pdf") {
        const url = URL.createObjectURL(blob);
        setViewFileDialog((prev) => ({ ...prev, content: url, contentType: "pdf", loading: false }));
      } else {
        const textContent = await blob.text();
        setViewFileDialog((prev) => ({ ...prev, content: textContent, contentType: "text", loading: false }));
      }
    } catch (err) {
      setViewFileDialog((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  };

  const handleCloseFileDialog = () => {
    if (viewFileDialog?.contentType === "pdf" && viewFileDialog?.content) {
      URL.revokeObjectURL(viewFileDialog.content);
    }
    setViewFileDialog(null);
  };

  const handleDeleteConfirm = (type, id, label) => {
    setConfirmDelete({ type, id, label });
  };

  const handleDeleteExecute = async () => {
    if (!confirmDelete) return;
    const { type, id } = confirmDelete;
    setDeletingId(id);
    setConfirmDelete(null);
    try {
      if (type === "file") {
        await uploadService.deleteFile(id);
        const res = await uploadService.getFileUploads();
        setFileHistory(res.uploads || []);
        showFileMessage("success", "File deleted successfully");
      } else {
        await uploadService.deleteText(id);
        const res = await uploadService.getTextUploads();
        setTextHistory(res.uploads || []);
        showTextMessage("success", "Text deleted successfully");
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      type === "file" ? showFileMessage("error", msg) : showTextMessage("error", msg);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <PageCard>
      <Typography variant="h4" gutterBottom>Upload</Typography>

      <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>

        {/* ── File Upload Section ─────────────────────────────────────── */}
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Typography variant="h6" gutterBottom>File Upload</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            Allowed: {ALLOWED_LABEL}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 2, mb: 2 }}>
            <input
              type="file" id="file-upload" multiple
              accept={ALLOWED_EXTENSIONS} style={{ display: "none" }}
              onChange={handleFileSelect}
            />
            <label htmlFor="file-upload">
              <Button variant="outlined" component="span">Choose Files</Button>
            </label>
            <Button
              variant="contained" onClick={handleFileUpload}
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
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}><CircularProgress size={24} /></Box>
          ) : fileHistory.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No files uploaded yet.</Typography>
          ) : (
            <List dense>
              {fileHistory.map((f) => (
                <ListItem
                  key={f.File_Upload_ID}
                  disableGutters
                  secondaryAction={
                    <Stack direction="row" spacing={0}>
                      <Tooltip title="View">
                        <IconButton edge="end" onClick={() => handleViewFile(f)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton
                          edge="end"
                          onClick={() => handleDownload(f.File_Upload_ID, f.File_Name)}
                          disabled={downloadingKey === f.File_Upload_ID}
                        >
                          {downloadingKey === f.File_Upload_ID
                            ? <CircularProgress size={18} />
                            : <DownloadIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => handleDeleteConfirm("file", f.File_Upload_ID, f.File_Name)}
                          disabled={deletingId === f.File_Upload_ID}
                        >
                          {deletingId === f.File_Upload_ID
                            ? <CircularProgress size={18} />
                            : <DeleteIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                >
                  <ListItemText primary={f.File_Name} secondary={formatDate(f.Upload_Time)} />
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* ── Text Upload Section ─────────────────────────────────────── */}
        <Box sx={{ flex: 1, minWidth: 300 }}>
          <Typography variant="h6" gutterBottom>Text Upload</Typography>
          <TextField
            label="Enter text" multiline minRows={6} maxRows={12}
            variant="outlined" fullWidth value={text}
            onChange={(e) => setText(e.target.value)} sx={{ mb: 2 }}
          />
          {textMessage && (
            <Alert severity={textMessage.type} sx={{ mb: 2 }} onClose={() => setTextMessage(null)}>
              {textMessage.text}
            </Alert>
          )}
          <Button
            variant="contained" onClick={handleTextUpload}
            disabled={textLoading || !text.trim()} sx={{ mb: 3 }}
          >
            {textLoading ? <CircularProgress size={24} color="inherit" /> : "Save Text"}
          </Button>

          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle1" gutterBottom>Text History</Typography>
          {loadingHistory ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}><CircularProgress size={24} /></Box>
          ) : textHistory.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No text uploaded yet.</Typography>
          ) : (
            <List dense>
              {textHistory.map((t) => (
                <ListItem
                  key={t.Text_Upload_ID}
                  disableGutters
                  secondaryAction={
                    <Stack direction="row" spacing={0}>
                      <Tooltip title="View">
                        <IconButton edge="end" onClick={() => handleViewText(t)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => handleDeleteConfirm(
                            "text",
                            t.Text_Upload_ID,
                            t.Text_Content.slice(0, 40) + (t.Text_Content.length > 40 ? "…" : "")
                          )}
                          disabled={deletingId === t.Text_Upload_ID}
                        >
                          {deletingId === t.Text_Upload_ID
                            ? <CircularProgress size={18} />
                            : <DeleteIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={t.Text_Content.length > 80 ? t.Text_Content.slice(0, 80) + "…" : t.Text_Content}
                    secondary={formatDate(t.Upload_Time)}
                    slotProps={{ primary: { noWrap: true, sx: { maxWidth: 220 } } }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Box>

      {/* ── Dialogs ─────────────────────────────────────────────────── */}
      {viewTextDialog && (
        <TextViewDialog item={viewTextDialog} onClose={() => setViewTextDialog(null)} />
      )}
      {viewFileDialog && (
        <FileViewDialog
          item={viewFileDialog}
          onClose={handleCloseFileDialog}
          onDownload={() => handleDownload(viewFileDialog.id, viewFileDialog.fileName)}
          downloading={downloadingKey === viewFileDialog.id}
        />
      )}
      {confirmDelete && (
        <Dialog open onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to permanently delete{" "}
              <strong>{confirmDelete.label}</strong>? This cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleDeleteExecute}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </PageCard>
  );
}