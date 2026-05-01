import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "./Home";
import { useAuth } from "../context/AuthContext";

jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../context/ThemeContext.js", () => ({
  useThemeMode: () => ({ darkMode: false }),
}));

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

describe("Home component", () => {
  test("renders hero heading and welcome message when authenticated", () => {
    useAuth.mockReturnValue({
      user: {
        given_name: "Shawn",
        groups: ["User"],
      },
      isAuthenticated: true,
    });

    renderHome();

    expect(
      screen.getByText(/Secure AI Support for Healthcare Workflows/i)
    ).toBeInTheDocument();

    expect(screen.getByText(/Welcome to SAACGAIS/i)).toBeInTheDocument();
  });

  test("displays user roles when authenticated and has roles", () => {
    useAuth.mockReturnValue({
      user: {
        given_name: "Shawn",
        groups: ["User"],
      },
      isAuthenticated: true,
    });

    renderHome();

    expect(
      screen.getByText(/You are assigned the following roles:/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/You are assigned the following roles:/i)
    ).toBeInTheDocument();

expect(screen.getAllByText("User").length).toBeGreaterThan(0);
  });

  test("displays message when authenticated but has no roles", () => {
    useAuth.mockReturnValue({
      user: {
        given_name: "Shawn",
        groups: [],
      },
      isAuthenticated: true,
    });

    renderHome();

    expect(
      screen.getByText(/You are signed in, but no role has been assigned yet/i)
    ).toBeInTheDocument();
  });

  test("displays login and signup links when not authenticated", () => {
  useAuth.mockReturnValue({
    user: null,
    isAuthenticated: false,
  });

  renderHome();

  expect(screen.getByRole("link", { name: /^Log In$/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /^Create Account$/i })).toBeInTheDocument();
});
});