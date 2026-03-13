import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const COUNTRY_CODES = [
  { code: "+1",   label: "+1 (US/CA)" },
  { code: "+44",  label: "+44 (UK)" },
  { code: "+61",  label: "+61 (AU)" },
  { code: "+49",  label: "+49 (DE)" },
  { code: "+33",  label: "+33 (FR)" },
  { code: "+81",  label: "+81 (JP)" },
  { code: "+86",  label: "+86 (CN)" },
  { code: "+91",  label: "+91 (IN)" },
  { code: "+52",  label: "+52 (MX)" },
  { code: "+55",  label: "+55 (BR)" },
];

const STEPS = ["details", "verify"];

// Formats digits into (XXX) XXX-XXXX for 10-digit numbers,
// or groups as XXX-XXXX-XXXX for longer international numbers
function formatPhoneDisplay(digits) {
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  // International: group remaining digits after 10 with a dash
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)} ${digits.slice(10)}`;
}

export default function Signup() {
  const { signup, confirm, resendCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const initialStep = location.state?.step === "verify" ? 1 : 0;
  const initialEmail = location.state?.email || "";

  const [step, setStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    email: initialEmail,
    password: "",
    confirmPassword: "",
    given_name: "",
    family_name: "",
    birthdate: "",
    phone_number: "",
    phone_display: "",
    country_code: "+1",
  });

  const [verifyEmail, setVerifyEmail] = useState(initialEmail);
  const [code, setCode] = useState("");

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    // phone_number already holds raw digits, prepend country code for E.164
    const fullPhone = `${form.country_code}${form.phone_number}`;

    setLoading(true);
    try {
      const { email } = await signup({
        email: form.email,
        password: form.password,
        given_name: form.given_name,
        family_name: form.family_name,
        birthdate: form.birthdate,
        phone_number: fullPhone,
      });
      setVerifyEmail(email);
      setStep(1);
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await confirm(verifyEmail, code);
      navigate("/login", { state: { confirmed: true } });
    } catch (err) {
      setError(err.message || "Confirmation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setResendSuccess(false);
    try {
      await resendCode(verifyEmail);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch {
      setError("Failed to resend code. Please try again.");
    }
  };

  const cardSx = {
    width: "100%",
    maxWidth: step === 0 ? 460 : 400,
    bgcolor: "background.paper",
    border: "1px solid",
    borderColor: "divider",
    borderRadius: "16px",
    padding: "40px 36px",
  };

  const submitBtnSx = {
    fontWeight: 600,
    fontSize: "14px",
    borderRadius: "8px",
    py: 1.2,
    textTransform: "none",
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
        py: 4,
      }}
    >
      {/* Step 1: Details */}
      {step === STEPS.indexOf("details") && (
        <Box component="form" onSubmit={handleSignup} sx={cardSx}>
          <Typography variant="h6" fontWeight={600} mb={0.5}>
            Sign up
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Create a new account.
          </Typography>

          {error && (
            <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2, fontSize: "13px" }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Email address"
            type="email"
            fullWidth
            size="small"
            value={form.email}
            onChange={set("email")}
            required
            autoComplete="email"
            sx={{ mb: 2 }}
          />

          <TextField
            label="Birthdate"
            type="date"
            fullWidth
            size="small"
            value={form.birthdate}
            onChange={set("birthdate")}
            required
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />

          {/* Phone number with country code selector */}
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Country</InputLabel>
              <Select
                value={form.country_code}
                onChange={set("country_code")}
                label="Country"
              >
                {COUNTRY_CODES.map((c) => (
                  <MenuItem key={c.code} value={c.code}>
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Phone number"
              type="tel"
              fullWidth
              size="small"
              value={form.phone_display}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 15);
                setForm((f) => ({
                  ...f,
                  phone_number: digits,
                  phone_display: formatPhoneDisplay(digits),
                }));
              }}
              required
              placeholder="(555) 123-4567"
              inputProps={{ inputMode: "numeric" }}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              label="Given name"
              fullWidth
              size="small"
              value={form.given_name}
              onChange={set("given_name")}
              required
              autoComplete="given-name"
            />
            <TextField
              label="Family name"
              fullWidth
              size="small"
              value={form.family_name}
              onChange={set("family_name")}
              required
              autoComplete="family-name"
            />
          </Box>

          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            fullWidth
            size="small"
            value={form.password}
            onChange={set("password")}
            required
            autoComplete="new-password"
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" size="small">
                    {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Confirm password"
            type={showConfirm ? "text" : "password"}
            fullWidth
            size="small"
            value={form.confirmPassword}
            onChange={set("confirmPassword")}
            required
            autoComplete="new-password"
            sx={{ mb: 3 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirm((s) => !s)} edge="end" size="small">
                    {showConfirm ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button type="submit" fullWidth variant="contained" disabled={loading} sx={submitBtnSx}>
            {loading ? <CircularProgress size={20} color="inherit" /> : "Sign up"}
          </Button>

          <Typography variant="body2" color="text.secondary" textAlign="center" mt={3}>
            Have an account already?{" "}
            <Typography
              component={Link}
              to="/login"
              variant="body2"
              sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
            >
              Sign in
            </Typography>
          </Typography>
        </Box>
      )}

      {/* Step 2: Verify email */}
      {step === STEPS.indexOf("verify") && (
        <Box component="form" onSubmit={handleConfirm} sx={cardSx}>
          <Typography variant="h6" fontWeight={600} mb={0.5}>
            Verify your email
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            We sent a 6-digit code to{" "}
            <Typography component="span" variant="body2" color="text.primary">
              {verifyEmail}
            </Typography>
          </Typography>

          {error && (
            <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2, fontSize: "13px" }}>
              {error}
            </Alert>
          )}

          {resendSuccess && (
            <Alert severity="success" sx={{ mb: 2, fontSize: "13px" }}>
              Code resent successfully.
            </Alert>
          )}

          <TextField
            label="Verification code"
            fullWidth
            size="small"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            placeholder="123456"
            inputProps={{ maxLength: 6, inputMode: "numeric" }}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading || code.length !== 6}
            sx={{ ...submitBtnSx, mb: 2 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : "Confirm email"}
          </Button>

          <Typography variant="body2" color="text.secondary" textAlign="center">
            Didn&apos;t receive it?{" "}
            <Typography
              component="span"
              variant="body2"
              onClick={handleResend}
              sx={{ color: "primary.main", cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
            >
              Resend code
            </Typography>
          </Typography>
        </Box>
      )}
    </Box>
  );
}