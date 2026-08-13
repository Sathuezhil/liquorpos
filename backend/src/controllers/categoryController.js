import Category from '../models/Category.js'

export async function listCategories(_req, res) {
  try {
    const categories = await Category.find().sort({ name: 1 })
    res.json({
      success: true,
      data: categories.map((c) => ({
        id: c._id,
        name: c.name,
        slug: c.slug,
      })),
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
