import mongoose from 'mongoose'

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contact: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
  },
  {
    versionKey: false,
    timestamps: false,
  },
)

customerSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } })

export default mongoose.model('Customer', customerSchema)
