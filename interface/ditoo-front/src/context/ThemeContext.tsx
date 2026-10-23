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

function readPreference<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return allowed.includes(value as T) ? value as T : fallback;
  } catch { return fallback; }
}

function savePreference(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* Keep the preference in memory. */ }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(
    () => readPreference<Theme>("ditoo-theme", ["light", "dark"], "dark")
  );
  const [accent, setAccentState] = useState<AccentColor>(
    () => readPreference<AccentColor>("ditoo-accent", ["violet", "blue", "rose", "amber", "emerald"], "violet")
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    savePreference("ditoo-theme", theme);
  }, [theme]);

  useEffect(() => {
    const hex = ACCENT_COLORS[accent].hex;
    document.documentElement.style.setProperty("--accent", hex);
    document.documentElement.style.setProperty("--accent-soft", hex + "18");
    savePreference("ditoo-accent", accent);
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
