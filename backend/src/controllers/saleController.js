import mongoose from 'mongoose'
import Customer from '../models/Customer.js'
import Sale from '../models/Sale.js'

function getInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function formatDate(date) {
  const d = new Date(date)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function formatMoney(value) {
  return `€ ${Number(value).toFixed(2)}`
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function serializeSale(doc) {
  const itemCount = (doc.items || []).reduce((sum, i) => sum + Number(i.quantity || 0), 0)
  return {
    key: String(doc._id),
    id: `Or ${doc.orderId}`,
    orderTitle: `Order ${doc.orderId}`,
    orderId: doc.orderId,
    customer: doc.customerName,
    fullName: doc.fullName || doc.customerName,
    email: doc.email,
    orderDate: formatDate(doc.orderDate || doc.createdAt),
    initials: getInitials(doc.customerName),
    contact: doc.contact,
    items: itemCount,
    amount: doc.amount,
    status: doc.status,
    orderItems: doc.items || [],
  }
}

async function nextOrderId() {
  const last = await Sale.findOne().sort({ orderId: -1 }).lean()
  const n = last ? Number(last.orderId) + 1 : 1
  return String(n).padStart(3, '0')
}

async function findSale(id) {
  if (mongoose.isValidObjectId(id)) {
    const byId = await Sale.findById(id)
    if (byId) return byId
  }
  const cleaned = String(id).replace(/^Or\s+/i, '').replace(/^Order\s+/i, '')
  return Sale.findOne({ orderId: cleaned.padStart(3, '0') })
}

function periodFilter(period, date) {
  if (!period || period === 'all') return {}
  const base = date ? new Date(date) : new Date()
  if (Number.isNaN(base.getTime())) return {}

  if (period === 'now') {
    const start = startOfDay(base)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    return { orderDate: { $gte: start, $lt: end } }
  }

  if (period === 'weekly') {
    const end = startOfDay(base)
    end.setDate(end.getDate() + 1)
    const start = new Date(end)
    start.setDate(start.getDate() - 7)
    return { orderDate: { $gte: start, $lt: end } }
  }

  if (period === 'monthly') {
    const start = new Date(base.getFullYear(), base.getMonth(), 1)
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 1)
    return { orderDate: { $gte: start, $lt: end } }
  }

  return {}
}

export async function listSales(req, res) {
  try {
    const { search = '', status = 'all', period = '', date = '' } = req.query
    const filter = { ...periodFilter(period, date) }

    if (status && status !== 'all') filter.status = status

    if (search.trim()) {
      const q = search.trim()
      filter.$or = [
        { customerName: { $regex: q, $options: 'i' } },
        { contact: { $regex: q, $options: 'i' } },
        { orderId: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ]
    }

    const sales = await Sale.find(filter).sort({ orderId: -1 })
    res.json({ success: true, data: sales.map(serializeSale) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export async function getSaleStats(_req, res) {
  try {
    const sales = await Sale.find().lean()
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
      data: [
        { value: String(totalProductSold), label: 'Total Product Sold' },
        { value: formatMoney(todayRevenue), label: "Today's Revenue" },
        { value: formatMoney(weeklyRevenue), label: 'Weekly Revenue' },
        { value: formatMoney(monthlyRevenue), label: 'Monthly Revenue' },
        { value: formatMoney(totalRevenue), label: 'Total Revenue' },
      ],
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export async function getTopProducts(_req, res) {
  try {
    const sales = await Sale.find().lean()
    const map = new Map()

    for (const sale of sales) {
      for (const item of sale.items || []) {
        const key = `${item.product}__${item.size}`
        const prev = map.get(key) || {
          key,
          orderId: `Or ${sale.orderId}`,
          product: item.product,
          size: item.size,
          quantity: 0,
          revenue: 0,
        }
        prev.quantity += Number(item.quantity || 0)
        prev.revenue += Number(item.total || 0)
        map.set(key, prev)
      }
    }

    const data = [...map.values()]
      .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
      .slice(0, 50)

    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export async function getSale(req, res) {
  try {
    const sale = await findSale(req.params.id)
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' })
    }
    res.json({ success: true, data: serializeSale(sale) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export async function createSale(req, res) {
  try {
    const {
      customerId,
      customerName,
      fullName,
      email = 'example@gmail.com',
      contact,
      items = [],
      status = 'unpaid',
      orderDate,
    } = req.body

    let customerDoc = null
    if (customerId && mongoose.isValidObjectId(customerId)) {
      customerDoc = await Customer.findById(customerId)
    }

    const name = String(customerName || customerDoc?.name || '').trim()
    const phone = String(contact || customerDoc?.contact || '').trim()
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'customer name and contact are required' })
    }

    const normalizedItems = (items || []).map((item) => {
      const amount = Number(item.amount || 0)
      const quantity = Number(item.quantity || 1)
      return {
        product: String(item.product || item.name || '').trim(),
        size: String(item.size || '').trim(),
        amount,
        quantity,
        total: Number(item.total != null ? item.total : amount * quantity),
      }
    })

    if (normalizedItems.length === 0 || normalizedItems.some((i) => !i.product || !i.size)) {
      return res.status(400).json({ success: false, message: 'At least one valid order item is required' })
    }

    const amount = normalizedItems.reduce((sum, i) => sum + Number(i.total || 0), 0)

    const sale = await Sale.create({
      orderId: await nextOrderId(),
      customer: customerDoc?._id || null,
      customerName: name,
      fullName: String(fullName || name).trim(),
      email: String(email || customerDoc?.email || 'example@gmail.com').trim(),
      contact: phone,
      orderDate: orderDate ? new Date(orderDate) : new Date(),
      items: normalizedItems,
      amount,
      status: status === 'paid' ? 'paid' : 'unpaid',
    })

    res.status(201).json({ success: true, data: serializeSale(sale) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export async function updateSaleStatus(req, res) {
  try {
    const sale = await findSale(req.params.id)
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' })
    }

    const next = String(req.body?.status || '').toLowerCase()
    if (next !== 'paid' && next !== 'unpaid') {
      return res.status(400).json({ success: false, message: 'status must be paid or unpaid' })
    }

    sale.status = next
    await sale.save()
    res.json({ success: true, data: serializeSale(sale) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export async function deleteSale(req, res) {
  try {
    const sale = await findSale(req.params.id)
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' })
    }
    await sale.deleteOne()
    res.json({ success: true, message: 'Sale deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
