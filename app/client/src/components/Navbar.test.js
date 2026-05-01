import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "./Navbar";
import { ThemeProvider } from "../context/ThemeContext";

jest.mock("../context/AuthContext.js", () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    logout: jest.fn(),
  }),
}));

describe("Navbar component", () => {
  test("renders brand title and basic navigation buttons", () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <Navbar />
        </ThemeProvider>
      </MemoryRouter>
    );

    // Verify brand logo
    const brandLogo = screen.getByAltText(/SAACGAIS logo/i);
    expect(brandLogo).toBeInTheDocument();
    
    // Verify standard links
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    
    // Verify About icon button (external link)
    const aboutLink = screen.getByRole("link", { 
      href: "https://saacgais-team.github.io/SAACGAIS/" 
    });
    expect(aboutLink).toBeInTheDocument();
    expect(aboutLink).toHaveAttribute("target", "_blank");
    
    // Verify login button exists when unauthenticated
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });
});