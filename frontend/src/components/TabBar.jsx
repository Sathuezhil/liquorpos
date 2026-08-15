import { NavLink } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

export const APP_TABS = [
  { to: '/dashboard', labelKey: 'tabs.dashboard' },
  { to: '/pos', labelKey: 'tabs.pos' },
  { to: '/product', labelKey: 'tabs.product' },
  { to: '/sales', labelKey: 'tabs.sales' },
  { to: '/customer', labelKey: 'tabs.customer' },
]

export default function TabBar() {
  const { t } = useI18n()

  return (
    <nav className="tab-bar" aria-label="Main">
      {APP_TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}
        >
          {t(tab.labelKey)}
        </NavLink>
      ))}
    </nav>
  )
}
