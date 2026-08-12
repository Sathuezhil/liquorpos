import { useMemo, useState } from 'react'

const PAGE_SIZE = 10

const STATS = [
  { value: '45', label: 'Total Product Sold' },
  { value: '€ 123.00', label: "Today's Revenue" },
  { value: '€ 123.00', label: 'Weekly Revenue' },
  { value: '€ 123.00', label: 'Monthly Revenue' },
  { value: '€ 123.00', label: 'Total Revenue' },
]

const ORDER_ITEMS = [
  { product: 'Product 1', size: '20 cl', amount: 123, quantity: 1, total: 123 },
  { product: 'Product 1', size: '20 cl', amount: 123, quantity: 1, total: 123 },
  { product: 'Product 1', size: '20 cl', amount: 123, quantity: 1, total: 123 },
]

const INITIAL_SALES = Array.from({ length: 10 }, (_, i) => ({
  key: `sale-${i + 1}`,
  id: 'Or 123',
  orderTitle: 'Order 123',
  customer: 'Kishana',
  fullName: 'John Doe',
  email: 'example@gmail.com',
  orderDate: '06/06/2026',
  initials: 'YK',
  contact: '0775512445',
  items: i === 1 ? 4 : i === 2 ? 6 : 5,
  amount: 123,
  status: i === 0 ? 'unpaid' : 'paid',
  orderItems: ORDER_ITEMS,
}))

const INITIAL_TOP_PRODUCTS = Array.from({ length: 10 }, (_, i) => ({
  key: `top-${i + 1}`,
  orderId: 'Or 123',
  product: 'Product 1',
  size: '20 cl',
  quantity: 5,
  revenue: 123,
}))

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

function SalesPagination({ showingFrom, showingTo, total, currentPage, totalPages, onPage }) {
  return (
    <div className="pos-pagination">
      <span className="pos-page-info">
        Showing {String(showingFrom).padStart(2, '0')}-{String(showingTo).padStart(2, '0')} of{' '}
        {String(total).padStart(2, '0')} Orders
      </span>
      <div className="pos-page-controls">
        <button
          type="button"
          className="page-btn"
          aria-label="Previous page"
          disabled={currentPage <= 1}
          onClick={() => onPage(Math.max(1, currentPage - 1))}
        >
          ‹
        </button>
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            type="button"
            className={`page-btn ${currentPage === n ? 'page-active' : ''}`}
            disabled={n > totalPages}
            onClick={() => onPage(n)}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          className="page-btn"
          aria-label="Next page"
          disabled={currentPage >= totalPages}
          onClick={() => onPage(Math.min(totalPages, currentPage + 1))}
        >
          ›
        </button>
      </div>
    </div>
  )
}

