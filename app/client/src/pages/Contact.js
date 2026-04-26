import { useState } from "react";
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { apiConfig } from "../apiConfig.js";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState(null); // "success" | "error"
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit() {
    setStatus(null);
    setLoading(true);
    try {
      const res = await fetch(`${apiConfig.baseUrlAPI}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Something went wrong.");
        setStatus("error");
      } else {
        setStatus("success");
        setForm({ name: "", email: "", message: "" });
      }
    } catch {
      setErrorMsg("Unable to send message. Please try again.");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: "flex", flexDirection: "column", gap: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Contact Us
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Have a question or need support? Send us a message and we&apos;ll get back
          to you as soon as possible.
        </Typography>

        {status === "success" && (
          <Alert severity="success">
            Your message has been sent. We&apos;ll be in touch soon.
          </Alert>
        )}
        {status === "error" && (
          <Alert severity="error">{errorMsg}</Alert>
        )}

        <TextField
          label="Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          fullWidth
          required
          inputProps={{ maxLength: 100 }}
        />
        <TextField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          fullWidth
          required
          inputProps={{ maxLength: 254 }}
        />
        <TextField
          label="Message"
          name="message"
          value={form.message}
          onChange={handleChange}
          fullWidth
          required
          multiline
          rows={6}
          inputProps={{ maxLength: 5000 }}
        />

        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={loading || !form.name || !form.email || !form.message}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Send Message"}
        </Button>
      </Box>
    </Container>
  );
}