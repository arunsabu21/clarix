import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { MessageProvider } from "./context/MessageContext.jsx";
import { applyTheme, getStoredTheme } from "./utils/theme.js";
import "./styles/index.css";
import App from "./App.jsx";

applyTheme(getStoredTheme());

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", () => {
    if (getStoredTheme() === "auto") {
      applyTheme("auto");
    }
  });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MessageProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </MessageProvider>
  </StrictMode>,
);
