import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import InvoiceModal from '../components/cashier/InvoiceModal';
import FutureSaleModal from '../components/cashier/FutureSaleModal';

import { useAuth } from '../context/AuthContext';
import { menuService } from '../services/api';
import api from '../services/api';
import { toast } from '../components/Toast';
import { LogOut } from 'lucide-react';
import '../styles/cashier.css';

function CashierDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();


  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [lastCart, setLastCart] = useState([]);
  const [productCodeInput, setProductCodeInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('All');
  const [selectedFilterIndex, setSelectedFilterIndex] = useState(-1);
  const [billNo, setBillNo] = useState(101);
  const [lastBillNo, setLastBillNo] = useState(0);
  const [lastBillAmt, setLastBillAmt] = useState(0);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showFutureSaleModal, setShowFutureSaleModal] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);

  // Payment Flow State
  const [rightPanelState, setRightPanelState] = useState('CART'); // 'CART', 'PAYMENT', 'PROCESSING'
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [cashTendered, setCashTendered] = useState('');
  const [orderType, setOrderType] = useState('take-away');
  const [futureSale, setFutureSale] = useState({ name: '', address: '', city: '', phone: '', deliveryDate: '' });
  const [lastOrderType, setLastOrderType] = useState('take-away');
  const [lastFutureSale, setLastFutureSale] = useState(null);
  const [lastPaymentMethod, setLastPaymentMethod] = useState('');

  const searchInputRef = useRef(null);
  const itemRefs = useRef([]);
  const cartInputRefs = useRef([]);

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.warn("AudioContext not supported", e);
    }
  };

  useEffect(() => {
    if (!user || !user.restaurant_id) return;

    // Fetch menu items from backend
    menuService.getItems({ restaurant_id: user.restaurant_id })
      .then(data => {
        if (Array.isArray(data)) {
          setMenuItems(data);
        }
      })
      .catch(err => console.error("Error fetching items:", err));

    // Fetch categories
    menuService.getCategories({ restaurant_id: user.restaurant_id })
      .then(data => {
        if (Array.isArray(data)) {
          // Remove duplicates based on category name
          const uniqueCategories = data.reduce((acc, current) => {
            const x = acc.find(item => item.name === current.name);
            if (!x) {
              return acc.concat([current]);
            }
            return acc;
          }, []);

          // Sort alphabetically ascending
          uniqueCategories.sort((a, b) => {
            const nameA = a.name ? a.name.toLowerCase() : '';
            const nameB = b.name ? b.name.toLowerCase() : '';
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
          });

          setCategories(uniqueCategories);
        }
      })
      .catch(err => console.error("Error fetching categories:", err));
  }, [user]);

  const submitBill = useCallback(() => {
    if (cart.length === 0) return;
    const totalAmt = cart.reduce((sum, item) => sum + item.amount, 0);

    const payload = {
      table_number: orderType === 'take-away' ? 'takeaway' : '1', // Default to 1 for dine-in if not provided
      payment_method: paymentMethod,
      cart: cart.map(c => ({ id: c.id, quantity: c.qty, price: c.rate })),
      subtotal: totalAmt,
      gst: 0,
      service_charge: 0,
      total_amount: totalAmt
    };

    api.post(`/api/v1/orders?restaurant_id=${user?.restaurant_id}`, payload)
      .then(res => {
        toast.success(`Order placed successfully! ID: ${res.data.orderId || 'Unknown'}`);
      })
      .catch(err => {
        console.error('Error placing order:', err);
        toast.error('Failed to place order to the server.');
      });

    setLastBillNo(billNo);
    setLastBillAmt(totalAmt); // Save the pre-tax total
    setBillNo(prev => prev + 1);
    setLastCart([...cart]);
    setCart([]);
    setSelectedItemIndex(null);
    setLastOrderType(orderType);
    setLastPaymentMethod(paymentMethod);
    setLastFutureSale({ ...futureSale });
    setFutureSale({ name: '', address: '', city: '', phone: '', deliveryDate: '' });
  }, [cart, billNo, orderType, paymentMethod, futureSale, user]);

  const handleCheckout = () => {
    submitBill();
    setShowInvoice(true);
    setRightPanelState('CART');
    setTimeout(() => {
      window.print();
      setShowInvoice(false);
    }, 100);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const isInputFocused = e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA';
      const isProductCodeInput = e.target.id === 'product-code-input';

      // Order Type Shortcuts (Alt+7 / Alt+4)
      if (e.key === '7' && e.altKey) {
        e.preventDefault();
        setOrderType('take-away');
      } else if (e.key === '4' && e.altKey) {
        e.preventDefault();
        setOrderType('dine-in');
      }

      // Submit bill on Space (even in product code or empty search) or Enter (if no input focused)
      const isSearchInput = searchInputRef.current && e.target === searchInputRef.current;
      const isSearchEmpty = isSearchInput && e.target.value === '';
      const canSpaceCheckout = !isInputFocused || isProductCodeInput || isSearchEmpty;

      if (e.key === ' ' && canSpaceCheckout) {
        e.preventDefault();
        if (cart.length > 0 && rightPanelState === 'CART') {
          handleCheckout();
        }
      } else if (e.key === 'Enter' && !isInputFocused) {
        e.preventDefault();
        if (cart.length > 0 && rightPanelState === 'CART') {
          handleCheckout();
        }
      }

      // Delete item on Backspace if no input is focused, OR if product code input is empty
      if (!isInputFocused || (isProductCodeInput && e.target.value === '')) {
        if (e.key === 'Backspace') {
          e.preventDefault();
          setSelectedItemIndex(prevIndex => {
            if (prevIndex !== null) {
              setCart(prevCart => prevCart.filter((_, idx) => idx !== prevIndex));
              return null;
            }
            return prevIndex;
          });
        }
      }

      if (e.key === 'ArrowDown') {
        if (rightPanelState !== 'PAYMENT' && !isInputFocused) {
          e.preventDefault();
          // Global ArrowDown focuses the top input
          document.getElementById('product-code-input')?.focus();
        }
      } else if (e.key === 'ArrowUp') {
        if (rightPanelState !== 'PAYMENT' && !isInputFocused) {
          e.preventDefault();
          document.getElementById('product-code-input')?.focus();
        }
      } else if (e.key === 'ArrowRight') {
        if (rightPanelState !== 'PAYMENT' && (!isInputFocused || (e.target.tagName === 'INPUT' && e.target.selectionStart === e.target.value.length))) {
          if (cart.length > 0) {
            e.preventDefault();
            const indexToFocus = selectedItemIndex !== null ? selectedItemIndex : cart.length - 1;
            setSelectedItemIndex(indexToFocus);
            setTimeout(() => cartInputRefs.current[indexToFocus]?.focus(), 0);
          }
        }
      }

      if (rightPanelState === 'PAYMENT' && !isInputFocused) {
        const methods = ['Cash', 'Split', 'UPI', 'Card'];
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          setPaymentMethod(prev => {
            const idx = methods.indexOf(prev);
            return methods[(idx + 1) % methods.length];
          });
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setPaymentMethod(prev => {
            const idx = methods.indexOf(prev);
            return methods[(idx - 1 + methods.length) % methods.length];
          });
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleCheckout();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [cart, billNo, handleCheckout, rightPanelState]);

  const addItemToCart = (item) => {
    setCart(prevCart => {
      const existing = prevCart.find(c => c.id === item.id);
      if (existing) {
        return prevCart.map(c =>
          c.id === item.id
            ? { ...c, qty: c.qty + 1, amount: (c.qty + 1) * c.rate }
            : c
        );
      } else {
        const price = parseFloat(item.price) || 0;
        return [...prevCart, {
          id: item.id,
          product_code: item.item_code || item.id,
          description: item.name || item.description || 'Unknown Item',
          rate: price,
          qty: 1,
          amount: price,
          pref: ''
        }];
      }
    });
  };

  const addProductToCart = () => {
    const code = productCodeInput.trim().toLowerCase();

    if (code !== '') {
      const item = menuItems.find(i =>
        i.item_code && String(i.item_code).toLowerCase() === code
      );

      if (item) {
        addItemToCart(item);
        setProductCodeInput('');
      } else {
        const inputEl = document.getElementById('product-code-input');
        if (inputEl) {
          inputEl.style.border = '2px solid red';
          inputEl.style.backgroundColor = '#fee2e2'; // Light red background
          setTimeout(() => {
            if (inputEl) {
              inputEl.style.border = '1px solid #d1d5db';
              inputEl.style.backgroundColor = 'var(--bg-surface)';
            }
          }, 400);
        }
      }
    } else {
      // Empty input + Enter -> Go to Payment
      if (cart.length > 0) {
        handleCheckout();
        if (document.activeElement) document.activeElement.blur();
      }
    }
  };

  const handleDescriptionChange = (e) => {
    setDescriptionInput(e.target.value);
    setSelectedFilterIndex(-1);
  };

  const filteredItems = menuItems.filter(item => {
    if (selectedCategoryId !== 'All' && item.category_id !== selectedCategoryId) return false;
    const search = descriptionInput.trim().toLowerCase();
    if (search) {
      const matchName = item.name && item.name.toLowerCase().includes(search);
      const matchCode = item.item_code && String(item.item_code).toLowerCase().includes(search);
      if (!matchName && !matchCode) return false;
    }
    return true;
  });

  const handleSearchKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedFilterIndex(prev => {
        const next = prev < filteredItems.length - 1 ? prev + 1 : prev;
        itemRefs.current[next]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedFilterIndex(prev => {
        if (prev <= 0) {
          // If at the top of the menu items or not selected, go back up to Product Code
          document.getElementById('product-code-input')?.focus();
          return -1;
        }
        const next = prev - 1;
        itemRefs.current[next]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedFilterIndex >= 0 && selectedFilterIndex < filteredItems.length) {
        addItemToCart(filteredItems[selectedFilterIndex]);
        setDescriptionInput('');
        setSelectedFilterIndex(-1);
        playBeep();
        setTimeout(() => searchInputRef.current?.focus(), 0);
      } else if (filteredItems.length === 1) {
        addItemToCart(filteredItems[0]);
        setDescriptionInput('');
        setSelectedFilterIndex(-1);
        playBeep();
        setTimeout(() => searchInputRef.current?.focus(), 0);
      } else if (descriptionInput.trim() === '' && cart.length > 0) {
        // If search is empty and cart has items, Enter goes to charge
        handleCheckout();
        if (document.activeElement) document.activeElement.blur();
      }
    }
  };

  const handleProductCodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addProductToCart();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      searchInputRef.current?.focus();
    }
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.amount, 0);



  return (
    <div className="app-container cashier-dashboard">
      {/* Header */}
      <header className="header">
        <div className="header-left" style={{ flex: 1 }}>
          <div className="logo-box">DU</div>
          <div className="header-title-container">
            <div className="header-title">Data Udipi Restaurant</div>
            <div className="header-subtitle">Counter POS-Cashier</div>
          </div>
        </div>

        <div className="header-center" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '1px' }}>
            Bill No: {billNo}
          </div>
        </div>

        <div className="header-right" style={{ flex: 1, justifyContent: 'flex-end', gap: '16px', display: 'flex', alignItems: 'center' }}>
          <div className="status-item">{new Date().toLocaleDateString()} &middot; Items in cart: {cart.length}</div>
          <button onClick={handleLogout} className="logout-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="main-layout">
        {/* LEFT PANEL - PRODUCTS */}
        <div className="products-panel">
          <div className="order-type-selector" style={{ marginBottom: '12px' }}>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              style={{ width: '200px', padding: '10px 14px', fontSize: '15px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', backgroundColor: 'var(--bg-surface)' }}
            >
              <option value="take-away">[7] Take Away</option>
              <option value="dine-in">[4] Dine In</option>
            </select>
          </div>

          <div className="form-group" style={{ flexDirection: 'row', gap: '12px' }}>
            <input
              id="product-code-input"
              type="text"
              className="input-field"
              value={productCodeInput}
              onChange={(e) => setProductCodeInput(e.target.value)}
              onKeyDown={handleProductCodeKeyDown}
              placeholder="Enter item code (e.g. C01)"
              style={{ flex: 1 }}
            />
          </div>

          <div className="form-group">
            <input
              ref={searchInputRef}
              className="input-field"
              placeholder="Search item..."
              value={descriptionInput}
              onChange={handleDescriptionChange}
              onKeyDown={handleSearchKeyDown}
            />
          </div>

          <div className="category-filters">
            <button
              className={`cat-btn ${selectedCategoryId === 'All' ? 'active' : ''}`}
              onClick={() => setSelectedCategoryId('All')}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`cat-btn ${selectedCategoryId === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategoryId(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="menu-items-table-container">
            <table className="menu-items-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>CODE</th>
                  <th>ITEM</th>
                  <th style={{ textAlign: 'right', width: '120px' }}>PRICE</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => (
                  <tr
                    key={item.id}
                    ref={el => itemRefs.current[index] = el}
                    className={selectedFilterIndex === index ? 'active-row' : ''}
                    onClick={() => {
                      addItemToCart(item);
                      // Reset search to simulate fast checkout on click too
                      setDescriptionInput('');
                      setSelectedFilterIndex(-1);
                      setTimeout(() => searchInputRef.current?.focus(), 0);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="item-code">{item.item_code}</td>
                    <td className="item-name">{item.name}</td>
                    <td className="item-price-cell">
                      <span>₹{(item.price || 0).toFixed(2)}</span>
                      <button className="add-btn" onClick={(e) => {
                        e.stopPropagation();
                        addItemToCart(item);
                      }}>+</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT PANEL - CART / PAYMENT */}
        <div className="cart-panel">
          {rightPanelState === 'CART' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="cart-header" style={{ flexShrink: 0 }}>
                <div className="cart-title">
                  <h2>Current order</h2>
                  <span className="cart-subtitle">{cart.length} lines &middot; {cart.reduce((sum, item) => sum + item.qty, 0)} items</span>
                </div>
                <button className="clear-btn" onClick={() => setCart([])}>Clear</button>
              </div>

              <div className="cart-items-list" style={{ flex: 1, overflowY: 'auto' }}>
                {cart.map((item, index) => (
                  <div className="cart-item" key={item.id}>
                    <div className="cart-item-top">
                      <span className="cart-item-name">{item.description}</span>
                      <span className="cart-item-rate">₹{item.rate.toFixed(2)}</span>
                    </div>
                    <div className="cart-item-code">{item.product_code}</div>
                    <div className="cart-item-actions">
                      <div className="qty-controls">
                        <button onClick={() => {
                          setCart(prev => {
                            const newCart = prev.map(c =>
                              c.id === item.id ? { ...c, qty: c.qty - 1, amount: (c.qty - 1) * c.rate } : c
                            );
                            return newCart.filter(c => c.qty > 0);
                          });
                        }}>-</button>
                        <input
                          type="number"
                          className="qty-input"
                          ref={el => cartInputRefs.current[index] = el}
                          value={item.qty}
                          onFocus={() => setSelectedItemIndex(index)}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              if (index < cart.length - 1) {
                                setSelectedItemIndex(index + 1);
                                cartInputRefs.current[index + 1]?.focus();
                              }
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              if (index > 0) {
                                setSelectedItemIndex(index - 1);
                                cartInputRefs.current[index - 1]?.focus();
                              }
                            } else if (e.key === 'ArrowLeft') {
                              e.preventDefault();
                              document.getElementById('product-code-input')?.focus();
                              setSelectedItemIndex(null);
                            } else if (e.key === 'Enter') {
                              e.preventDefault();
                              e.target.blur();
                              document.getElementById('product-code-input')?.focus();
                              setSelectedItemIndex(null);
                            }
                          }}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (val === '') {
                              setCart(prev => prev.map(c =>
                                c.id === item.id ? { ...c, qty: '', amount: 0 } : c
                              ));
                            } else {
                              const num = parseInt(val, 10);
                              if (!isNaN(num)) {
                                if (num === 0) {
                                  setCart(prev => prev.filter(c => c.id !== item.id));
                                } else if (num > 0) {
                                  setCart(prev => prev.map(c =>
                                    c.id === item.id ? { ...c, qty: num, amount: num * c.rate } : c
                                  ));
                                }
                              }
                            }
                          }}
                          onBlur={() => {
                            if (item.qty === '' || item.qty <= 0) {
                              setCart(prev => prev.filter(c => c.id !== item.id));
                            }
                          }}
                        />
                        <button onClick={() => {
                          setCart(prev => prev.map(c =>
                            c.id === item.id ? { ...c, qty: c.qty + 1, amount: (c.qty + 1) * c.rate } : c
                          ));
                        }}>+</button>
                      </div>
                      <span className="cart-item-total">Total: ₹{item.amount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* FIXED AT BOTTOM: Payment Summary */}
              <div className="cart-footer" style={{ flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                  <button
                    className="btn-future-sale"
                    onClick={() => setShowFutureSaleModal(true)}
                    style={{ padding: '8px 24px', backgroundColor: '#e5e7eb', color: '#374151', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', width: '100%', transition: 'background-color 0.2s' }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#d1d5db'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                  >
                    + Future Sale
                  </button>
                </div>
                <div className="cart-summary-row">
                  <span className="summary-label">Subtotal</span>
                  <span className="summary-value">₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="cart-total-row">
                  <span className="total-label">Total</span>
                  <span className="total-value">₹{totalAmount.toFixed(2)}</span>
                </div>

                <button
                  className="charge-btn"
                  onClick={() => {
                    if (cart.length > 0) {
                      handleCheckout();
                    }
                  }}
                >
                  Charge ₹{totalAmount.toFixed(2)}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <InvoiceModal
        show={showInvoice}
        lastBillNo={lastBillNo}
        lastOrderType={lastOrderType}
        lastPaymentMethod={lastPaymentMethod}
        lastFutureSale={lastFutureSale}
        lastCart={lastCart}
        lastBillAmt={lastBillAmt}
      />

      <FutureSaleModal
        show={showFutureSaleModal}
        setShow={setShowFutureSaleModal}
        futureSale={futureSale}
        setFutureSale={setFutureSale}
      />
    </div>
  );
}

export default CashierDashboard;
