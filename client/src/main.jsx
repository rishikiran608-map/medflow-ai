import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { LanguageProvider } from './context/LanguageContext.jsx'
import { ChatProvider } from './context/ChatContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <ChatProvider>
        <App />
      </ChatProvider>
    </LanguageProvider>
  </StrictMode>,
)
