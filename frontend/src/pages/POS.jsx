import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { useI18n } from '../i18n/I18nContext'

const PAGE_SIZE = 8

function qtyToneFromStatus(status) {
  if (status === 'low') return 'orange'
  if (status === 'out') return 'red'
  return 'green'
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="#0076D2" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function MinusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14" stroke="#0076D2" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

function formatMoney(value) {
  return `€${Number(value).toFixed(2)}`
}

export default function POS() {
  const { t } = useI18n()
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [customerQuery, setCustomerQuery] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerList, setShowCustomerList] = useState(false)
  const [cart, setCart] = useState([])
  const [page, setPage] = useState(1)
  const [checkoutMsg, setCheckoutMsg] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .getProducts()
      .then((res) => {
        setProducts(
          (res.data || []).map((p) => ({
            ...p,
            qtyTone: qtyToneFromStatus(p.status),
          })),
        )
      })
      .catch(() => setProducts([]))

    api
      .getCustomers()
      .then((res) => setCustomers(res.data || []))
      .catch(() => setCustomers([]))
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.size.toLowerCase().includes(q) ||
        String(p.id).toLowerCase().includes(q),
    )
  }, [search, products])

  const customerMatches = useMemo(() => {
    const q = customerQuery.trim().toLowerCase()
    if (!q) return []
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.contact.includes(q) ||
          (c.email || '').toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [customerQuery, customers])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])

  const showingFrom = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(currentPage * PAGE_SIZE, filtered.length)

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.qty, 0),
    [cart],
  )

  function selectCustomer(customer) {
    setSelectedCustomer(customer)
    setCustomerQuery('')
    setShowCustomerList(false)
    setCheckoutError('')
    setCheckoutMsg('')
  }

  function clearSelectedCustomer() {
    setSelectedCustomer(null)
    setCustomerQuery('')
  }

  function addProduct(product) {
    setCart((prev) => {
      const existing = prev.find(
        (item) =>
          item.productId === product.id &&
          item.name === product.name &&
          item.size === product.size &&
          item.unitPrice === product.amount,
      )
      if (existing) {
        return prev.map((item) =>
          item.id === existing.id ? { ...item, qty: item.qty + 1 } : item,
        )
      }
      return [
        ...prev,
        {
          id: `${product.id}-${Date.now()}`,
          productId: product.id,
          name: product.name,
          size: product.size,
          unitPrice: product.amount,
          qty: 1,
        },
      ]
    })
  }

  function changeQty(id, delta) {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0),
    )
  }

  function removeItem(id) {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  async function checkout(status) {
    setCheckoutError('')
    setCheckoutMsg('')

    if (!selectedCustomer) {
      setCheckoutError(t('pos.selectCustomer'))
      return
    }
    if (cart.length === 0) {
      setCheckoutError(t('pos.cartEmptyError'))
      return
    }

    setSaving(true)
    try {
      await api.createSale({
        customerId: selectedCustomer.key,
        customerName: selectedCustomer.name,
        fullName: selectedCustomer.name,
        contact: selectedCustomer.contact,
        email: selectedCustomer.email || '',
        status,
        items: cart.map((item) => ({
          product: item.name,
          size: item.size,
          amount: item.unitPrice,
          quantity: item.qty,
          total: item.unitPrice * item.qty,
        })),
      })
      setCart([])
      setSelectedCustomer(null)
      setCustomerQuery('')
      setCheckoutMsg(
        status === 'paid'
          ? t('pos.orderSavedPaid', { name: selectedCustomer.name })
          : t('pos.orderSavedUnpaid', { name: selectedCustomer.name }),
      )
    } catch (err) {
      setCheckoutError(err.message || t('pos.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="pos-layout">
      <div className="pos-left">
        <section className="pos-panel pos-products">
          <div className="pos-search">
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

          <div className="pos-table-wrap">
            <table className="pos-table">
              <thead>
                <tr>
                  <th>{t('pos.product')}</th>
                  <th>{t('pos.size')}</th>
                  <th>{t('pos.amount')}</th>
                  <th>{t('pos.quantity')}</th>
                  <th>{t('action')}</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>
                      <span className="size-chip">{product.size}</span>
                    </td>
                    <td>{formatMoney(product.amount)}</td>
                    <td>
                      <span className={`qty-badge qty-${product.qtyTone}`}>{product.quantity}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="pos-add-btn"
                        aria-label={`Add ${product.name}`}
                        onClick={() => addProduct(product)}
                      >
                        <PlusIcon />
                      </button>
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
        </section>
      </div>

      <aside className="pos-panel pos-order">
        <div className="pos-order-top-card">
          <h2 className="pos-order-title">{t('pos.currentOrder')}</h2>
          <div className="pos-customer-search-wrap">
            <div className="pos-search">
              <span className="pos-search-icon">
                <img src="/pos/search.svg" alt="" />
              </span>
              <input
                type="search"
                placeholder={t('pos.searchCustomer')}
                value={customerQuery}
                onChange={(e) => {
                  setCustomerQuery(e.target.value)
                  setShowCustomerList(true)
                }}
                onFocus={() => setShowCustomerList(true)}
              />
            </div>

            {showCustomerList && customerQuery.trim() ? (
              <div className="pos-customer-dropdown">
                {customerMatches.length === 0 ? (
                  <div className="pos-customer-empty">{t('customer.noData')}</div>
                ) : (
                  customerMatches.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      className="pos-customer-option"
                      onClick={() => selectCustomer(c)}
                    >
                      <span className="pos-customer-option-name">{c.name}</span>
                      <span className="pos-customer-option-meta">{c.contact}</span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>

          {selectedCustomer ? (
            <div className="pos-selected-customer">
              <span>
                {t('pos.customerLabel', { name: selectedCustomer.name.toUpperCase() })}
              </span>
              <button
                type="button"
                className="pos-customer-clear"
                aria-label={t('close')}
                onClick={clearSelectedCustomer}
              >
                ×
              </button>
            </div>
          ) : null}
        </div>

        <div className="order-list-head">
          <span>{t('pos.orderList')}</span>
          <button type="button" className="clear-cart" onClick={() => setCart([])}>
            {t('pos.clearCart')}
          </button>
        </div>

        <div className="order-items">
          {cart.length === 0 ? (
            <p className="order-empty">{t('pos.cartEmpty')}</p>
          ) : (
            cart.map((item) => (
              <div className="order-item" key={item.id}>
                <div className="order-item-top">
                  <div>
                    <div className="order-item-name">{item.name}</div>
                    <div className="order-item-price">
                      {item.size} · {formatMoney(item.unitPrice)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="trash-btn"
                    aria-label={t('delete')}
                    onClick={() => removeItem(item.id)}
                  >
                    <img src="/pos/delete.svg" alt="" />
                  </button>
                </div>
                <div className="order-item-bottom">
                  <div className="order-item-controls">
                    <button
                      type="button"
                      className="qty-ctrl"
                      aria-label="Decrease"
                      onClick={() => changeQty(item.id, -1)}
                    >
                      <MinusIcon />
                    </button>
                    <span className="qty-num">{item.qty}</span>
                    <button
                      type="button"
                      className="qty-ctrl"
                      aria-label="Increase"
                      onClick={() => changeQty(item.id, 1)}
                    >
                      <PlusIcon />
                    </button>
                  </div>
                  <div className="order-item-total">{formatMoney(item.unitPrice * item.qty)}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="order-footer">
          {checkoutError ? <p className="api-error">{checkoutError}</p> : null}
          {checkoutMsg ? <p className="pos-checkout-ok">{checkoutMsg}</p> : null}
          <div className="order-subtotal">
            <span>{t('pos.subtotal')}</span>
            <strong>{formatMoney(subtotal).replace('.', ',')}</strong>
          </div>
          <div className="order-pay-actions">
            <button
              type="button"
              className="btn-not-paid"
              disabled={saving}
              onClick={() => checkout('unpaid')}
            >
              {t('pos.notPaid')}
            </button>
            <button
              type="button"
              className="btn-paid"
              disabled={saving}
              onClick={() => checkout('paid')}
            >
              {t('pos.paid')}
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}