export default function Sales() {
  const [period, setPeriod] = useState('now')
  const [date, setDate] = useState('2025-04-12')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewTab, setViewTab] = useState('history')
  const [page, setPage] = useState(1)
  const [sales, setSales] = useState(INITIAL_SALES)
  const [topProducts] = useState(INITIAL_TOP_PRODUCTS)
  const [viewOrder, setViewOrder] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sales.filter((row) => {
      const matchSearch =
        !q ||
        row.customer.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q) ||
        row.contact.includes(q)
      const matchStatus = statusFilter === 'all' || row.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [sales, search, statusFilter])

  const filteredTop = useMemo(() => {
    const q = search.trim().toLowerCase()
    return topProducts.filter(
      (row) =>
        !q ||
        row.product.toLowerCase().includes(q) ||
        row.orderId.toLowerCase().includes(q) ||
        row.size.toLowerCase().includes(q),
    )
  }, [topProducts, search])

  const activeRows = viewTab === 'history' ? filtered : filteredTop
  const totalPages = Math.max(1, Math.ceil(activeRows.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return activeRows.slice(start, start + PAGE_SIZE)
  }, [activeRows, currentPage])

  const showingFrom = activeRows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(currentPage * PAGE_SIZE, activeRows.length)

  function switchTab(tab) {
    setViewTab(tab)
    setPage(1)
  }

  function confirmDeleteSale() {
    if (!deleteId) return
    setSales((prev) => prev.filter((s) => s.key !== deleteId))
    if (viewOrder?.key === deleteId) setViewOrder(null)
    setDeleteId(null)
  }

  function downloadOrder(order) {
    if (!order) return
    const header = ['Product', 'Size', 'Amount', 'Quantity', 'Total']
    const rows = order.orderItems.map((item) => [
      item.product,
      item.size,
      formatMoney(item.amount),
      item.quantity,
      formatMoney(item.total),
    ])
    const csv = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${order.orderTitle.replace(/\s+/g, '-').toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadCsv() {
    if (viewTab === 'top') {
      const header = ['Order ID', 'Product', 'Size', 'Quantity', 'Total Revenue']
      const rows = filteredTop.map((row) => [
        row.orderId,
        row.product,
        row.size,
        row.quantity,
        formatMoney(row.revenue),
      ])
      const csv = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'top-products.csv'
      a.click()
      URL.revokeObjectURL(url)
      return
    }

    const header = ['Product ID', 'Customer Name', 'Contact number', 'Item', 'Amount Spend', 'Status']
    const rows = filtered.map((row) => [
      row.id,
      row.customer,
      row.contact,
      row.items,
      formatMoney(row.amount),
      row.status === 'paid' ? 'Paid' : 'Not paid',
    ])
    const csv = [header, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sales-history.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="pos-panel sales-page">
      <div className="sales-toolbar">
        <div className="sales-period">
          {[
            { id: 'now', label: 'Now' },
            { id: 'weekly', label: 'Weekly' },
            { id: 'monthly', label: 'Monthly' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`sales-pill ${period === opt.id ? 'sales-pill-active' : ''}`}
              onClick={() => setPeriod(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <label className="sales-date">
          <img src="/sales/calendar.svg" alt="" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>

        <div className="pos-search sales-search">
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

        <label className="product-filter sales-status">
          <img className="product-filter-icon" src="/product/status.svg" alt="" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Not paid</option>
          </select>
        </label>

        <button type="button" className="sales-download-btn" onClick={downloadCsv}>
          Download CSV
        </button>
      </div>

      <div className="sales-subtabs">
        <button
          type="button"
          className={`sales-pill ${viewTab === 'history' ? 'sales-pill-active' : ''}`}
          onClick={() => switchTab('history')}
        >
          Sales History
        </button>
        <button
          type="button"
          className={`sales-pill ${viewTab === 'top' ? 'sales-pill-active' : ''}`}
          onClick={() => switchTab('top')}
        >
          Top Product
        </button>
      </div>

      {viewTab === 'history' ? (
        <div className="stat-grid sales-stats">
          {STATS.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      ) : null}

      {viewTab === 'history' ? (
        <>
          <div className="product-table-wrap sales-table-wrap">
            <table className="product-table sales-table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Customer Name</th>
                  <th>Contact number</th>
                  <th>Item</th>
                  <th>Amount Spend</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((row) => (
                  <tr key={row.key}>
                    <td>{row.id}</td>
                    <td>
                      <div className="sales-customer">
                        <span className="sales-avatar">{row.initials}</span>
                        <button type="button" className="sales-customer-name">
                          {row.customer}
                        </button>
                      </div>
                    </td>
                    <td>{row.contact}</td>
                    <td>{row.items}</td>
                    <td>{formatMoney(row.amount)}</td>
                    <td>
                      <span
                        className={`status-pill ${row.status === 'paid' ? 'status-paid' : 'status-unpaid'}`}
                      >
                        {row.status === 'paid' ? 'Paid' : 'Not paid'}
                      </span>
                    </td>
                    <td>
                      <div className="product-actions">
                        <button
                          type="button"
                          className="action-btn"
                          aria-label="Download"
                          onClick={() => downloadOrder(row)}
                        >
                          <img src="/sales/download.svg" alt="" />
                        </button>
                        <button
                          type="button"
                          className="action-btn"
                          aria-label="View"
                          onClick={() => setViewOrder(row)}
                        >
                          <img src="/sales/view.svg" alt="" />
                        </button>
                        <button
                          type="button"
                          className="action-btn"
                          aria-label="Delete"
                          onClick={() => setDeleteId(row.key)}
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

          <SalesPagination
            showingFrom={showingFrom}
            showingTo={showingTo}
            total={filtered.length}
            currentPage={currentPage}
            totalPages={totalPages}
            onPage={setPage}
          />
        </>
      ) : (
        <>
          <div className="product-table-wrap sales-table-wrap">
            <table className="product-table sales-table sales-top-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Quantity</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((row) => (
                  <tr key={row.key}>
                    <td>{row.orderId}</td>
                    <td>{row.product}</td>
                    <td>
                      <span className="size-chip">{row.size}</span>
                    </td>
                    <td>{row.quantity}</td>
                    <td>{formatMoney(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <SalesPagination
            showingFrom={showingFrom}
            showingTo={showingTo}
            total={filteredTop.length}
            currentPage={currentPage}
            totalPages={totalPages}
            onPage={setPage}
          />
        </>
      )}

      {viewOrder ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setViewOrder(null)}
        >
          <div
            className="order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="order-modal-head">
              <h2 id="order-modal-title">{viewOrder.orderTitle}</h2>
              <div className="order-modal-actions">
                <button
                  type="button"
                  className="action-btn"
                  aria-label="Download order"
                  onClick={() => downloadOrder(viewOrder)}
                >
                  <img src="/sales/download.svg" alt="" />
                </button>
                <button
                  type="button"
                  className="action-btn"
                  aria-label="Delete order"
                  onClick={() => setDeleteId(viewOrder.key)}
                >
                  <img src="/product/delete.svg" alt="" />
                </button>
                <button
                  type="button"
                  className="add-product-close"
                  aria-label="Close"
                  onClick={() => setViewOrder(null)}
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            <h3 className="order-section-title">Order Information</h3>
            <div className="order-info-box">
              <div className="order-info-item">
                <span className="order-info-label">Order date</span>
                <div className="order-info-value">
                  <img src="/sales/calendar.svg" alt="" />
                  <span>{viewOrder.orderDate}</span>
                </div>
              </div>
              <div className="order-info-item">
                <span className="order-info-label">Customer name</span>
                <div className="order-info-value">
                  <img src="/sales/user.svg" alt="" />
                  <span>{viewOrder.fullName}</span>
                </div>
              </div>
              <div className="order-info-item">
                <span className="order-info-label">Email address</span>
                <div className="order-info-value">
                  <img src="/sales/email.svg" alt="" />
                  <span>{viewOrder.email}</span>
                </div>
              </div>
            </div>

            <h3 className="order-section-title">Order Items</h3>
            <div className="product-table-wrap order-items-wrap">
              <table className="product-table order-items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Size</th>
                    <th>Amount</th>
                    <th>Quantity</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {viewOrder.orderItems.map((item, idx) => (
                    <tr key={`${item.product}-${idx}`}>
                      <td>{item.product}</td>
                      <td>
                        <span className="size-chip">{item.size}</span>
                      </td>
                      <td>{formatMoney(item.amount)}</td>
                      <td>{item.quantity}</td>
                      <td>{formatMoney(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="order-subtotal">
              <span>Subtotal:</span>
              <strong>{formatMoney(viewOrder.amount)}</strong>
            </div>
          </div>
        </div>
      ) : null}

      {deleteId ? (
        <div
          className="modal-backdrop confirm-backdrop"
          role="presentation"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="confirm-dialog confirm-dialog--delete"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-sales-delete-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-delete-icon" aria-hidden="true">
              <img src="/product/delete.svg" alt="" />
            </div>
            <h2 id="confirm-sales-delete-title">Confirm Deletion</h2>
            <p>
              Deleting this Sales report will permanently remove the Sales from the table.
              Do you want to continue?
            </p>
            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-yes confirm-yes--red"
                onClick={confirmDeleteSale}
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
