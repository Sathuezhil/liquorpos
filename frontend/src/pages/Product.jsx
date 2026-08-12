import { useMemo, useState } from 'react'

const PAGE_SIZE = 8

const INITIAL_PRODUCTS = Array.from({ length: 16 }, (_, i) => {
  const stock = i % 8 === 0 ? 'low' : i % 8 === 1 ? 'out' : 'in'
  return {
    id: String(i + 1).padStart(3, '0'),
    name: 'Product 1',
    size: '20 cl',
    amount: 123,
    quantity: 20,
    status: stock,
  }
})

const EMPTY_FORM = {
  name: '',
  size: '',
  amount: '',
  stock: '',
}

function formatMoney(value) {
  return `€ ${Number(value).toFixed(2)}`
}

function statusLabel(status) {
  if (status === 'low') return 'Low Stock'
  if (status === 'out') return 'Out of Stock'
  return 'In Stock'
}

function stockStatus(qty) {
  if (qty <= 0) return 'out'
  if (qty < 10) return 'low'
  return 'in'
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="#0076D2" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function Product() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const isEditing = Boolean(editingId)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      const matchSearch =
        !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || p.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [products, search, statusFilter])

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
    setForm(EMPTY_FORM)
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
    if (!name || !size || Number.isNaN(amount) || Number.isNaN(quantity)) return
    setConfirmOpen(true)
  }

  function confirmSave() {
    const name = form.name.trim()
    const size = form.size.trim()
    const amount = Number(form.amount)
    const quantity = Number(form.stock)

    if (editingId) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? {
                ...p,
                name,
                size,
                amount,
                quantity,
                status: stockStatus(quantity),
              }
            : p,
        ),
      )
    } else {
      const nextId = String(products.length + 1).padStart(3, '0')
      setProducts((prev) => [
        {
          id: nextId,
          name,
          size,
          amount,
          quantity,
          status: stockStatus(quantity),
        },
        ...prev,
      ])
      setPage(1)
    }
    closeModal()
  }

  function confirmDelete() {
    if (!deleteId) return
    setProducts((prev) => prev.filter((p) => p.id !== deleteId))
    setDeleteId(null)
    setPage((p) => Math.min(p, Math.max(1, Math.ceil((filtered.length - 1) / PAGE_SIZE))))
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
            placeholder="Search"
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">Status</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </label>

        <button type="button" className="product-add-btn" onClick={openAddForm}>
          Add Products
        </button>
      </div>

      <div className="product-table-wrap">
        <table className="product-table">
          <thead>
            <tr>
              <th>Product ID</th>
              <th>Product</th>
              <th>Size</th>
              <th>Amount</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
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
                      aria-label="Edit"
                      onClick={() => openEditForm(product)}
                    >
                      <img src="/product/edit.svg" alt="" />
                    </button>
                    <button
                      type="button"
                      className="action-btn"
                      aria-label="Delete"
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
          Showing {String(showingFrom).padStart(2, '0')}-{String(showingTo).padStart(2, '0')} of{' '}
          {String(filtered.length).padStart(2, '0')} Orders
        </span>
        <div className="pos-page-controls">
          <button
            type="button"
            className="page-btn"
            aria-label="Previous page"
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
            aria-label="Next page"
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
              <h2 id="product-form-title">{isEditing ? 'Edit Product' : 'Add Product'}</h2>
              <button
                type="button"
                className="add-product-close"
                aria-label="Close"
                onClick={closeModal}
              >
                <CloseIcon />
              </button>
            </div>

            <label className="add-product-field">
              <span>Product name</span>
              <input
                type="text"
                placeholder="eg; Pepsi"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </label>

            <label className="add-product-field">
              <span>Size</span>
              <input
                type="text"
                placeholder="eg; 30 cl"
                value={form.size}
                onChange={(e) => updateField('size', e.target.value)}
                required
              />
            </label>

            <label className="add-product-field">
              <span>Amount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="eg; 123"
                value={form.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                required
              />
            </label>

            <label className="add-product-field">
              <span>Stock</span>
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
              {isEditing ? 'Update Product' : 'Add Product'}
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
                <h2 id="confirm-save-title">Confirm Save Action</h2>
                <p>Please confirm if you want to save the Product.</p>
                <div className="confirm-actions">
                  <button
                    type="button"
                    className="confirm-no confirm-no--blue"
                    onClick={() => setConfirmOpen(false)}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    className="confirm-yes confirm-yes--blue"
                    onClick={confirmSave}
                  >
                    Yes
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
            <h2 id="confirm-delete-title">Confirm Deletion</h2>
            <p>
              Deleting this Product will permanently remove the product from the table.
              Do you want to continue?
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-yes confirm-yes--red"
                onClick={confirmDelete}
              >
                Yes
              </button>
              <button
                type="button"
                className="confirm-no confirm-no--grey"
                onClick={() => setDeleteId(null)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
