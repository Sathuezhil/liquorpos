import Customer from '../models/Customer.js'
import Product from '../models/Product.js'
import Sale from '../models/Sale.js'

function formatMoney(value) {
  return `€ ${Number(value).toFixed(2)}`
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function getDashboardStats(_req, res) {
  try {
    const [sales, totalProduct, totalCustomer] = await Promise.all([
      Sale.find().lean(),
      Product.countDocuments(),
      Customer.countDocuments(),
    ])

    const now = new Date()
    const todayStart = startOfDay(now)
    const weekStart = new Date(todayStart)
    weekStart.setDate(weekStart.getDate() - 7)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    let totalProductSold = 0
    let todayRevenue = 0
    let weeklyRevenue = 0
    let monthlyRevenue = 0
    let totalRevenue = 0

    for (const sale of sales) {
      const qty = (sale.items || []).reduce((sum, i) => sum + Number(i.quantity || 0), 0)
      totalProductSold += qty
      const amount = Number(sale.amount || 0)
      totalRevenue += amount
      const d = new Date(sale.orderDate || sale.createdAt)
      if (d >= todayStart) todayRevenue += amount
      if (d >= weekStart) weeklyRevenue += amount
      if (d >= monthStart) monthlyRevenue += amount
    }

    res.json({
      success: true,
      data: {
        top: [
          { value: String(totalProductSold), label: 'Total Product Sold' },
          { value: formatMoney(todayRevenue), label: "Today's Revenue" },
          { value: formatMoney(weeklyRevenue), label: 'Weekly Revenue' },
          { value: formatMoney(monthlyRevenue), label: 'Monthly Revenue' },
          { value: formatMoney(totalRevenue), label: 'Total Revenue' },
        ],
        bottom: [
          { value: String(totalProduct), label: 'Total Product' },
          { value: String(totalCustomer), label: 'Total Customer' },
        ],
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
