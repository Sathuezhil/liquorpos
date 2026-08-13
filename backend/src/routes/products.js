import { Router } from 'express'
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProductsByCategory,
  listProducts,
  updateProduct,
} from '../controllers/productController.js'

const router = Router()

router.get('/', listProducts)
router.get('/by-category', getProductsByCategory)
router.get('/:id', getProduct)
router.post('/', createProduct)
router.put('/:id', updateProduct)
router.delete('/:id', deleteProduct)

export default router
