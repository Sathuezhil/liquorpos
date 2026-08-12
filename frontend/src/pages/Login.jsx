import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (user) return <Navigate to="/dashboard" replace />

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const result = login(username, password)
    if (result.ok) {
      navigate('/dashboard', { replace: true })
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Admin Login</h1>

        <div className="login-field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="eg; Pepsi"
          />
        </div>

        <div className="login-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error ? <p className="login-error">{error}</p> : null}

        <button type="submit" className="login-btn">
          Login
        </button>
      </form>
    </div>
  )
}
