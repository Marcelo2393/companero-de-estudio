import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'

import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import Alerts from './pages/Alerts'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Mentors from './pages/Mentors'
import Risk from './pages/Risk'
import StudyPlan from './pages/StudyPlan'
import { AuthProvider, useAuth } from './services/auth'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { student } = useAuth()
  if (!student) return <Navigate to="/login" replace />
  return <>{children}</>
}

function Layout() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto animate-fade-in">
          <div className="min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/plan" element={<StudyPlan />} />
        <Route path="/alertas" element={<Alerts />} />
        <Route path="/mentores" element={<Mentors />} />
        <Route path="/riesgo" element={<Risk />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
