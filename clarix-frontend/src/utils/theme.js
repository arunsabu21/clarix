export const THEME_KEY = "clarix_theme";

export function applyTheme(mode) {
  const root = document.documentElement;

  if (mode === "dark") {
    root.setAttribute("data-theme", "dark");
  } else if (mode === "light") {
    root.removeAttribute("data-theme");
  } else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
  }

  localStorage.setItem(THEME_KEY, mode);
}

export function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) || "auto";
}