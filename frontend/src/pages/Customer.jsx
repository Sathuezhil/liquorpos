import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'

const PAGE_SIZE = 10

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
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

function StatCard({ value, label }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

export default function Customer() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [viewCustomer, setViewCustomer] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [nameError, setNameError] = useState('')

  const isEditing = Boolean(editingId)

  async function loadCustomers() {
    setLoading(true)
    setError('')
    try {
      const res = await api.getCustomers()
      setCustomers(res.data || [])
    } catch (err) {
      setError(err.message || 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return customers.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.contact.includes(q),
    )
  }, [customers, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])

  const showingFrom = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(currentPage * PAGE_SIZE, filtered.length)

  async function deleteCustomer(key) {
    try {
      await api.deleteCustomer(key)
      if (viewCustomer?.key === key) setViewCustomer(null)
      await loadCustomers()
    } catch (err) {
      setError(err.message || 'Failed to delete customer')
    }
  }

  function closeFormModal() {
    setFormOpen(false)
    setEditingId(null)
    setConfirmOpen(false)
    setForm(EMPTY_FORM)
    setNameError('')
  }

  function openAddModal() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setNameError('')
    setConfirmOpen(false)
    setViewCustomer(null)
    setFormOpen(true)
  }

  function openEditModal(customer) {
    setEditingId(customer.key)
    setForm({
      name: customer.name,
      phone: customer.contact,
      email: customer.email || '',
    })
    setNameError('')
    setConfirmOpen(false)
    setViewCustomer(null)
    setFormOpen(true)
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key === 'name' && nameError) setNameError('')
  }

  function handleSubmitCustomer(e) {
    e.preventDefault()
    const name = form.name.trim()
    const phone = form.phone.trim()
    if (!name || !phone) return
    setConfirmOpen(true)
  }

  async function confirmSaveCustomer() {
    const name = form.name.trim()
    const phone = form.phone.trim()
    const email = form.email.trim()
    if (!name || !phone) return

    try {
      if (editingId) {
        await api.updateCustomer(editingId, { name, contact: phone, email })
      } else {
        await api.createCustomer({ name, contact: phone, email })
        setPage(1)
      }
      await loadCustomers()
      closeFormModal()
    } catch (err) {
      setConfirmOpen(false)
      setNameError(err.message || 'Failed to save customer')
    }
  }

  return (
    <section className="pos-panel customer-page">
      <div className="product-toolbar customer-toolbar">
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

        <button type="button" className="product-add-btn" onClick={openAddModal}>
          + Add Customer
        </button>
      </div>

      {error ? <p className="api-error">{error}</p> : null}
      {loading ? <p className="api-loading">Loading customers...</p> : null}

      <div className="product-table-wrap">
        <table className="product-table customer-table">
          <thead>
            <tr>
              <th>Customer ID</th>
              <th>Customer Name</th>
              <th>Contact number</th>
              <th>Total Orders</th>
              <th>Amount Spend</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {!loading && pageItems.length === 0 ? (
              <tr>
                <td colSpan={6}>No customers found</td>
              </tr>
            ) : null}
            {pageItems.map((customer) => (
              <tr key={customer.key}>
                <td>{customer.id}</td>
                <td>
                  <div className="sales-customer">
                    <span className="sales-avatar">{customer.initials}</span>
                    <span className="customer-name">{customer.name}</span>
                  </div>
                </td>
                <td>{customer.contact}</td>
                <td>{customer.totalOrders}</td>
                <td>{formatMoney(customer.amountSpend)}</td>
                <td>
                  <div className="product-actions">
                    <button
                      type="button"
                      className="action-btn"
                      aria-label="View"
                      onClick={() => setViewCustomer(customer)}
                    >
                      <img src="/sales/view.svg" alt="" />
                    </button>
                    <button
                      type="button"
                      className="action-btn"
                      aria-label="Edit"
                      onClick={() => openEditModal(customer)}
                    >
                      <img src="/product/edit.svg" alt="" />
                    </button>
                    <button
                      type="button"
                      className="action-btn"
                      aria-label="Delete"
                      onClick={() => deleteCustomer(customer.key)}
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
        <div className="modal-backdrop" role="presentation" onClick={closeFormModal}>
          <form
            className="add-product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-form-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmitCustomer}
          >
            <div className="add-product-head">
              <h2 id="customer-form-title">{isEditing ? 'Edit Customer' : 'Add Customer'}</h2>
              <button
                type="button"
                className="add-product-close"
                aria-label="Close"
                onClick={closeFormModal}
              >
                <CloseIcon />
              </button>
            </div>

            <label className="add-product-field">
              <span>Customer name</span>
              <input
                type="text"
                placeholder="eg; James"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
              {nameError ? <span className="field-error">{nameError}</span> : null}
            </label>

            <label className="add-product-field">
              <span>Phone number</span>
              <input
                type="tel"
                placeholder="eg; 0777669122456"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                required
              />
            </label>

            <label className="add-product-field">
              <span>Email address</span>
              <input
                type="email"
                placeholder="eg; example@gmail.com"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
              />
            </label>

            <button type="submit" className="add-product-submit">
              {isEditing ? 'Update Customer' : 'Add Customer'}
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
                aria-labelledby="confirm-customer-save-title"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 id="confirm-customer-save-title">Confirm Save Action</h2>
                <p>Please confirm if you want to save the Customer.</p>
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
                    onClick={confirmSaveCustomer}
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {viewCustomer ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setViewCustomer(null)}
        >
          <div
            className="order-modal customer-view-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="customer-view-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="order-modal-head">
              <h2 id="customer-view-title">{viewCustomer.viewId}</h2>
              <div className="order-modal-actions">
                <button
                  type="button"
                  className="action-btn"
                  aria-label="Edit customer"
                  onClick={() => openEditModal(viewCustomer)}
                >
                  <img src="/product/edit.svg" alt="" />
                </button>
                <button
                  type="button"
                  className="action-btn"
                  aria-label="Delete customer"
                  onClick={() => deleteCustomer(viewCustomer.key)}
                >
                  <img src="/product/delete.svg" alt="" />
                </button>
                <button
                  type="button"
                  className="add-product-close"
                  aria-label="Close"
                  onClick={() => setViewCustomer(null)}
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            <div className="customer-view-stats">
              <StatCard value={String(viewCustomer.viewOrders)} label="Total Orders" />
              <StatCard value={formatMoney(viewCustomer.viewSpend)} label="Total Spend" />
            </div>

            <h3 className="order-section-title">Customer Information</h3>
            <div className="order-info-box">
              <div className="order-info-item">
                <span className="order-info-label">Customer name</span>
                <div className="order-info-value">
                  <img src="/sales/user.svg" alt="" />
                  <span>{viewCustomer.fullName}</span>
                </div>
              </div>
              <div className="order-info-item">
                <span className="order-info-label">Phone number</span>
                <div className="order-info-value">
                  <img src="/sales/user.svg" alt="" />
                  <span>{viewCustomer.contact}</span>
                </div>
              </div>
              <div className="order-info-item">
                <span className="order-info-label">Email address</span>
                <div className="order-info-value">
                  <img src="/sales/email.svg" alt="" />
                  <span>{viewCustomer.email || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
