import 'dotenv/config'
import { connectDB } from '../config/db.js'
import Category from '../models/Category.js'
import Product from '../models/Product.js'
import { CATEGORIES, PRODUCT_SEED } from './productData.js'

async function seed() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI missing')

  await connectDB(uri)

  await Product.deleteMany({})
  await Category.deleteMany({})

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

  console.log(`Seeded ${createdCategories.length} categories, ${products.length} products`)
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
