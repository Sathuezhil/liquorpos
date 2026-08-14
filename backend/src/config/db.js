import mongoose from 'mongoose'

export async function connectDB(uri) {
  if (!uri) throw new Error('MONGODB_URI is required')
  if (mongoose.connection.readyState >= 1) return

  mongoose.set('strictQuery', true)
  await mongoose.connect(uri)
  console.log('MongoDB connected')
}
