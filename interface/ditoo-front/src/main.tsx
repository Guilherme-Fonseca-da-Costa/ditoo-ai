import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from "react-router";
import './assets/index.css'
import './assets/loginPage.css'
import './assets/fonts.css'
import Chat from "./pages/Chat"
import LoginPage from './pages/LoginPage.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/chat" element={<Chat />} />  
        <Route path="/login" element={<LoginPage />} />  
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
