import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { Toaster } from 'react-hot-toast'

import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import CitizenDashboard from './features/dashboard/CitizenDashboard'
import RescuerDashboard from './features/dashboard/RescuerDashboard'
import OperatorDashboard from './features/dashboard/OperatorDashboard'
import CoordinatorDashboard from './features/dashboard/CoordinatorDashboard'
import AdminDashboard from './features/dashboard/AdminDashboard'
import SOSStandalonePage from './features/sos/SOSStandalonePage'
import DownloadPage from './features/download/DownloadPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, fetchCurrentUser } = useAuthStore()
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentUser().catch(() => {
      })
    }
  }, [isAuthenticated, fetchCurrentUser])
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function RoleBasedDashboard() {
  const { user } = useAuthStore()
  
  switch (user?.role) {
    case 'citizen':
      return <CitizenDashboard />
    case 'rescuer':
      return <RescuerDashboard />
    case 'operator':
      return <OperatorDashboard />
    case 'coordinator':
      return <CoordinatorDashboard />
    case 'admin':
      return <AdminDashboard />
    default:
      return <CitizenDashboard />
  }
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/download" element={<DownloadPage />} />
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoleBasedDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sos"
          element={
            <ProtectedRoute>
              <SOSStandalonePage />
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '16px',
            padding: '16px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              border: '1px solid rgba(16, 185, 129, 0.3)',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              border: '1px solid rgba(239, 68, 68, 0.3)',
            },
          },
        }}
      />
    </BrowserRouter>
  )
}

export default App
