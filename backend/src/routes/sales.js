import { Router } from 'express'
import {
  createSale,
  deleteSale,
  getSale,
  getSaleStats,
  getTopProducts,
  listSales,
} from '../controllers/saleController.js'

const router = Router()

router.get('/', listSales)
router.get('/stats', getSaleStats)
router.get('/top-products', getTopProducts)
router.get('/:id', getSale)
router.post('/', createSale)
router.delete('/:id', deleteSale)

export default router
