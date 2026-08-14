import mongoose from 'mongoose'
import Category from '../models/Category.js'
import Product from '../models/Product.js'

function stockStatus(qty) {
  if (qty <= 0) return 'out'
  if (qty <= 20) return 'low'
  return 'in'
}

function serializeProduct(doc) {
  const obj = doc.toJSON()
  return {
    id: obj.productId,
    _id: obj._id,
    productId: obj.productId,
    name: obj.name,
    size: obj.size,
    amount: obj.amount,
    quantity: obj.quantity,
    status: stockStatus(obj.quantity),
    category:
      obj.category && typeof obj.category === 'object'
        ? {
            id: obj.category._id,
            name: obj.category.name,
            slug: obj.category.slug,
          }
        : obj.category,
  }
}

async function findCategory(category) {
  if (!category) return null
  if (mongoose.isValidObjectId(category)) {
    return Category.findById(category)
  }
  return Category.findOne({
    $or: [{ slug: String(category).toLowerCase() }, { name: new RegExp(`^${category}$`, 'i') }],
  })
}

async function findProductByParam(id) {
  if (mongoose.isValidObjectId(id)) {
    const byId = await Product.findById(id)
    if (byId) return byId
  }
  return Product.findOne({ productId: id })
}

async function nextProductId() {
  const last = await Product.findOne().sort({ productId: -1 }).lean()
  const n = last ? Number(last.productId) + 1 : 1
  return String(n).padStart(3, '0')
}

export async function listProducts(req, res) {
  try {
    const { search = '', status = 'all', category = '' } = req.query
    const filter = {}

    if (category) {
      const cat = await findCategory(category)
      if (cat) filter.category = cat._id
    }

    if (search.trim()) {
      const q = search.trim()
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { productId: { $regex: q, $options: 'i' } },
        { size: { $regex: q, $options: 'i' } },
      ]
    }

    const products = await Product.find(filter).populate('category').sort({ productId: 1 })
    let data = products.map(serializeProduct)

    if (status && status !== 'all') {
      data = data.filter((p) => p.status === status)
    }

    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export async function getProductsByCategory(_req, res) {
  try {
    const categories = await Category.find().sort({ name: 1 })
    const products = await Product.find().populate('category').sort({ productId: 1 })

    const grouped = categories.map((cat) => ({
      id: cat._id,
      name: cat.name,
      slug: cat.slug,
      products: products
        .filter((p) => String(p.category?._id) === String(cat._id))
        .map(serializeProduct),
    }))

    res.json({ success: true, data: grouped })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export async function getProduct(req, res) {
  try {
    const product = await findProductByParam(req.params.id)
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }
    await product.populate('category')
    res.json({ success: true, data: serializeProduct(product) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export async function createProduct(req, res) {
  try {
    const { name, size, amount, quantity = 20, category } = req.body
    if (!name || !size || amount == null || !category) {
      return res.status(400).json({
        success: false,
        message: 'name, size, amount and category are required',
      })
    }

    const cat = await findCategory(category)
    if (!cat) {
      return res.status(400).json({ success: false, message: 'Invalid category' })
    }

    const product = await Product.create({
      productId: await nextProductId(),
      name: String(name).trim(),
      size: String(size).trim(),
      amount: Number(amount),
      quantity: Number(quantity),
      category: cat._id,
    })

    await product.populate('category')
    res.status(201).json({ success: true, data: serializeProduct(product) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export async function updateProduct(req, res) {
  try {
    const { name, size, amount, quantity, category } = req.body
    const product = await findProductByParam(req.params.id)

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }

    if (name != null) product.name = String(name).trim()
    if (size != null) product.size = String(size).trim()
    if (amount != null) product.amount = Number(amount)
    if (quantity != null) product.quantity = Number(quantity)

    if (category) {
      const cat = await findCategory(category)
      if (!cat) {
        return res.status(400).json({ success: false, message: 'Invalid category' })
      }
      product.category = cat._id
    }

    await product.save()
    await product.populate('category')
    res.json({ success: true, data: serializeProduct(product) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export async function deleteProduct(req, res) {
  try {
    const existing = await findProductByParam(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' })
    }

    await existing.deleteOne()
    res.json({ success: true, message: 'Product deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
