import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Home from "./Home";

// Mock useAuth hook
jest.mock("react-oidc-context", () => ({
  useAuth: jest.fn(),
}));

const { useAuth } = require("react-oidc-context");

describe("Home component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders heading and welcome message", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {
          email: "test@example.com",
          "cognito:groups": ["User", "Admin"]
        }
      },
    });

    render(<Home />);

    const heading = screen.getByText(/Welcome to SAACGAIS/i);
    expect(heading).toBeInTheDocument();
  });

  test("displays user roles when authenticated and has roles", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {
          email: "test@example.com",
          "cognito:groups": ["User", "Admin"]
        }
      },
    });

    render(<Home />);

    const rolesText = screen.getByText(/You are assigned the following roles:/i);
    expect(rolesText).toBeInTheDocument();

    const userChip = screen.getByText("User");
    expect(userChip).toBeInTheDocument();

    const adminChip = screen.getByText("Admin");
    expect(adminChip).toBeInTheDocument();
  });

  test("displays message when authenticated but has no roles", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {
          email: "test@example.com",
          "cognito:groups": []
        }
      },
    });

    render(<Home />);

    const noRolesText = screen.getByText(/You are not assigned to any roles/i);
    expect(noRolesText).toBeInTheDocument();
  });

  test("displays message when not authenticated", () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    render(<Home />);

    const notLoggedInText = screen.getByText(/You are not logged in/i);
    expect(notLoggedInText).toBeInTheDocument();
  });

  test("handles missing cognito:groups gracefully", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: {
        profile: {
          email: "test@example.com",
          // No cognito:groups property
        }
      },
    });

    render(<Home />);

    const noRolesText = screen.getByText(/You are not assigned to any roles/i);
    expect(noRolesText).toBeInTheDocument();
  });
});