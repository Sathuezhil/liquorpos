import { useEffect, useState } from 'react'
import { api } from '../api'
import { useI18n } from '../i18n/I18nContext'
import { STAT_LABEL_KEYS } from '../i18n/translations'

function StatCard({ value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

export default function Dashboard() {
  const { t } = useI18n()
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
        setError(err.message || t('dashboard.error'))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [t])

  function translateLabel(label) {
    const key = STAT_LABEL_KEYS[label]
    return key ? t(key) : label
  }

  return (
    <div className="dashboard-panel">
      {error ? <p className="api-error">{error}</p> : null}
      {loading ? <p className="api-loading">{t('dashboard.loading')}</p> : null}

      <div className="stat-grid stat-grid-top">
        {statsTop.map((s) => (
          <StatCard key={s.label} value={s.value} label={translateLabel(s.label)} />
        ))}
      </div>
      <div className="stat-grid stat-grid-bottom">
        {statsBottom.map((s) => (
          <StatCard key={s.label} value={s.value} label={translateLabel(s.label)} />
        ))}
      </div>
    </div>
  )
}
