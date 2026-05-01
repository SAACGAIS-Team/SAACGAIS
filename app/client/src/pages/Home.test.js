import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Home from "./Home";

jest.mock("../context/AuthContext.js", () => ({
  useAuth: jest.fn(),
}));

const { useAuth } = require("../context/AuthContext.js");

describe("Home component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders hero heading and welcome message when authenticated", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { groups: ["User", "Admin"] },
    });

    render(<Home />);

    expect(screen.getByText(/Secure AI Support for Healthcare Workflows/i)).toBeInTheDocument();
    expect(screen.getByText(/Welcome to SAACGAIS/i)).toBeInTheDocument();
  });

  test("displays user roles when authenticated and has roles", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { groups: ["User", "Admin"] },
    });

    render(<Home />);

    expect(screen.getByText(/You are assigned the following roles:/i)).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  test("displays message when authenticated but has no roles", () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      user: { groups: [] },
    });

    render(<Home />);

    expect(screen.getByText(/You are signed in, but no role has been assigned yet/i)).toBeInTheDocument();
  });

  test("displays login and signup buttons when not authenticated", () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    render(<Home />);

    // Match exact button text with proper capitalization
    expect(screen.getByRole("button", { name: /^Log In$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Create Account$/i })).toBeInTheDocument();
  });
});