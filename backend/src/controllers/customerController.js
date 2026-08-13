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

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function getCustomerStats(customerObjectId) {
  const sales = await Sale.find({ customer: customerObjectId }).lean()
  const totalOrders = sales.length
  const amountSpend = sales.reduce((sum, s) => sum + Number(s.amount || 0), 0)
  return { totalOrders, amountSpend }
}

async function serializeCustomer(doc) {
  const stats = await getCustomerStats(doc._id)
  const shortId = String(doc._id).slice(-3).toUpperCase()
  const idLabel = `Cus ${shortId}`
  return {
    key: String(doc._id),
    id: idLabel,
    viewId: idLabel,
    name: doc.name,
    fullName: doc.name,
    email: doc.email || '',
    initials: getInitials(doc.name),
    contact: doc.contact,
    totalOrders: stats.totalOrders,
    amountSpend: stats.amountSpend,
    viewOrders: stats.totalOrders,
    viewSpend: stats.amountSpend,
  }
}

async function findCustomer(id) {
  if (mongoose.isValidObjectId(id)) {
    return Customer.findById(id)
  }
  return null
}

async function findByName(name, excludeId = null) {
  const filter = {
    name: { $regex: `^${escapeRegex(name.trim())}$`, $options: 'i' },
  }
  if (excludeId) filter._id = { $ne: excludeId }
  return Customer.findOne(filter)
}

export async function listCustomers(req, res) {
  try {
    const { search = '' } = req.query
    const filter = {}
    if (search.trim()) {
      const q = search.trim()
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { contact: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ]
    }

    const customers = await Customer.find(filter).sort({ name: 1 })
    const data = await Promise.all(customers.map(serializeCustomer))
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export async function getCustomer(req, res) {
  try {
    const customer = await findCustomer(req.params.id)
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' })
    }
    res.json({ success: true, data: await serializeCustomer(customer) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export async function createCustomer(req, res) {
  try {
    const name = String(req.body.name || '').trim()
    const contact = String(req.body.contact || req.body.phone || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()

    if (!name || !contact) {
      return res.status(400).json({ success: false, message: 'name and contact are required' })
    }

    const exists = await findByName(name)
    if (exists) {
      return res.status(409).json({ success: false, message: 'This customer name already exists.' })
    }

    const customer = await Customer.create({ name, contact, email })
    res.status(201).json({ success: true, data: await serializeCustomer(customer) })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'This customer name already exists.' })
    }
    res.status(500).json({ success: false, message: err.message })
  }
}

export async function updateCustomer(req, res) {
  try {
    const customer = await findCustomer(req.params.id)
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' })
    }

    const name = req.body.name != null ? String(req.body.name).trim() : customer.name
    const contact =
      req.body.contact != null || req.body.phone != null
        ? String(req.body.contact || req.body.phone).trim()
        : customer.contact
    const email =
      req.body.email != null ? String(req.body.email).trim().toLowerCase() : customer.email

    if (!name || !contact) {
      return res.status(400).json({ success: false, message: 'name and contact are required' })
    }

    const duplicate = await findByName(name, customer._id)
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'This customer name already exists.' })
    }

    customer.name = name
    customer.contact = contact
    customer.email = email
    await customer.save()

    res.json({ success: true, data: await serializeCustomer(customer) })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'This customer name already exists.' })
    }
    res.status(500).json({ success: false, message: err.message })
  }
}

export async function deleteCustomer(req, res) {
  try {
    const customer = await findCustomer(req.params.id)
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' })
    }
    await customer.deleteOne()
    res.json({ success: true, message: 'Customer deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
