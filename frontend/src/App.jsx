import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import AppShell from './components/AppShell'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import POS from './pages/POS'
import Product from './pages/Product'
import Sales from './pages/Sales'
import Customer from './pages/Customer'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/product" element={<Product />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/customer" element={<Customer />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
