import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 20,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
  },
  { timestamps: true },
)

productSchema.virtual('status').get(function status() {
  if (this.quantity <= 0) return 'out'
  if (this.quantity <= 20) return 'low'
  return 'in'
})

productSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    ret.id = ret.productId
    delete ret.__v
    return ret
  },
})

export default mongoose.model('Product', productSchema)
