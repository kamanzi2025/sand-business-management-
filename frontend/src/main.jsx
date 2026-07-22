import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { SettingsProvider } from './context/SettingsContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import OfflineBanner from './components/OfflineBanner.jsx'
import AuthGate from './components/AuthGate.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <OfflineBanner />
      <BrowserRouter>
        <AuthProvider>
          <AuthGate>
            <SettingsProvider>
              <App />
            </SettingsProvider>
          </AuthGate>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
