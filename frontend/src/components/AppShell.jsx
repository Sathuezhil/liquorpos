import { useEffect, useState } from 'react'
import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import TabBar from './TabBar'

function formatNow(date) {
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  const dayDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  return { time, dayDate }
}

export default function AppShell() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [now, setNow] = useState(() => new Date())
  const [logoutOpen, setLogoutOpen] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  if (!user) return <Navigate to="/login" replace />

  const { time, dayDate } = formatNow(now)

  function confirmLogout() {
    setLogoutOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <h1 className="brand">Point of Sales</h1>
        <div className="top-actions">
          <div className="pill pill-info pill-datetime">
            <img className="pill-icon" src="/dashboard/time.svg" alt="" />
            <div className="pill-datetime-text">
              <span className="pill-time">{time}</span>
              <span className="pill-date">{dayDate}</span>
            </div>
          </div>
          <div className="pill pill-info pill-admin">
            <img className="pill-icon" src="/dashboard/admin.svg" alt="" />
            <span>{user.name}</span>
          </div>
          <button
            type="button"
            className="pill pill-logout"
            onClick={() => setLogoutOpen(true)}
          >
            <img className="pill-icon" src="/dashboard/logout.svg" alt="" />
            <span className="pill-logout-label">Log out</span>
          </button>
        </div>
      </header>

      <TabBar />

      <main className="main-area">
        <Outlet />
      </main>

      {logoutOpen ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setLogoutOpen(false)}
        >
          <div
            className="logout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="logout-title">Log Out</h2>
            <p>Please confirm if you want to log out.</p>
            <div className="logout-modal-actions">
              <button
                type="button"
                className="logout-btn-no"
                onClick={() => setLogoutOpen(false)}
              >
                No
              </button>
              <button type="button" className="logout-btn-yes" onClick={confirmLogout}>
                Yes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
