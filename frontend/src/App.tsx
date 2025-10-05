import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'

import LoginPage from './features/auth/LoginPage'
import RegisterPage from './features/auth/RegisterPage'
import CitizenDashboard from './features/dashboard/CitizenDashboard'
import RescuerDashboard from './features/dashboard/RescuerDashboard'
import OperatorDashboard from './features/dashboard/OperatorDashboard'
import { CoordinatorDashboard } from './features/dashboard/CoordinatorDashboard'
import AdminDashboard from './features/dashboard/AdminDashboard'

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
        
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoleBasedDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
