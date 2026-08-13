import { useEffect, useState } from 'react'
import { api } from '../api'

function StatCard({ value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

export default function Dashboard() {
  const [statsTop, setStatsTop] = useState([])
  const [statsBottom, setStatsBottom] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    api
      .getDashboardStats()
      .then((res) => {
        if (!alive) return
        setStatsTop(res.data?.top || [])
        setStatsBottom(res.data?.bottom || [])
      })
      .catch((err) => {
        if (!alive) return
        setError(err.message || 'Failed to load dashboard')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="dashboard-panel">
      {error ? <p className="api-error">{error}</p> : null}
      {loading ? <p className="api-loading">Loading dashboard...</p> : null}

      <div className="stat-grid stat-grid-top">
        {statsTop.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>
      <div className="stat-grid stat-grid-bottom">
        {statsBottom.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>
    </div>
  )
}
