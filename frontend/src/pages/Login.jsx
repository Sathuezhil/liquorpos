import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { useI18n } from '../i18n/I18nContext'
import LanguageSelect from '../components/LanguageSelect'

export default function Login() {
  const { user, login } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(username, password)
      if (result.ok) {
        navigate('/dashboard', { replace: true })
      } else {
        setError(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-lang">
        <LanguageSelect />
      </div>
      <form className="login-card" onSubmit={handleSubmit} autoComplete="off">
        <h1>{t('login.title')}</h1>

        <div className="login-field">
          <label htmlFor="login-username">{t('login.username')}</label>
          <input
            id="login-username"
            name="login-username"
            type="text"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            readOnly
            onFocus={(e) => e.currentTarget.removeAttribute('readOnly')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('login.usernamePlaceholder')}
          />
        </div>

        <div className="login-field">
          <label htmlFor="login-password">{t('login.password')}</label>
          <input
            id="login-password"
            name="login-password"
            type="password"
            autoComplete="new-password"
            readOnly
            onFocus={(e) => e.currentTarget.removeAttribute('readOnly')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error ? <p className="login-error">{error}</p> : null}

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? t('login.submitting') : t('login.submit')}
        </button>
      </form>
    </div>
  )
}
