import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api'
import { useI18n } from '../i18n/I18nContext'
import { STAT_LABEL_KEYS } from '../i18n/translations'

const PAGE_SIZE = 10

function formatMoney(value) {
  return `€ ${Number(value).toFixed(2)}`
}

function formatDisplayDate(isoDate) {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) return isoDate
  return `${month}/${day}/${year}`
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
  const { t } = useI18n()
  return (
    <div className="pos-pagination">
      <span className="pos-page-info">
        {t('showingOrders', {
          from: String(showingFrom).padStart(2, '0'),
          to: String(showingTo).padStart(2, '0'),
          total: String(total).padStart(2, '0'),
        })}
      </span>
      <div className="pos-page-controls">
        <button
          type="button"
          className="page-btn"
          aria-label={t('previousPage')}
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
          aria-label={t('nextPage')}
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
  const { t } = useI18n()
  const [period, setPeriod] = useState('now')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewTab, setViewTab] = useState('history')
  const [page, setPage] = useState(1)
  const [sales, setSales] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewOrder, setViewOrder] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [statusSaving, setStatusSaving] = useState(false)
  const dateInputRef = useRef(null)

  function translateLabel(label) {
    const key = STAT_LABEL_KEYS[label]
    return key ? t(key) : label
  }

  function openCalendar() {
    const input = dateInputRef.current
    if (!input) return
    if (typeof input.showPicker === 'function') {
      input.showPicker()
    } else {
      input.focus()
      input.click()
    }
  }

  async function loadSalesData() {
    setLoading(true)
    setError('')
    try {
      const [salesRes, statsRes, topRes] = await Promise.all([
        api.getSales({ period, date, status: statusFilter, search }),
        api.getSaleStats(),
        api.getTopProducts(),
      ])
      setSales(salesRes.data || [])
      setStats(statsRes.data || [])
      setTopProducts(topRes.data || [])
    } catch (err) {
      setError(err.message || t('sales.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSalesData()
  }, [period, date, statusFilter])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sales.filter((row) => {
      const matchSearch =
        !q ||
        row.customer.toLowerCase().includes(q) ||
        row.id.toLowerCase().includes(q) ||
        row.contact.includes(q)
      return matchSearch
    })
  }, [sales, search])

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

  async function confirmDeleteSale() {
    if (!deleteId) return
    try {
      await api.deleteSale(deleteId)
      setDeleteId(null)
      if (viewOrder?.key === deleteId) setViewOrder(null)
      await loadSalesData()
    } catch (err) {
      setError(err.message || t('sales.deleteError'))
      setDeleteId(null)
    }
  }

  async function toggleOrderPayment() {
    if (!viewOrder || statusSaving) return
    const nextStatus = viewOrder.status === 'paid' ? 'unpaid' : 'paid'
    setStatusSaving(true)
    setError('')
    try {
      const res = await api.updateSaleStatus(viewOrder.key, nextStatus)
      const updated = res.data
      setViewOrder(updated)
      setSales((prev) => prev.map((row) => (row.key === updated.key ? { ...row, ...updated } : row)))
      await loadSalesData()
    } catch (err) {
      setError(err.message || t('sales.statusError'))
    } finally {
      setStatusSaving(false)
    }
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
            { id: 'now', labelKey: 'sales.now' },
            { id: 'weekly', labelKey: 'sales.weekly' },
            { id: 'monthly', labelKey: 'sales.monthly' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`sales-pill ${period === opt.id ? 'sales-pill-active' : ''}`}
              onClick={() => {
                setPeriod(opt.id)
                setPage(1)
              }}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>

        <button type="button" className="sales-date" onClick={openCalendar}>
          <img src="/sales/calendar.svg" alt="" />
          <span className="sales-date-text">{formatDisplayDate(date)}</span>
          <input
            ref={dateInputRef}
            type="date"
            className="sales-date-native"
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              setPage(1)
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </button>

        <div className="pos-search sales-search">
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

        <label className="product-filter sales-status">
          <img className="product-filter-icon" src="/product/status.svg" alt="" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="all">{t('status')}</option>
            <option value="paid">{t('sales.paid')}</option>
            <option value="unpaid">{t('sales.notPaidShort')}</option>
          </select>
        </label>

        <button type="button" className="sales-download-btn" onClick={downloadCsv}>
          {t('sales.downloadCsv')}
        </button>
      </div>

      <div className="sales-subtabs">
        <button
          type="button"
          className={`sales-pill ${viewTab === 'history' ? 'sales-pill-active' : ''}`}
          onClick={() => switchTab('history')}
        >
          {t('sales.history')}
        </button>
        <button
          type="button"
          className={`sales-pill ${viewTab === 'top' ? 'sales-pill-active' : ''}`}
          onClick={() => switchTab('top')}
        >
          {t('sales.top')}
        </button>
      </div>

      {error ? <p className="api-error">{error}</p> : null}
      {loading ? <p className="api-loading">{t('sales.loading')}</p> : null}

      {viewTab === 'history' ? (
        <div className="stat-grid sales-stats">
          {stats.map((s) => (
            <StatCard key={s.label} value={s.value} label={translateLabel(s.label)} />
          ))}
        </div>
      ) : null}

      {viewTab === 'history' ? (
        <>
          <div className="product-table-wrap sales-table-wrap">
            <table className="product-table sales-table">
              <thead>
                <tr>
                  <th>{t('sales.productId')}</th>
                  <th>{t('sales.customerName')}</th>
                  <th>{t('sales.contact')}</th>
                  <th>{t('sales.item')}</th>
                  <th>{t('sales.amountSpend')}</th>
                  <th>{t('status')}</th>
                  <th>{t('action')}</th>
                </tr>
              </thead>
              <tbody>
                {!loading && pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={7}>{t('sales.noData')}</td>
                  </tr>
                ) : null}
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
                        {row.status === 'paid' ? t('sales.paid') : t('sales.notPaidShort')}
                      </span>
                    </td>
                    <td>
                      <div className="product-actions">
                        <button
                          type="button"
                          className="action-btn"
                          aria-label={t('download')}
                          onClick={() => downloadOrder(row)}
                        >
                          <img src="/sales/download.svg" alt="" />
                        </button>
                        <button
                          type="button"
                          className="action-btn"
                          aria-label={t('view')}
                          onClick={() => setViewOrder(row)}
                        >
                          <img src="/sales/view.svg" alt="" />
                        </button>
                        <button
                          type="button"
                          className="action-btn"
                          aria-label={t('delete')}
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
                  <th>{t('sales.orderId')}</th>
                  <th>{t('product.name')}</th>
                  <th>{t('pos.size')}</th>
                  <th>{t('pos.quantity')}</th>
                  <th>{t('sales.totalRevenue')}</th>
                </tr>
              </thead>
              <tbody>
                {!loading && pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={5}>{t('sales.noTop')}</td>
                  </tr>
                ) : null}
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
        <div className="modal-backdrop" role="presentation" onClick={() => setViewOrder(null)}>
          <div
            className="order-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="order-modal-head">
              <div className="order-modal-title-row">
                <h2 id="order-modal-title">{viewOrder.orderTitle}</h2>
                <span
                  className={`status-pill ${viewOrder.status === 'paid' ? 'status-paid' : 'status-unpaid'}`}
                >
                  {viewOrder.status === 'paid' ? t('sales.paid') : t('sales.notPaid')}
                </span>
                <button
                  type="button"
                  className={`pay-toggle ${viewOrder.status === 'paid' ? 'pay-toggle-on' : 'pay-toggle-off'}`}
                  aria-label={
                    viewOrder.status === 'paid' ? t('sales.markUnpaid') : t('sales.markPaid')
                  }
                  aria-pressed={viewOrder.status === 'paid'}
                  disabled={statusSaving}
                  onClick={toggleOrderPayment}
                >
                  <span className="pay-toggle-knob" />
                </button>
              </div>
              <div className="order-modal-actions">
                <button
                  type="button"
                  className="action-btn"
                  aria-label={t('download')}
                  onClick={() => downloadOrder(viewOrder)}
                >
                  <img src="/sales/download.svg" alt="" />
                </button>
                <button
                  type="button"
                  className="action-btn"
                  aria-label={t('delete')}
                  onClick={() => setDeleteId(viewOrder.key)}
                >
                  <img src="/product/delete.svg" alt="" />
                </button>
                <button
                  type="button"
                  className="add-product-close"
                  aria-label={t('close')}
                  onClick={() => setViewOrder(null)}
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            <h3 className="order-section-title">{t('sales.orderInfo')}</h3>
            <div className="order-info-box">
              <div className="order-info-item">
                <span className="order-info-label">{t('sales.orderDate')}</span>
                <div className="order-info-value">
                  <img src="/sales/calendar.svg" alt="" />
                  <span>{viewOrder.orderDate}</span>
                </div>
              </div>
              <div className="order-info-item">
                <span className="order-info-label">{t('sales.customerName')}</span>
                <div className="order-info-value">
                  <img src="/sales/user.svg" alt="" />
                  <span>{viewOrder.fullName}</span>
                </div>
              </div>
              <div className="order-info-item">
                <span className="order-info-label">{t('sales.email')}</span>
                <div className="order-info-value">
                  <img src="/sales/email.svg" alt="" />
                  <span>{viewOrder.email}</span>
                </div>
              </div>
            </div>

            <h3 className="order-section-title">{t('sales.orderItems')}</h3>
            <div className="product-table-wrap order-items-wrap">
              <table className="product-table order-items-table">
                <thead>
                  <tr>
                    <th>{t('pos.product')}</th>
                    <th>{t('pos.size')}</th>
                    <th>{t('pos.amount')}</th>
                    <th>{t('pos.quantity')}</th>
                    <th>{t('pos.total')}</th>
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
              <span>{t('sales.subtotal')}</span>
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
            <h2 id="confirm-sales-delete-title">{t('sales.confirmDeleteTitle')}</h2>
            <p>{t('sales.confirmDelete')}</p>
            <div className="confirm-actions">
              <button
                type="button"
                className="confirm-yes confirm-yes--red"
                onClick={confirmDeleteSale}
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
