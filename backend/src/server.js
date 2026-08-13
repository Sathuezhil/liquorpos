import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { connectDB } from './config/db.js'
import authRoutes from './routes/auth.js'
import categoryRoutes from './routes/categories.js'
import customerRoutes from './routes/customers.js'
import dashboardRoutes from './routes/dashboard.js'
import productRoutes from './routes/products.js'
import salesRoutes from './routes/sales.js'

const app = express()
const PORT = Number(process.env.PORT) || 5000

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'liquorpos API ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/products', productRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/sales', salesRoutes)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ success: false, message: err.message || 'Server error' })
})

async function start() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is required')

  await connectDB(uri)
  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
