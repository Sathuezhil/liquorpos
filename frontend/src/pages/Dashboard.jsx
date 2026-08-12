const statsTop = [
  { value: '45', label: 'Total Product Sold' },
  { value: '€ 123.00', label: "Today's Revenue" },
  { value: '€ 123.00', label: 'Weekly Revenue' },
  { value: '€ 123.00', label: 'Monthly Revenue' },
  { value: '€ 123.00', label: 'Total Revenue' },
]

const statsBottom = [
  { value: '45', label: 'Total Product' },
  { value: '123', label: 'Total Customer' },
]

function StatCard({ value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <div className="dashboard-panel">
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
