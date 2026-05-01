import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import Home from "./Home";

// 1. Mock your local AuthContext
jest.mock("../context/AuthContext.js", () => ({
  useAuth: jest.fn(),
}));

const { useAuth } = require("../context/AuthContext.js");

describe("Home component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  test("renders heading and welcome message", () => {
  useAuth.mockReturnValue({
    isAuthenticated: true,
    user: { groups: ["User", "Admin"] },
  });

  render(<Home />);

  // The actual heading in the component is "Secure AI Support for Healthcare Workflows"
  const heading = screen.getByText(/Secure AI Support for Healthcare Workflows/i);
  expect(heading).toBeInTheDocument();
  
  // Also check for the authenticated dashboard section
  expect(screen.getByText(/Welcome to SAACGAIS/i)).toBeInTheDocument();
});

test("displays message when not authenticated", () => {
  useAuth.mockReturnValue({
    isAuthenticated: false,
    user: null,
  });

  render(<Home />);

  // The component doesn't show "You are not logged in" when unauthenticated
  // Instead, it shows the login/signup buttons in the hero section
  expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /create account/i })).toBeInTheDocument();
});
});