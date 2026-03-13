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

    const heading = screen.getByText(/Welcome to SAACGAIS/i);
    expect(heading).toBeInTheDocument();
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

    expect(screen.getByText(/You are not assigned to any roles/i)).toBeInTheDocument();
  });

  test("displays message when not authenticated", () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
    });

    render(<Home />);

    expect(screen.getByText(/You are not logged in/i)).toBeInTheDocument();
  });
});