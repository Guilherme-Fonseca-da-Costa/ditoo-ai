import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router";

import { ThemeProvider } from "./context/ThemeContext";
import "./assets/index.css";

import Chat from "./pages/Chat";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/chat"  element={<Chat />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="*"      element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
