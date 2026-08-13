import mongoose from 'mongoose'

const saleItemSchema = new mongoose.Schema(
  {
    product: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const saleSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, trim: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    customerName: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, default: 'example@gmail.com', trim: true },
    contact: { type: String, required: true, trim: true },
    orderDate: { type: Date, default: Date.now },
    items: { type: [saleItemSchema], default: [] },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
  },
  { timestamps: true },
)

export default mongoose.model('Sale', saleSchema)
