import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

// Prevent accidental webview file navigation on drag-and-drop
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => e.preventDefault());

// Disable right-click context menu in production
if (import.meta.env.PROD) {
  window.addEventListener("contextmenu", (e) => e.preventDefault());
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
