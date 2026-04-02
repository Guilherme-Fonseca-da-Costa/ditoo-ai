import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from "react-router";
import './assets/index.css'
import './assets/loginPage.css'
import './assets/fonts.css'
import './assets/configPage.css'
import Chat from "./pages/Chat"
import LoginPage from './pages/LoginPage.tsx';
import Config from './pages/Config.tsx';
import NotFound from './pages/NotFound.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/chat" element={<Chat />} />  
        <Route path="/login" element={<LoginPage />} />  
        <Route path="/config" element={<Config />} />
         <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
