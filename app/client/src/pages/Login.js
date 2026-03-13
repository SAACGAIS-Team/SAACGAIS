import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      if (err.message === "USER_NOT_CONFIRMED") {
        navigate("/signup", { state: { step: "verify", email } });
        return;
      }
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: "100%",
          maxWidth: 400,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "16px",
          padding: "40px 36px",
        }}
      >
        <Typography variant="h6" fontWeight={600} mb={0.5}>
          Sign in
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Welcome back to SAACGAIS
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
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          sx={{ mb: 2 }}
        />

        <TextField
          label="Password"
          type={showPassword ? "text" : "password"}
          fullWidth
          size="small"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          sx={{ mb: 3 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword((s) => !s)}
                  edge="end"
                  size="small"
                >
                  {showPassword
                    ? <VisibilityOffIcon fontSize="small" />
                    : <VisibilityIcon fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading || !email || !password}
          sx={{
            fontWeight: 600,
            fontSize: "14px",
            borderRadius: "8px",
            py: 1.2,
            textTransform: "none",
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : "Sign in"}
        </Button>

        <Typography variant="body2" color="text.secondary" textAlign="center" mt={3}>
          Don&apos;t have an account?{" "}
          <Typography
            component={Link}
            to="/signup"
            variant="body2"
            sx={{ color: "primary.main", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
          >
            Sign up
          </Typography>
        </Typography>
      </Box>
    </Box>
  );
}