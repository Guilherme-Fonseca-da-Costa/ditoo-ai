import { createContext, useContext, useEffect, useState } from "react";

export type AccentColor = "violet" | "blue" | "rose" | "amber" | "emerald";
export type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  accent: AccentColor;
  toggleTheme: () => void;
  setAccent: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const ACCENT_COLORS: Record<AccentColor, { hex: string; label: string }> = {
  violet:  { hex: "#7c3aed", label: "Violeta"  },
  blue:    { hex: "#2563eb", label: "Azul"     },
  rose:    { hex: "#e11d48", label: "Rosa"     },
  amber:   { hex: "#d97706", label: "Âmbar"    },
  emerald: { hex: "#059669", label: "Esmeralda"},
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("ditoo-theme") as Theme) ?? "dark"
  );
  const [accent, setAccentState] = useState<AccentColor>(
    () => (localStorage.getItem("ditoo-accent") as AccentColor) ?? "violet"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ditoo-theme", theme);
  }, [theme]);

  useEffect(() => {
    const hex = ACCENT_COLORS[accent].hex;
    document.documentElement.style.setProperty("--accent", hex);
    document.documentElement.style.setProperty("--accent-soft", hex + "18");
    localStorage.setItem("ditoo-accent", accent);
  }, [accent]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const setAccent = (c: AccentColor) => setAccentState(c);

  return (
    <ThemeContext.Provider value={{ theme, accent, toggleTheme, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
