export type ThemeMode = "dark" | "light";

const DARK = {
  bg: "#0d0d12",
  surface: "#15151e",
  surface2: "#1c1c28",
  border: "#2a2a3a",
  text: "#f1f0ff",
  text2: "#a1a1b5",
  muted: "#6b7280",
};

const LIGHT = {
  bg: "#f3f3f8",
  surface: "#ffffff",
  surface2: "#ebeaf4",
  border: "#d9d9e6",
  text: "#1a1a2e",
  text2: "#4b4b63",
  muted: "#6b7280",
};

// Objeto único e compartilhado por todas as telas.
// Cores de destaque não mudam entre os temas.
export const S = {
  ...DARK,
  purple: "#a855f7",
  purpleDim: "#7c3aed",
  green: "#22c55e",
  orange: "#f97316",
  blue: "#3b82f6",
};

export function applyTheme(mode: ThemeMode) {
  Object.assign(S, mode === "light" ? LIGHT : DARK);
  if (typeof document !== "undefined") {
    document.body.style.background = S.bg;
    document.documentElement.style.colorScheme = mode;
  }
}

export function readStoredTheme(): ThemeMode {
  try {
    return localStorage.getItem("finance-theme") === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function storeTheme(mode: ThemeMode) {
  try {
    localStorage.setItem("finance-theme", mode);
  } catch {
    /* ignora */
  }
}
