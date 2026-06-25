import React, { useState, useEffect } from 'react';
import { Clock, ChefHat, CheckCircle2, Truck, Search, SlidersHorizontal } from 'lucide-react';
import { orderService } from '../services/api';

const DINE_IN_COLUMNS = [
  { id: 'PENDING', title: 'New Orders', icon: Clock, color: '#ff8c42', bg: 'rgba(255, 140, 66, 0.1)', iconBg: '#ff8c42', defaultBg: '#fff' },
  { id: 'PREPARING', title: 'Preparing', icon: ChefHat, color: '#fbb117', bg: 'rgba(251, 177, 23, 0.1)', iconBg: '#fbb117', defaultBg: '#fff' },
  { id: 'READY', title: 'Ready to Serve', icon: CheckCircle2, color: '#2d7a4a', bg: 'rgba(45, 122, 74, 0.1)', iconBg: '#2d7a4a', defaultBg: '#fff' },
  { id: 'SERVED', title: 'Served', icon: Truck, color: '#666', bg: 'rgba(100, 100, 100, 0.1)', iconBg: '#888', defaultBg: '#fff' },
];

const TAKEAWAY_COLUMNS = [
  { id: 'PENDING', title: 'New Orders', icon: Clock, color: '#ff8c42', bg: 'rgba(255, 140, 66, 0.1)', iconBg: '#ff8c42', defaultBg: '#fff' },
  { id: 'PREPARING', title: 'Preparing', icon: ChefHat, color: '#fbb117', bg: 'rgba(251, 177, 23, 0.1)', iconBg: '#fbb117', defaultBg: '#fff' },
  { id: 'READY', title: 'Ready to pickup', icon: CheckCircle2, color: '#2d7a4a', bg: 'rgba(45, 122, 74, 0.1)', iconBg: '#2d7a4a', defaultBg: '#fff' },
  { id: 'SERVED', title: 'Picked up', icon: Truck, color: '#666', bg: 'rgba(100, 100, 100, 0.1)', iconBg: '#888', defaultBg: '#fff' },
];

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMobileTab, setActiveMobileTab] = useState('PENDING');
  const [selectedKOTOrder, setSelectedKOTOrder] = useState(null);
  const [orderMode, setOrderMode] = useState('DINE_IN'); // 'DINE_IN' | 'TAKEAWAY'

  const isTakeaway = (order) => {
    return (!order.table_number || order.table_number === 'N/A' || order.table_number.toString().toLowerCase() === 'takeaway');
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Polling every 10s

    const handleVoiceNav = (e) => {
      if (e.detail && e.detail.tab) {
        const tabStr = e.detail.tab.toUpperCase();
        const tabMap = {
          'PENDING': 'PENDING', 'NEW ORDERS': 'PENDING', 'NEW': 'PENDING',
          'PREPARING': 'PREPARING',
          'READY': 'READY', 'READY TO SERVE': 'READY',
          'SERVED': 'SERVED'
        };
        const mappedTab = tabMap[tabStr] || tabStr;
        setActiveMobileTab(mappedTab);
      }
    };
    window.addEventListener('navigate-orders-tab', handleVoiceNav);

    return () => {
      clearInterval(interval);
      window.removeEventListener('navigate-orders-tab', handleVoiceNav);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await orderService.getLiveOrders();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching live orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    // Optimistic update
    setOrders(current => current.map(o => o.order_id === orderId ? { ...o, status: newStatus } : o));
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      // Re-fetch to ensure sync
      fetchOrders();
    } catch (err) {
      console.error('Error updating order status:', err);
      fetchOrders(); // Revert on failure
    }
  };

  const updatePaymentStatus = async (orderId, isPaid) => {
    const newStatus = isPaid ? 'Paid' : 'Pending';
    setOrders(current => current.map(o => o.order_id === orderId ? { ...o, payment_status: newStatus } : o));
    try {
      await orderService.updateOrderPaymentStatus(orderId, newStatus);
      fetchOrders();
    } catch (err) {
      console.error('Error updating order payment status:', err);
      fetchOrders();
    }
  };

  const handleDragStart = (e, orderId) => {
    e.dataTransfer.setData('orderId', orderId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const orderId = parseInt(e.dataTransfer.getData('orderId'), 10);
    if (!orderId) return;

    const order = orders.find(o => o.order_id === orderId);
    if (order && order.status !== targetStatus) {
      updateOrderStatus(orderId, targetStatus);
    }
  };

  // Helper to format time ago
  const timeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    const dStr = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const minutes = Math.max(0, Math.floor((new Date() - new Date(dStr)) / 60000));
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hr ago`;
  };

  const currentColumns = orderMode === 'TAKEAWAY' ? TAKEAWAY_COLUMNS : DINE_IN_COLUMNS;
  const filteredOrders = orders.filter(order => orderMode === 'TAKEAWAY' ? isTakeaway(order) : !isTakeaway(order));
  const activeDineInOrdersCount = orders.filter(o => !isTakeaway(o) && o.status !== 'SERVED').length;
  const activeTakeawayOrdersCount = orders.filter(o => isTakeaway(o) && o.status !== 'SERVED').length;

  if (loading) {
    return <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>Loading orders...</div>;
  }

  return (
    <div className="admin-page-mobile-wrapper page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      <div className="page-header desktop-only" style={{ marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-dark)' }}>Live Orders (KDS)</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>Kitchen Display System — Real-time order tracking</p>
        </div>
        <div style={{ 
          background: 'var(--surface)', 
          border: '1px solid rgba(0,0,0,0.08)',
          padding: '8px 16px', 
          borderRadius: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2d7a4a' }}></div>
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-dark)' }}>
            {filteredOrders.filter(o => o.status !== 'SERVED').length} Active Orders
          </span>
        </div>
      </div>

      {/* Toggle View */}
      <style>{`
        @keyframes toggle-blink {
          0%, 100% { opacity: 1; background-color: #ff6b35; color: white; transform: scale(1); }
          50% { opacity: 0.9; background-color: #ff8c42; color: white; transform: scale(1.05); }
        }
        .blinking-badge {
          animation: toggle-blink 1.5s infinite ease-in-out;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 800;
          margin-left: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', padding: '4px', background: 'rgba(0,0,0,0.04)', borderRadius: '24px', width: 'fit-content' }}>
        <button 
          onClick={() => setOrderMode('DINE_IN')}
          style={{ display: 'flex', alignItems: 'center', padding: '8px 24px', borderRadius: '20px', border: 'none', background: orderMode === 'DINE_IN' ? 'white' : 'transparent', color: orderMode === 'DINE_IN' ? '#111' : '#666', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: orderMode === 'DINE_IN' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
        >
          Dine-In
          {orderMode === 'TAKEAWAY' && activeDineInOrdersCount > 0 && (
            <span className="blinking-badge">{activeDineInOrdersCount}</span>
          )}
        </button>
        <button 
          onClick={() => setOrderMode('TAKEAWAY')}
          style={{ display: 'flex', alignItems: 'center', padding: '8px 24px', borderRadius: '20px', border: 'none', background: orderMode === 'TAKEAWAY' ? 'white' : 'transparent', color: orderMode === 'TAKEAWAY' ? '#111' : '#666', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: orderMode === 'TAKEAWAY' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
        >
          Takeaway
          {orderMode === 'DINE_IN' && activeTakeawayOrdersCount > 0 && (
            <span className="blinking-badge">{activeTakeawayOrdersCount}</span>
          )}
        </button>
      </div>

      {/* Mobile Header, Search, Tabs, and Grid */}
      <div className="mobile-only-orders" style={{ width: '100%', minWidth: 0, maxWidth: '100%' }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', marginTop: '16px' }}>
          <div style={{ flex: 1, background: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', padding: '10px 16px', border: '1px solid #eee' }}>
            <Search size={16} color="#aaa" />
            <input type="text" placeholder="Search Order ID..." style={{ border: 'none', outline: 'none', marginLeft: '8px', fontSize: '13px', width: '100%' }} />
          </div>
          <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #eee' }}>
            <SlidersHorizontal size={16} color="#111" />
          </div>
        </div>

        <div style={{ 
          display: 'flex', gap: '12px', overflowX: 'auto', 
          paddingBottom: '16px', paddingTop: '16px',
          msOverflowStyle: 'none', scrollbarWidth: 'none',
          position: 'sticky', top: 0, zIndex: 20, background: '#F4F6F8',
          width: '100%'
        }}>
          {currentColumns.map(column => {
            const count = filteredOrders.filter(o => {
              if (column.id === 'PENDING') return o.status === 'PENDING' || o.status === 'CONFIRMED';
              return o.status === column.id;
            }).length;
            const isActive = activeMobileTab === column.id;
            const Icon = column.icon;
            return (
              <div 
                key={column.id} 
                onClick={() => setActiveMobileTab(column.id)}
                style={{ 
                  background: isActive ? '#111' : 'white',
                  border: isActive ? 'none' : '1px solid #eee',
                  padding: '10px 16px', 
                  borderRadius: '24px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <Icon size={14} color={isActive ? 'white' : '#ffb300'} />
                <span style={{ fontSize: '12px', fontWeight: '700', color: isActive ? 'white' : '#111' }}>{column.title}</span>
                {count > 0 && (
                  <span style={{ background: isActive ? '#333' : '#eee', color: isActive ? 'white' : '#888', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>{count}</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="manager-orders-grid" style={{ paddingTop: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
          {filteredOrders.filter(o => {
            if (activeMobileTab === 'PENDING') return o.status === 'PENDING' || o.status === 'CONFIRMED';
            return o.status === activeMobileTab;
          }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(order => (
            <div key={order.order_id} style={{ background: 'white', borderRadius: '12px', padding: '12px', border: '1px solid #eee', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#ff6b35', fontWeight: '800', fontSize: '13px' }}>#{order.order_id}</span>
                <span style={{ background: '#f5f5f5', color: '#888', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '700' }}>{timeAgo(order.created_at)}</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#111', marginBottom: '12px', lineHeight: '1.5', flex: 1 }}>
                {order.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #f5f5f5', paddingBottom: '12px' }}>
                <span style={{ fontSize: '11px', color: '#888', fontWeight: '500' }}>
                  {(!order.table_number || order.table_number === 'N/A' || order.table_number.toString().toLowerCase() === 'takeaway') ? (order.order_type || 'Takeaway') : `Table ${order.table_number}`}
                </span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#111' }}>₹ {order.total_amount}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <button onClick={() => setSelectedKOTOrder(order)} style={{ flex: 1, padding: '10px 0', background: '#f5f5f5', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: '#888', cursor: 'pointer' }}>Details</button>
                {order.status === 'PENDING' || order.status === 'CONFIRMED' ? (
                  <button onClick={() => updateOrderStatus(order.order_id, 'PREPARING')} style={{ flex: 1, padding: '10px 0', background: '#ff6b35', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: 'white' }}>Start Preparing</button>
                ) : order.status === 'PREPARING' ? (
                  <button onClick={() => updateOrderStatus(order.order_id, 'READY')} style={{ flex: 1, padding: '10px 0', background: '#ffb300', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: 'white' }}>Mark Ready</button>
                ) : order.status === 'READY' ? (
                  <button onClick={() => updateOrderStatus(order.order_id, 'SERVED')} style={{ flex: 1, padding: '10px 0', background: '#2d7a4a', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: 'white' }}>{orderMode === 'TAKEAWAY' ? 'Mark Picked up' : 'Mark Served'}</button>
                ) : (
                  <button style={{ flex: 1, padding: '10px 0', background: '#eee', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: '#888' }}>{orderMode === 'TAKEAWAY' ? 'Picked up' : 'Served'}</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="desktop-only" style={{ display: 'flex', gap: '24px', flex: 1, overflowX: 'auto', paddingBottom: '16px' }}>
        {currentColumns.map(column => {
          // 'PENDING' also includes 'CONFIRMED'
          const columnOrders = filteredOrders.filter(o => {
            if (column.id === 'PENDING') return o.status === 'PENDING' || o.status === 'CONFIRMED';
            return o.status === column.id;
          }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          const Icon = column.icon;

          return (
            <div 
              key={column.id} 
              style={{ 
                flex: '1', 
                minWidth: '280px', 
                display: 'flex', 
                flexDirection: 'column',
                gap: '20px',
              }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '4px' }}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '50%', 
                  background: column.iconBg, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white',
                  boxShadow: `0 4px 12px ${column.bg}`
                }}>
                  <Icon size={20} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-dark)' }}>{column.title}</h3>
                <div style={{ 
                  background: 'rgba(0,0,0,0.04)', 
                  padding: '2px 10px', 
                  borderRadius: '16px', 
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  marginLeft: 'auto'
                }}>
                  {columnOrders.length}
                </div>
              </div>

              {/* Cards Container */}
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '16px',
                minHeight: '150px'
              }}>
                {columnOrders.map(order => (
                  <div 
                    key={order.order_id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, order.order_id)}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid rgba(0,0,0,0.06)',
                      borderRadius: '16px',
                      padding: '20px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                      cursor: 'grab',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ fontWeight: '700', fontSize: '14px', color: column.iconBg }}>#{order.order_id}</span>
                      <span style={{ 
                        fontSize: '11px', 
                        background: '#f4f4f6', 
                        padding: '4px 10px', 
                        borderRadius: '16px',
                        color: 'var(--text-secondary)',
                        fontWeight: '600'
                      }}>
                        {timeAgo(order.created_at)}
                      </span>
                    </div>

                    <div style={{ 
                      fontSize: '13px', 
                      color: 'var(--text-dark)', 
                      fontWeight: '600', 
                      marginBottom: '20px', 
                      lineHeight: '1.6' 
                    }}>
                      {order.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '16px'
                    }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                        {(!order.table_number || order.table_number === 'N/A' || order.table_number.toString().toLowerCase() === 'takeaway') ? (order.order_type || 'Takeaway') : `Table ${order.table_number}`}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-dark)' }}>₹ {order.total_amount}</span>
                    </div>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <button onClick={() => setSelectedKOTOrder(order)} style={{ flex: 1, padding: '8px 0', borderRadius: '24px', border: '1px solid #e0e0e0', background: 'transparent', fontSize: '11px', fontWeight: '600', color: '#666', cursor: 'pointer' }}>
                          Details
                        </button>
                        
                        {order.status === 'PENDING' || order.status === 'CONFIRMED' ? (
                          <button onClick={() => updateOrderStatus(order.order_id, 'PREPARING')} style={{ flex: 1, padding: '8px 0', borderRadius: '24px', border: 'none', background: '#ff6b35', fontSize: '11px', fontWeight: '600', color: '#fff', cursor: 'pointer' }}>
                            Start Preparing
                          </button>
                        ) : order.status === 'PREPARING' ? (
                          <button onClick={() => updateOrderStatus(order.order_id, 'READY')} style={{ flex: 1, padding: '8px 0', borderRadius: '24px', border: 'none', background: '#ff6b35', fontSize: '11px', fontWeight: '600', color: '#fff', cursor: 'pointer' }}>
                            Mark Ready
                          </button>
                        ) : order.status === 'READY' ? (
                          <button onClick={() => updateOrderStatus(order.order_id, 'SERVED')} style={{ flex: 1, padding: '8px 0', borderRadius: '24px', border: 'none', background: '#ff6b35', fontSize: '11px', fontWeight: '600', color: '#fff', cursor: 'pointer' }}>
                            {orderMode === 'TAKEAWAY' ? 'Mark Picked up' : 'Mark Served'}
                          </button>
                        ) : (
                          <button style={{ flex: 1, padding: '8px 0', borderRadius: '24px', border: 'none', background: '#e0e0e0', fontSize: '11px', fontWeight: '600', color: '#666', cursor: 'not-allowed' }}>
                            {orderMode === 'TAKEAWAY' ? 'Picked up' : 'Completed'}
                          </button>
                        )}
                      </div>

                      {order.payment_method?.toLowerCase() === 'cash' && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Payment (Cash):</span>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={order.payment_status?.toLowerCase() === 'paid'}
                              onChange={(e) => updatePaymentStatus(order.order_id, e.target.checked)}
                              style={{ cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '12px', fontWeight: '500', color: order.payment_status?.toLowerCase() === 'paid' ? '#2d7a4a' : '#ff8c42' }}>
                              {order.payment_status?.toLowerCase() === 'paid' ? 'Paid' : 'Pending'}
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* KOT Modal */}
      {selectedKOTOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setSelectedKOTOrder(null)}>
          <div style={{ background: '#f8f9fa', padding: '32px 24px', borderRadius: '8px', maxWidth: '360px', width: '100%', fontFamily: 'monospace', color: 'black', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', letterSpacing: '2px', marginBottom: '8px' }}>KITCHEN ORDER TICKET</div>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', letterSpacing: '4px', marginBottom: '16px' }}>* * * KOT * * *</div>
            
            <div style={{ borderTop: '1px dashed #aaa', margin: '12px 0' }}></div>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>Order No</div>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '36px', marginBottom: '16px' }}>#{selectedKOTOrder.order_id}</div>
            
            <div style={{ borderTop: '1px dashed #aaa', margin: '12px 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
              <span>Date</span>
              <span>{new Date(selectedKOTOrder.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
              <span>Time</span>
              <span>{new Date(selectedKOTOrder.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
              <span>Table</span>
              <span>{(!selectedKOTOrder.table_number || selectedKOTOrder.table_number === 'N/A' || selectedKOTOrder.table_number.toString().toLowerCase() === 'takeaway') ? 'Takeaway' : `T${selectedKOTOrder.table_number.toString().padStart(2, '0')}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>
              <span>Type</span>
              <span>{(!selectedKOTOrder.table_number || selectedKOTOrder.table_number === 'N/A' || selectedKOTOrder.table_number.toString().toLowerCase() === 'takeaway') ? 'Takeaway' : 'Dine-In'}</span>
            </div>

            <div style={{ borderTop: '1px dashed #aaa', margin: '12px 0' }}></div>
            <div style={{ display: 'flex', gap: '16px', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
              <span style={{ width: '32px' }}>QTY</span>
              <span>ITEM</span>
            </div>
            <div style={{ borderTop: '1px dashed #aaa', margin: '12px 0' }}></div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', fontSize: '14px' }}>
              {selectedKOTOrder.items && selectedKOTOrder.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '16px' }}>
                  <span style={{ width: '32px', fontWeight: 'bold' }}>{item.quantity}</span>
                  <span style={{ fontWeight: 'bold' }}>{item.item_name?.toUpperCase() || item.name?.toUpperCase() || `ITEM #${item.item_id}`}</span>
                </div>
              ))}
              {(!selectedKOTOrder.items || selectedKOTOrder.items.length === 0) && (
                <div style={{ fontStyle: 'italic', color: '#666' }}>No items found</div>
              )}
            </div>

            {selectedKOTOrder.notes && (
              <>
                <div style={{ borderTop: '1px dashed #aaa', margin: '12px 0' }}></div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>Special Note:</div>
                <div style={{ fontStyle: 'italic', marginBottom: '16px', fontSize: '14px' }}>{selectedKOTOrder.notes}</div>
              </>
            )}
            
            <div style={{ borderTop: '1px dashed #aaa', margin: '12px 0' }}></div>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', marginTop: '16px' }}>* * * END OF TICKET * * *</div>
            
            <button 
              onClick={() => setSelectedKOTOrder(null)}
              style={{ marginTop: '24px', width: '100%', padding: '12px', background: '#e0e0e0', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'sans-serif' }}
            >
              CLOSE TICKET
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;
