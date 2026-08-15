import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { useI18n } from '../i18n/I18nContext'

const PAGE_SIZE = 8

const EMPTY_FORM = {
  name: '',
  size: '',
  amount: '',
  stock: '',
  category: '',
}

function formatMoney(value) {
  return `€ ${Number(value).toFixed(2)}`
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="#0076D2" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function Product() {
  const { t } = useI18n()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const isEditing = Boolean(editingId)

  function statusLabel(status) {
    if (status === 'low') return t('product.lowStock')
    if (status === 'out') return t('product.outStock')
    return t('product.inStock')
  }

  async function loadProducts() {
    setLoading(true)
    setError('')
    try {
      const [productRes, categoryRes] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
      ])
      setProducts(productRes.data || [])
      setCategories(categoryRes.data || [])
    } catch (err) {
      setError(err.message || t('product.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        String(p.id).toLowerCase().includes(q) ||
        p.size.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || p.status === statusFilter
      const matchCategory =
        categoryFilter === 'all' ||
        p.category?.slug === categoryFilter ||
        p.category?.name === categoryFilter
      return matchSearch && matchStatus && matchCategory
    })
  }, [products, search, statusFilter, categoryFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])

  const showingFrom = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(currentPage * PAGE_SIZE, filtered.length)

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function openAddForm() {
    setEditingId(null)
    setForm({
      ...EMPTY_FORM,
      category: categories[0]?.slug || '',
    })
    setConfirmOpen(false)
    setFormOpen(true)
  }

  function openEditForm(product) {
    setEditingId(product.id)
    setForm({
      name: product.name,
      size: product.size,
      amount: String(product.amount),
      stock: String(product.quantity),
      category: product.category?.slug || product.category?.name || '',
    })
    setConfirmOpen(false)
    setFormOpen(true)
  }

  function closeModal() {
    setFormOpen(false)
    setEditingId(null)
    setConfirmOpen(false)
    setForm(EMPTY_FORM)
  }

  function handleSubmitProduct(e) {
    e.preventDefault()
    const name = form.name.trim()
    const size = form.size.trim()
    const amount = Number(form.amount)
    const quantity = Number(form.stock)
    if (!name || !size || !form.category || Number.isNaN(amount) || Number.isNaN(quantity)) return
    setConfirmOpen(true)
  }

  async function confirmSave() {
    const payload = {
      name: form.name.trim(),
      size: form.size.trim(),
      amount: Number(form.amount),
      quantity: Number(form.stock),
      category: form.category,
    }

    try {
      if (editingId) {
        await api.updateProduct(editingId, payload)
      } else {
        await api.createProduct(payload)
        setPage(1)
      }
      await loadProducts()
      closeModal()
    } catch (err) {
      setError(err.message || t('product.saveError'))
      setConfirmOpen(false)
    }
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      await api.deleteProduct(deleteId)
      setDeleteId(null)
      await loadProducts()
    } catch (err) {
      setError(err.message || t('product.deleteError'))
      setDeleteId(null)
    }
  }

  return (
    <section className="pos-panel product-page">
      <div className="product-toolbar">
        <div className="pos-search product-search">
          <span className="pos-search-icon">
            <img src="/pos/search.svg" alt="" />
          </span>
          <input
            type="search"
            placeholder={t('search')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>

        <label className="product-filter">
          <img className="product-filter-icon" src="/product/status.svg" alt="" />
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">{t('category')}</option>
            {categories.map((c) => (
              <option key={c.id || c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="product-filter">
          <img className="product-filter-icon" src="/product/status.svg" alt="" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">{t('status')}</option>
            <option value="in">{t('product.inStock')}</option>
            <option value="low">{t('product.lowStock')}</option>
            <option value="out">{t('product.outStock')}</option>
          </select>
        </label>

        <button type="button" className="product-add-btn" onClick={openAddForm}>
          {t('product.add')}
        </button>
      </div>

      {error ? <p className="api-error">{error}</p> : null}
      {loading ? <p className="api-loading">{t('product.loading')}</p> : null}

      <div className="product-table-wrap">
        <table className="product-table">
          <thead>
            <tr>
              <th>{t('product.id')}</th>
              <th>{t('product.name')}</th>
              <th>{t('category')}</th>
              <th>{t('product.sizeLabel')}</th>
              <th>{t('product.amountLabel')}</th>
              <th>{t('product.stock')}</th>
              <th>{t('status')}</th>
              <th>{t('action')}</th>
            </tr>
          </thead>
          <tbody>
            {!loading && pageItems.length === 0 ? (
              <tr>
                <td colSpan={8}>{t('product.noData')}</td>
              </tr>
            ) : null}
            {pageItems.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.category?.name || '-'}</td>
                <td>
                  <span className="size-chip">{product.size}</span>
                </td>
                <td>{formatMoney(product.amount)}</td>
                <td>
                  <span
                    className={`qty-badge qty-${product.status === 'low' ? 'orange' : product.status === 'out' ? 'red' : 'green'}`}
                  >
                    {product.quantity}
                  </span>
                </td>
                <td>
                  <span className={`status-pill status-${product.status}`}>
                    {statusLabel(product.status)}
                  </span>
                </td>
                <td>
                  <div className="product-actions">
                    <button
                      type="button"
                      className="action-btn"
                      aria-label={t('edit')}
                      onClick={() => openEditForm(product)}
                    >
                      <img src="/product/edit.svg" alt="" />
                    </button>
                    <button
                      type="button"
                      className="action-btn"
                      aria-label={t('delete')}
                      onClick={() => setDeleteId(product.id)}
                    >
                      <img src="/product/delete.svg" alt="" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pos-pagination">
        <span className="pos-page-info">
          {t('showingOrders', {
            from: String(showingFrom).padStart(2, '0'),
            to: String(showingTo).padStart(2, '0'),
            total: String(filtered.length).padStart(2, '0'),
          })}
        </span>
        <div className="pos-page-controls">
          <button
            type="button"
            className="page-btn"
            aria-label={t('previousPage')}
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </button>
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              className={`page-btn ${currentPage === n ? 'page-active' : ''}`}
              disabled={n > totalPages}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            className="page-btn"
            aria-label={t('nextPage')}
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            ›
          </button>
        </div>
      </div>

      {formOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={closeModal}>
          <form
            className="add-product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmitProduct}
          >
            <div className="add-product-head">
              <h2 id="product-form-title">{isEditing ? t('product.edit') : t('product.add')}</h2>
              <button
                type="button"
                className="add-product-close"
                aria-label={t('close')}
                onClick={closeModal}
              >
                <CloseIcon />
              </button>
            </div>

            <label className="add-product-field">
              <span>{t('product.nameLabel')}</span>
              <input
                type="text"
                placeholder="eg; Jack Daniels"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </label>

            <label className="add-product-field">
              <span>{t('product.categoryLabel')}</span>
              <select
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
                required
              >
                <option value="" disabled>
                  {t('category')}
                </option>
                {categories.map((c) => (
                  <option key={c.id || c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="add-product-field">
              <span>{t('product.sizeLabel')}</span>
              <input
                type="text"
                placeholder="eg; 70 cl"
                value={form.size}
                onChange={(e) => updateField('size', e.target.value)}
                required
              />
            </label>

            <label className="add-product-field">
              <span>{t('product.amountLabel')}</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="eg; 15.00"
                value={form.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                required
              />
            </label>

            <label className="add-product-field">
              <span>{t('product.stockLabel')}</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="eg; 30"
                value={form.stock}
                onChange={(e) => updateField('stock', e.target.value)}
                required
              />
            </label>

            <button type="submit" className="add-product-submit">
              {isEditing ? t('product.edit') : t('product.add')}
            </button>
          </form>

          {confirmOpen ? (
            <div
              className="confirm-backdrop"
              role="presentation"
              onClick={(e) => {
                e.stopPropagation()
                setConfirmOpen(false)
              }}
            >
              <div
                className="confirm-dialog confirm-dialog--save"
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-save-title"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 id="confirm-save-title">{t('product.confirmSaveTitle')}</h2>
                <p>{t('product.confirmSave')}</p>
                <div className="confirm-actions">
                  <button
                    type="button"
                    className="confirm-no confirm-no--blue"
                    onClick={() => setConfirmOpen(false)}
                  >
                    {t('no')}
                  </button>
                  <button
                    type="button"
                    className="confirm-yes confirm-yes--blue"
                    onClick={confirmSave}
                  >
                    {t('yes')}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {deleteId ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="confirm-dialog confirm-dialog--delete"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-delete-icon" aria-hidden="true">
              <img src="/product/delete.svg" alt="" />
            </div>
            <h2 id="confirm-delete-title">{t('product.confirmDeleteTitle')}</h2>
            <p>{t('product.confirmDelete')}</p>
            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-yes confirm-yes--red"
                onClick={confirmDelete}
              >
                {t('yes')}
              </button>
              <button
                type="button"
                className="confirm-no confirm-no--grey"
                onClick={() => setDeleteId(null)}
              >
                {t('no')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
