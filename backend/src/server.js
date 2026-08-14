import app from './app.js'
import { connectDB } from './config/db.js'

const PORT = Number(process.env.PORT) || 5000

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
