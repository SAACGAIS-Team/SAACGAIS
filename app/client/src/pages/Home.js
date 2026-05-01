import PropTypes from "prop-types";
import {
  Typography,
  Box,
  Chip,
  Card,
  CardContent,
  Button,
  Stack,
  Divider,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

function Home() {
  const { user, isAuthenticated } = useAuth();
  const userGroups = user?.groups || [];

  return (
    <Box sx={{ width: "100%", bgcolor: "background.default" }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #f8fafc 0%, #eef6ff 100%)",
          px: { xs: 3, sm: 5, md: 8 },
          py: { xs: 8, md: 12 },
        }}
      >
        <Box
          sx={{
            maxWidth: 1200,
            mx: "auto",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" },
            gap: { xs: 5, md: 8 },
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              variant="h1"
              sx={{
                fontWeight: 800,
                lineHeight: 1.05,
                mb: 3,
                fontSize: { xs: "2.75rem", sm: "3.5rem", md: "5rem" },
              }}
            >
              Secure AI Support for Healthcare Workflows
            </Typography>

            <Typography
              variant="h5"
              component="p"
              sx={{
                color: "text.secondary",
                lineHeight: 1.7,
                maxWidth: 760,
                mb: 4,
                fontSize: { xs: "1.1rem", md: "1.35rem" },
              }}
            >
              SAACGAIS helps patients, healthcare providers, and administrators
              access role-specific tools, document workflows, and AI-assisted
              chat features from one secure platform.
            </Typography>

            {!isAuthenticated ? (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  component={RouterLink}
                  to="/login"
                  sx={{ px: 4, py: 1.5, fontWeight: 700 }}
                >
                  Log In
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  component={RouterLink}
                  to="/signup"
                  sx={{ px: 4, py: 1.5, fontWeight: 700 }}
                >
                  Create Account
                </Button>
              </Stack>
            ) : (
              <Card variant="outlined" sx={{ maxWidth: 600, borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    You are signed in
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{ color: "text.secondary", mb: 2 }}
                  >
                    Your available tools are based on your assigned role.
                  </Typography>

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {userGroups.length > 0 ? (
                      userGroups.map((role) => (
                        <Chip
                          key={role}
                          label={role}
                          color="primary"
                          variant="outlined"
                        />
                      ))
                    ) : (
                      <Chip
                        label="No role assigned"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>

          <Card
            variant="outlined"
            sx={{
              borderRadius: 4,
              boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
              borderColor: "grey.200",
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>
                Platform Overview
              </Typography>

              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Patients
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Upload documents, select providers, and access AI-assisted
                    patient support tools.
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Healthcare Providers
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Use provider-focused chat tools to support communication and
                    workflow efficiency.
                  </Typography>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Administrators
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Manage user roles and help maintain secure access across the
                    system.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Features Section */}
      <Box sx={{ px: { xs: 3, sm: 5, md: 8 }, py: { xs: 8, md: 10 } }}>
        <Box sx={{ maxWidth: 1200, mx: "auto" }}>
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
              Core Features
            </Typography>
            <Typography
              variant="h6"
              component="p"
              sx={{ color: "text.secondary" }}
            >
              Designed around secure access, AI support, and role-specific
              healthcare workflows.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 3,
            }}
          >
            <FeatureCard
              label="01"
              title="Role-Based Access"
              description="Users only access tools that match their assigned role, helping keep the platform organized and secure."
            />

            <FeatureCard
              label="02"
              title="AI-Assisted Chat"
              description="Patient and provider chat tools support healthcare-related communication and workflow efficiency."
            />

            <FeatureCard
              label="03"
              title="Document Workflow"
              description="Patients can upload documents and connect with providers through a structured platform workflow."
            />
          </Box>
        </Box>
      </Box>

      {/* How It Works Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #f8fafc 0%, #eef6ff 100%)",
          px: { xs: 3, sm: 5, md: 8 },
          py: { xs: 8, md: 10 },
        }}
      >
        <Box
          sx={{
            maxWidth: 1200,
            mx: "auto",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "0.9fr 1.1fr" },
            gap: { xs: 5, md: 8 },
            alignItems: "start",
          }}
        >
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
              How SAACGAIS Works
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
                lineHeight: 1.8,
                fontSize: "1.1rem",
              }}
            >
              The platform checks each user’s authentication status and assigned
              groups before showing protected tools. This allows patients,
              providers, and administrators to use different parts of the system
              safely.
            </Typography>
          </Box>

          <Stack spacing={2}>
            <StepCard
              step="1"
              title="Sign in or create an account"
              description="Users authenticate before accessing protected features."
            />

            <StepCard
              step="2"
              title="Role access is checked"
              description="The app checks whether the user is a Patient, Healthcare Provider, or Administrator."
            />

            <StepCard
              step="3"
              title="Use assigned tools"
              description="Users are directed to upload, chat, provider selection, role management, or account tools based on permissions."
            />
          </Stack>
        </Box>
      </Box>

      {/* Authenticated Dashboard Section */}
      {isAuthenticated && (
        <Box sx={{ px: { xs: 3, sm: 5, md: 8 }, py: { xs: 8, md: 10 } }}>
          <Box sx={{ maxWidth: 1200, mx: "auto" }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
              Your Dashboard
            </Typography>

            {userGroups.length > 0 ? (
              <>
                <Typography
                  variant="body1"
                  sx={{ color: "text.secondary", mb: 3 }}
                >
                  You are assigned the following roles:
                </Typography>

                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 4 }}>
                  {userGroups.map((role) => (
                    <Chip
                      key={role}
                      label={role}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  {userGroups.includes("Patient") && (
                    <>
                      <Button
                        variant="contained"
                        component={RouterLink}
                        to="/upload"
                      >
                        Upload Documents
                      </Button>

                      <Button
                        variant="outlined"
                        component={RouterLink}
                        to="/patient-chat"
                      >
                        Patient Chat
                      </Button>

                      <Button
                        variant="outlined"
                        component={RouterLink}
                        to="/select-provider"
                      >
                        Select Provider
                      </Button>
                    </>
                  )}

                  {userGroups.includes("Healthcare-Provider") && (
                    <Button
                      variant="contained"
                      component={RouterLink}
                      to="/provider-chat"
                    >
                      Provider Chat
                    </Button>
                  )}

                  {userGroups.includes("Administrator") && (
                    <Button
                      variant="contained"
                      component={RouterLink}
                      to="/change-role"
                    >
                      Manage Roles
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    component={RouterLink}
                    to="/account-settings"
                  >
                    Account Settings
                  </Button>
                </Stack>
              </>
            ) : (
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                You are signed in, but no role has been assigned yet. Please
                contact an administrator to receive access.
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: "#0f172a",
          color: "white",
          px: { xs: 3, sm: 5, md: 8 },
          py: 5,
        }}
      >
        <Box
          sx={{
            maxWidth: 1200,
            mx: "auto",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            gap: 3,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              SAACGAIS
            </Typography>
            <Typography variant="body2" sx={{ color: "grey.400" }}>
              Secure AI-assisted healthcare access and workflow support.
            </Typography>
          </Box>

          <Stack direction="row" spacing={3}>
            <Button
              component={RouterLink}
              to="/"
              sx={{ color: "grey.300", textTransform: "none" }}
            >
              Home
            </Button>
            <Button
              component={RouterLink}
              to="/contact"
              sx={{ color: "grey.300", textTransform: "none" }}
            >
              Contact
            </Button>
            {!isAuthenticated && (
              <Button
                component={RouterLink}
                to="/login"
                sx={{ color: "grey.300", textTransform: "none" }}
              >
                Login
              </Button>
            )}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

function FeatureCard({ label, title, description }) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        borderRadius: 4,
        transition: "all 0.25s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 16px 32px rgba(15, 23, 42, 0.08)",
        },
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: "primary.light",
            color: "primary.contrastText",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            mb: 3,
          }}
        >
          {label}
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1.5 }}>
          {title}
        </Typography>

        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}

function StepCard({ step, title, description }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {step}
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {description}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

FeatureCard.propTypes = {
  label: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

StepCard.propTypes = {
  step: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
};

export default Home;