import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import PropTypes from "prop-types";
import CssBaseline from "@mui/material/CssBaseline";

const ThemeContext = createContext();

export function useThemeMode() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("darkMode") !== null
      ? localStorage.getItem("darkMode") === "true"
      : typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  // Persist preference to localStorage
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Follow system preference changes
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setDarkMode(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? "dark" : "light",
      background: {
        // Light mode: white, Dark mode: deep charcoal
        default: darkMode ? "#121212" : "#f5f5f5",
        // Light mode: white, Dark mode: your preferred lighter grey
        paper: darkMode ? "#1e1e1e" : "#ffffff",
      },
      divider: darkMode ? "#2a2a2a" : "#e0e0e0",
    },
  }), [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};