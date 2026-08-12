import { useMemo, useState } from 'react'
import TabBar from '../components/TabBar'

const PAGE_SIZE = 8

const PRODUCTS = Array.from({ length: 16 }, (_, i) => ({
  id: i + 1,
  name: 'Product 1',
  size: '20 cl',
  amount: 123,
  quantity: 20,
  qtyTone: i % 8 === 0 ? 'orange' : i % 8 === 1 ? 'red' : 'green',
}))

const CART_SEED = []

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
  return `€${value.toFixed(2)}`
}

export default function POS() {
  const [search, setSearch] = useState('')
  const [customer, setCustomer] = useState('')
  const [cart, setCart] = useState(CART_SEED)
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return PRODUCTS
    return PRODUCTS.filter((p) => p.name.toLowerCase().includes(q))
  }, [search])

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

  function addProduct(product) {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.name === product.name && item.unitPrice === product.amount,
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
          name: product.name,
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

  return (
    <div className="pos-layout">
      <div className="pos-left">
        <TabBar />

        <section className="pos-panel pos-products">
          <div className="pos-search">
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

          <div className="pos-table-wrap">
            <table className="pos-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Size</th>
                  <th>Amount</th>
                  <th>Quantity</th>
                  <th>Action</th>
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
        </section>
      </div>

      <aside className="pos-panel pos-order">
        <div className="pos-order-top-card">
          <h2 className="pos-order-title">Current Order</h2>
          <div className="pos-search">
            <span className="pos-search-icon">
              <img src="/pos/search.svg" alt="" />
            </span>
            <input
              type="search"
              placeholder="Search Customer"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            />
          </div>
        </div>

        <div className="order-list-head">
          <span>Order list</span>
          <button type="button" className="clear-cart" onClick={() => setCart([])}>
            Clear Cart
          </button>
        </div>

        <div className="order-items">
          {cart.length === 0 ? (
            <p className="order-empty">Cart is empty</p>
          ) : (
            cart.map((item) => (
              <div className="order-item" key={item.id}>
                <div className="order-item-top">
                  <div>
                    <div className="order-item-name">{item.name}</div>
                    <div className="order-item-price">{formatMoney(item.unitPrice)}</div>
                  </div>
                  <button
                    type="button"
                    className="trash-btn"
                    aria-label="Remove"
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
          <div className="order-subtotal">
            <span>Subtotal:</span>
            <strong>{formatMoney(subtotal).replace('.', ',')}</strong>
          </div>
          <div className="order-pay-actions">
            <button type="button" className="btn-not-paid">
              Not Paid
            </button>
            <button type="button" className="btn-paid">
              Paid
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}
