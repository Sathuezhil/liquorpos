import 'dotenv/config'
import { connectDB } from '../config/db.js'
import Category from '../models/Category.js'
import Customer from '../models/Customer.js'
import Product from '../models/Product.js'
import Sale from '../models/Sale.js'
import User from '../models/User.js'
import { CATEGORIES, PRODUCT_SEED } from './productData.js'

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI missing')

  await connectDB(uri)

  await Promise.all([
    Sale.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    User.deleteMany({}),
  ])

  try {
    await Customer.collection.drop()
  } catch {
    await Customer.deleteMany({})
  }

  const passwordHash = await User.hashPassword('admin')
  await User.create({
    username: 'admin',
    passwordHash,
    name: 'Admin',
    role: 'admin',
  })

  const createdCategories = await Category.insertMany(CATEGORIES)
  const bySlug = Object.fromEntries(createdCategories.map((c) => [c.slug, c._id]))

  const products = PRODUCT_SEED.map((item, index) => ({
    productId: String(index + 1).padStart(3, '0'),
    name: item.name,
    size: item.size,
    amount: item.amount,
    quantity: 20,
    category: bySlug[item.category],
  }))
  await Product.insertMany(products)

  const customerSeed = [
    { name: 'Kishana', contact: '0775512445', email: 'kishana@gmail.com' },
    { name: 'John Doe', contact: '0777669122', email: 'example@gmail.com' },
    { name: 'James', contact: '0771234567', email: 'james@gmail.com' },
    { name: 'Maria', contact: '0779876543', email: 'maria@gmail.com' },
    { name: 'Alex', contact: '0775551212', email: 'alex@gmail.com' },
  ]

  const customers = await Customer.insertMany(customerSeed)

  const sampleItems = [
    { product: 'Poliakove', size: '20 cl', amount: 2.4, quantity: 2, total: 4.8 },
    { product: 'Jack Daniels', size: '70 cl', amount: 15, quantity: 1, total: 15 },
    { product: 'Gibson Gin', size: '20 cl', amount: 2.85, quantity: 2, total: 5.7 },
  ]

  const sales = customers.slice(0, 5).map((customer, i) => {
    const items = sampleItems.slice(0, (i % 3) + 1)
    const amount = items.reduce((sum, item) => sum + item.total, 0)
    return {
      orderId: String(i + 1).padStart(3, '0'),
      customer: customer._id,
      customerName: customer.name,
      fullName: customer.name,
      email: customer.email,
      contact: customer.contact,
      orderDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      items,
      amount,
      status: i === 0 ? 'unpaid' : 'paid',
    }
  })

  await Sale.insertMany(sales)

  console.log(
    `Seeded users=1, categories=${createdCategories.length}, products=${products.length}, customers=${customers.length}, sales=${sales.length}`,
  )
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
