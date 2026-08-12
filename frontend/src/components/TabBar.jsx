import { NavLink } from 'react-router-dom'

export const APP_TABS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/pos', label: 'POS' },
  { to: '/product', label: 'Product' },
  { to: '/sales', label: 'Sales' },
  { to: '/customer', label: 'Customer' },
]

export default function TabBar() {
  return (
    <nav className="tab-bar" aria-label="Main">
      {APP_TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
