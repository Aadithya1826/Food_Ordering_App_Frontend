import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChefHat, CheckCircle2, Truck, Search, SlidersHorizontal, Bell, BellOff, Volume2, User, Phone } from 'lucide-react';
import { orderService } from '../services/api';
import { kotAudio, ringKOTOrders, stopKOTRinging, unlockKOTAudio } from '../utils/kotAudio';

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

const DELIVERY_COLUMNS = [
  { id: 'PENDING', title: 'New Orders', icon: Clock, color: '#ff8c42', bg: 'rgba(255, 140, 66, 0.1)', iconBg: '#ff8c42', defaultBg: '#fff' },
  { id: 'PREPARING', title: 'Preparing', icon: ChefHat, color: '#fbb117', bg: 'rgba(251, 177, 23, 0.1)', iconBg: '#fbb117', defaultBg: '#fff' },
  { id: 'READY', title: 'Ready for Delivery', icon: CheckCircle2, color: '#2d7a4a', bg: 'rgba(45, 122, 74, 0.1)', iconBg: '#2d7a4a', defaultBg: '#fff' },
  { id: 'SERVED', title: 'Out for Delivery', icon: Truck, color: '#666', bg: 'rgba(100, 100, 100, 0.1)', iconBg: '#888', defaultBg: '#fff' },
];

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMobileTab, setActiveMobileTab] = useState('PENDING');
  const [selectedKOTOrder, setSelectedKOTOrder] = useState(null);
  const [orderMode, setOrderMode] = useState('DINE_IN'); // 'DINE_IN' | 'TAKEAWAY'
  const [ringingInfo, setRingingInfo] = useState({ isRinging: false, remainingCount: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const knownOrderIdsRef = useRef(null);

  // Subscribe to KOT audio controller state
  useEffect(() => {
    const unsubscribe = kotAudio.subscribe((state) => {
      setRingingInfo(state);
    });
    return () => unsubscribe();
  }, []);

  // Unlock AudioContext on first user interaction with the page
  useEffect(() => {
    const handleInteraction = () => {
      unlockKOTAudio();
    };
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  const isDelivery = (order) => {
    return order.order_type?.toLowerCase() === 'delivery';
  };

  const isTakeaway = (order) => {
    return !isDelivery(order) && (!order.table_number || order.table_number === 'N/A' || order.table_number.toString().toLowerCase() === 'takeaway');
  };

  const isDineIn = (order) => {
    return !isDelivery(order) && !isTakeaway(order);
  };

  const getPaymentDisplayInfo = (order) => {
    const method = (order?.payment_method || '').toLowerCase().trim();
    const status = (order?.payment_status || '').toLowerCase().trim();
    const isPaid = status === 'paid';

    // Check if user selected Pay at the Counter / Cash
    const isPayAtCounter = 
      method.includes('cash') || 
      method.includes('counter') || 
      method.includes('cod') ||
      method.includes('pay at counter');

    const isUpiMethod = 
      method.includes('upi') || 
      method.includes('razorpay') || 
      method.includes('online') || 
      method.includes('gpay') || 
      method.includes('phonepe') || 
      method.includes('card') || 
      method.includes('wallet');

    // If order payment is completed (either via UPI or cash collected and marked Paid):
    // Green styling when paid
    if (isPaid) {
      const badgeText = isUpiMethod ? 'UPI Paid' : (isPayAtCounter ? 'Counter Paid' : 'Paid');
      return {
        type: 'PAID',
        isPaid: true,
        isUpi: isUpiMethod,
        label: badgeText,
        badgeText: badgeText,
        themeColor: '#16a34a',
        cardBg: '#f0fdf4',
        cardBorder: '2px solid #22c55e',
        borderLeft: '6px solid #16a34a',
        boxShadow: '0 4px 14px rgba(34, 197, 94, 0.12)',
        hoverBoxShadow: '0 12px 24px rgba(34, 197, 94, 0.22)',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
        badgeBorder: '1px solid #86efac',
        orderIdColor: '#15803d',
        amountColor: '#15803d',
      };
    }

    // Otherwise, payment is UNPAID / Pending (Red)
    const badgeText = isPayAtCounter ? 'Pay at Counter' : 'Payment Pending';
    return {
      type: 'UNPAID',
      isPaid: false,
      isUpi: false,
      label: badgeText,
      badgeText: badgeText,
      themeColor: '#dc2626',
      cardBg: '#fef2f2',
      cardBorder: '2px solid #ef4444',
      borderLeft: '6px solid #dc2626',
      boxShadow: '0 4px 14px rgba(239, 68, 68, 0.12)',
      hoverBoxShadow: '0 12px 24px rgba(239, 68, 68, 0.22)',
      badgeBg: '#fee2e2',
      badgeColor: '#b91c1c',
      badgeBorder: '1px solid #fca5a5',
      orderIdColor: '#b91c1c',
      amountColor: '#b91c1c',
    };
  };
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000); // Polling every 4s for rapid KOT order alerts

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
      const currentOrders = Array.isArray(data) ? data : [];
      
      if (currentOrders.length > 0) {
        const currentIds = currentOrders.map(o => o.order_id || o.id);

        if (knownOrderIdsRef.current === null) {
          // Initial mount: record all existing orders so we only alert for NEW incoming orders
          knownOrderIdsRef.current = new Set(currentIds);
        } else {
          // Identify newly arrived orders
          const newOrders = currentOrders.filter(o => !knownOrderIdsRef.current.has(o.order_id || o.id));
          const newOrdersCount = newOrders.length;

          if (newOrdersCount > 0) {
            // Register all new orders as known
            newOrders.forEach(o => knownOrderIdsRef.current.add(o.order_id || o.id));

            // Ring louder: 3 sec per order, repeated for as many orders arrived!
            // (e.g. if simultaneously two orders placed, it will ring 2 times as 3sec ring)
            ringKOTOrders(newOrdersCount);
          }
        }
      } else if (knownOrderIdsRef.current === null) {
        knownOrderIdsRef.current = new Set();
      }
      
      setOrders(currentOrders);
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

  // Helper to format placed time (e.g. 10:15 AM)
  const formatOrderTime = (dateString) => {
    if (!dateString) return '';
    let dStr = typeof dateString === 'string' ? dateString : dateString.toString();
    if (!dStr.includes('Z') && !dStr.includes('+')) {
      dStr = dStr.replace(' ', 'T') + 'Z';
    }
    const d = new Date(dStr);
    const validDate = isNaN(d.getTime()) ? new Date(dateString) : d;
    if (isNaN(validDate.getTime())) return '';
    return validDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Helper to safely resolve customer name and phone
  const getCustomerDetails = (order) => {
    let name = (order?.customer_name || '').trim();
    let phone = (order?.customer_phone || '').trim();

    let deliveryObj = null;
    if (order?.delivery_address) {
      if (typeof order.delivery_address === 'string') {
        try {
          deliveryObj = JSON.parse(order.delivery_address);
        } catch (e) {
          deliveryObj = null;
        }
      } else if (typeof order.delivery_address === 'object') {
        deliveryObj = order.delivery_address;
      }
    }

    if (deliveryObj) {
      if (!name || name === 'Guest' || name === phone) {
        const addrName = deliveryObj.contact_name || deliveryObj.name;
        if (addrName) name = addrName.trim();
      }
      if (!phone) {
        const addrPhone = deliveryObj.contact_phone || deliveryObj.phone;
        if (addrPhone) phone = addrPhone.trim();
      }
    }

    if (!name || name === 'None') {
      if (phone) {
        name = 'Customer';
      } else if (order?.table_number && !isTakeaway(order) && !isDelivery(order)) {
        name = `Table ${order.table_number}`;
      } else {
        name = isTakeaway(order) ? 'Takeaway Guest' : isDelivery(order) ? 'Delivery Guest' : 'Guest';
      }
    }

    return { name, phone };
  };

  // Helper to format time ago
  const timeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    let dStr = typeof dateString === 'string' ? dateString : dateString.toString();
    if (!dStr.includes('Z') && !dStr.includes('+')) {
      dStr = dStr.replace(' ', 'T') + 'Z';
    }
    const diffMs = new Date() - new Date(dStr);
    const minutes = Math.floor(diffMs / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const currentColumns = orderMode === 'TAKEAWAY' ? TAKEAWAY_COLUMNS : orderMode === 'DELIVERY' ? DELIVERY_COLUMNS : DINE_IN_COLUMNS;
  const filteredOrders = orders.filter(order => {
    const matchesMode = orderMode === 'TAKEAWAY' ? isTakeaway(order) : orderMode === 'DELIVERY' ? isDelivery(order) : isDineIn(order);
    if (!matchesMode) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const orderIdStr = (order.order_id || '').toString().toLowerCase();
    const cust = getCustomerDetails(order);
    const nameMatch = cust.name.toLowerCase().includes(term);
    const phoneMatch = cust.phone.toLowerCase().includes(term);
    const itemsMatch = order.items && order.items.some(i => (i.name || '').toLowerCase().includes(term));
    const tableMatch = (order.table_number || '').toString().toLowerCase().includes(term);
    return orderIdStr.includes(term) || nameMatch || phoneMatch || itemsMatch || tableMatch;
  });
  const activeDineInOrdersCount = orders.filter(o => isDineIn(o) && o.status !== 'SERVED').length;
  const activeTakeawayOrdersCount = orders.filter(o => isTakeaway(o) && o.status !== 'SERVED').length;
  const activeDeliveryOrdersCount = orders.filter(o => isDelivery(o) && o.status !== 'SERVED').length;

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--surface)',
            border: '1px solid rgba(0,0,0,0.08)',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#15803d' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
              UPI Paid (Green)
            </span>
            <span style={{ color: 'rgba(0,0,0,0.2)' }}>|</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b91c1c' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
              Pay at Counter (Red)
            </span>
          </div>

          <button
            onClick={() => {
              unlockKOTAudio();
              ringKOTOrders(1);
            }}
            title="Test KOT 3-Second Loud Ringing Alert"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '24px',
              border: ringingInfo.isRinging ? '1px solid #ef4444' : '1px solid #fed7aa',
              background: ringingInfo.isRinging ? '#fef2f2' : '#fff7ed',
              color: ringingInfo.isRinging ? '#dc2626' : '#ea580c',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.08)'
            }}
          >
            <Bell size={15} className={ringingInfo.isRinging ? 'animate-bounce' : ''} />
            {ringingInfo.isRinging ? `Ringing (${ringingInfo.remainingCount})...` : 'Test Loud Ring (3s)'}
          </button>

          {/* Desktop Search input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface)',
            border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: '24px',
            padding: '6px 14px',
            gap: '8px',
            minWidth: '240px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <Search size={15} color="#94a3b8" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ID, Customer, Phone..."
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '13px',
                width: '100%',
                color: 'var(--text-dark)'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: '0 2px'
                }}
              >
                ✕
              </button>
            )}
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
      </div>

      {/* Active Loud Ringing Banner Alert */}
      {ringingInfo.isRinging && (
        <div style={{
          background: 'linear-gradient(90deg, #dc2626 0%, #ea580c 100%)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 8px 24px rgba(220, 38, 38, 0.35)',
          animation: 'ring-pulse 1s infinite alternate'
        }}>
          <style>{`
            @keyframes ring-pulse {
              0% { transform: scale(1); opacity: 1; }
              100% { transform: scale(1.01); opacity: 0.95; }
            }
          `}</style>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🔔</span>
            <div>
              <div style={{ fontWeight: '800', fontSize: '15px', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                New KOT Order Received — Loud Ring Active!
              </div>
              <div style={{ fontSize: '12px', opacity: 0.95 }}>
                Ringing 3-second loud bell ({ringingInfo.remainingCount} ring cycle{ringingInfo.remainingCount > 1 ? 's' : ''} remaining)
              </div>
            </div>
          </div>
          <button
            onClick={() => stopKOTRinging()}
            style={{
              background: 'white',
              color: '#dc2626',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '20px',
              fontWeight: '800',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            <BellOff size={14} /> Stop Alarm
          </button>
        </div>
      )}

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
          {orderMode !== 'DINE_IN' && activeDineInOrdersCount > 0 && (
            <span className="blinking-badge">{activeDineInOrdersCount}</span>
          )}
        </button>
        <button 
          onClick={() => setOrderMode('TAKEAWAY')}
          style={{ display: 'flex', alignItems: 'center', padding: '8px 24px', borderRadius: '20px', border: 'none', background: orderMode === 'TAKEAWAY' ? 'white' : 'transparent', color: orderMode === 'TAKEAWAY' ? '#111' : '#666', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: orderMode === 'TAKEAWAY' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
        >
          Takeaway
          {orderMode !== 'TAKEAWAY' && activeTakeawayOrdersCount > 0 && (
            <span className="blinking-badge">{activeTakeawayOrdersCount}</span>
          )}
        </button>
        <button 
          onClick={() => setOrderMode('DELIVERY')}
          style={{ display: 'flex', alignItems: 'center', padding: '8px 24px', borderRadius: '20px', border: 'none', background: orderMode === 'DELIVERY' ? 'white' : 'transparent', color: orderMode === 'DELIVERY' ? '#111' : '#666', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: orderMode === 'DELIVERY' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
        >
          Delivery
          {orderMode !== 'DELIVERY' && activeDeliveryOrdersCount > 0 && (
            <span className="blinking-badge">{activeDeliveryOrdersCount}</span>
          )}
        </button>
      </div>

      {/* Mobile Header, Search, Tabs, and Grid */}
      <div className="mobile-only-orders" style={{ width: '100%', minWidth: 0, maxWidth: '100%' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', marginTop: '16px', alignItems: 'center' }}>
          <div style={{ flex: 1, background: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', padding: '10px 16px', border: '1px solid #eee' }}>
            <Search size={16} color="#aaa" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Order ID, Customer, Phone..." 
              style={{ border: 'none', outline: 'none', marginLeft: '8px', fontSize: '13px', width: '100%' }} 
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                style={{ border: 'none', background: 'transparent', color: '#999', fontSize: '13px', cursor: 'pointer', padding: '0 4px' }}
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => {
              unlockKOTAudio();
              ringKOTOrders(1);
            }}
            title="Test KOT 3s Loud Ring"
            style={{
              padding: '10px 14px',
              background: ringingInfo.isRinging ? '#fef2f2' : '#fff7ed',
              color: ringingInfo.isRinging ? '#dc2626' : '#ea580c',
              border: ringingInfo.isRinging ? '1px solid #ef4444' : '1px solid #fed7aa',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Bell size={14} className={ringingInfo.isRinging ? 'animate-bounce' : ''} />
            {ringingInfo.isRinging ? 'Ringing...' : 'Test 3s'}
          </button>
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
          }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(order => {
            const paymentInfo = getPaymentDisplayInfo(order);
            const customerDetails = getCustomerDetails(order);
            return (
            <div key={order.order_id} style={{ 
              background: paymentInfo.cardBg, 
              borderRadius: '16px', 
              padding: '14px', 
              border: paymentInfo.cardBorder, 
              borderLeft: paymentInfo.borderLeft,
              boxShadow: paymentInfo.boxShadow,
              display: 'flex', 
              flexDirection: 'column', 
              minWidth: 0,
              marginBottom: '12px'
            }}>
              {/* Header row: Order ID + Payment badge on left, Exact Placed Time & Ago on right */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ color: paymentInfo.orderIdColor, fontWeight: '800', fontSize: '15px' }}>#{order.branch_order_id || order.order_id}</span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: paymentInfo.badgeBg,
                    color: paymentInfo.badgeColor,
                    border: paymentInfo.badgeBorder,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: paymentInfo.themeColor }} />
                    {paymentInfo.badgeText}
                  </span>
                </div>
                
                {/* Placed Time & Relative Elapsed Time */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                  <span style={{ 
                    background: 'white', 
                    color: '#0f172a', 
                    border: '1px solid rgba(0,0,0,0.1)',
                    padding: '2px 8px', 
                    borderRadius: '8px', 
                    fontSize: '11px', 
                    fontWeight: '800',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    whiteSpace: 'nowrap'
                  }} title={`Ordered at ${formatOrderTime(order.created_at)}`}>
                    <Clock size={11} color="#64748b" />
                    {formatOrderTime(order.created_at) || 'Just now'}
                  </span>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>
                    {timeAgo(order.created_at)}
                  </span>
                </div>
              </div>

              {/* Customer Name & Phone Number */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                padding: '6px 10px',
                borderRadius: '10px',
                marginBottom: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#fff7ed',
                    color: '#ea580c',
                    border: '1px solid #fed7aa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <User size={12} />
                  </div>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: '800', 
                    color: '#1e293b', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap' 
                  }}>
                    {customerDetails.name}
                  </span>
                </div>

                {customerDetails.phone && customerDetails.phone !== '-' && (
                  <a
                    href={`tel:${customerDetails.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      background: '#fff7ed',
                      border: '1px solid #fed7aa',
                      color: '#c2410c',
                      fontSize: '11px',
                      fontWeight: '700',
                      textDecoration: 'none',
                      flexShrink: 0,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                    }}
                    title="Call Customer"
                  >
                    <Phone size={10} />
                    <span>{customerDetails.phone}</span>
                  </a>
                )}
              </div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#111', marginBottom: '12px', lineHeight: '1.5', flex: 1 }}>
                {order.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: `1px dashed ${paymentInfo.badgeBorder}`, paddingBottom: '12px' }}>
                <span style={{ fontSize: '11px', color: '#888', fontWeight: '500' }}>
                  {isDelivery(order) ? 'Delivery' : isTakeaway(order) ? 'Takeaway' : `Table ${order.table_number}`}
                </span>
                <span style={{ fontSize: '14px', fontWeight: '800', color: paymentInfo.amountColor }}>₹ {order.total_amount}</span>
              </div>
              {/* Paid / Unpaid verification control */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px',
                borderRadius: '16px',
                background: paymentInfo.isPaid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${paymentInfo.isPaid ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                marginBottom: '10px'
              }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: paymentInfo.isPaid ? '#15803d' : '#b91c1c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: paymentInfo.isPaid ? '#22c55e' : '#ef4444' }} />
                  {paymentInfo.isPaid ? 'PAID' : 'UNPAID'}
                </span>

                <div style={{ display: 'inline-flex', borderRadius: '12px', background: 'white', padding: '2px', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!paymentInfo.isPaid) updatePaymentStatus(order.order_id, true);
                    }}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      border: 'none',
                      fontSize: '10px',
                      fontWeight: '700',
                      cursor: paymentInfo.isPaid ? 'default' : 'pointer',
                      background: paymentInfo.isPaid ? '#16a34a' : 'transparent',
                      color: paymentInfo.isPaid ? 'white' : '#666',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    ✓ Paid
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (paymentInfo.isPaid) updatePaymentStatus(order.order_id, false);
                    }}
                    style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      border: 'none',
                      fontSize: '10px',
                      fontWeight: '700',
                      cursor: !paymentInfo.isPaid ? 'default' : 'pointer',
                      background: !paymentInfo.isPaid ? '#dc2626' : 'transparent',
                      color: !paymentInfo.isPaid ? 'white' : '#666',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    ✕ Unpaid
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <button onClick={() => setSelectedKOTOrder(order)} style={{ flex: 1, padding: '10px 0', background: '#f5f5f5', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: '#888', cursor: 'pointer' }}>Details</button>
                {order.status === 'PENDING' || order.status === 'CONFIRMED' ? (
                  <button onClick={() => updateOrderStatus(order.order_id, 'PREPARING')} style={{ flex: 1, padding: '10px 0', background: '#ff6b35', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: 'white' }}>Start Preparing</button>
                ) : order.status === 'PREPARING' ? (
                  <button onClick={() => updateOrderStatus(order.order_id, 'READY')} style={{ flex: 1, padding: '10px 0', background: '#ffb300', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: 'white' }}>Mark Ready</button>
                ) : order.status === 'READY' ? (
                  <button onClick={() => updateOrderStatus(order.order_id, 'SERVED')} style={{ flex: 1, padding: '10px 0', background: '#2d7a4a', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: 'white' }}>{orderMode === 'TAKEAWAY' ? 'Mark Picked up' : orderMode === 'DELIVERY' ? 'Mark Dispatched' : 'Mark Served'}</button>
                ) : (
                  <button style={{ flex: 1, padding: '10px 0', background: '#eee', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: '#888' }}>{orderMode === 'TAKEAWAY' ? 'Picked up' : orderMode === 'DELIVERY' ? 'Dispatched' : 'Served'}</button>
                )}
              </div>
            </div>
          ); })}
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
                {columnOrders.map(order => {
                  const paymentInfo = getPaymentDisplayInfo(order);
                  return (
                  <div 
                    key={order.order_id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, order.order_id)}
                    style={{
                      background: paymentInfo.cardBg,
                      border: paymentInfo.cardBorder,
                      borderLeft: paymentInfo.borderLeft,
                      borderRadius: '16px',
                      padding: '20px',
                      boxShadow: paymentInfo.boxShadow,
                      cursor: 'grab',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = paymentInfo.hoverBoxShadow;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = paymentInfo.boxShadow;
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '800', fontSize: '15px', color: paymentInfo.orderIdColor }}>#{order.branch_order_id || order.order_id}</span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          background: paymentInfo.badgeBg,
                          color: paymentInfo.badgeColor,
                          border: paymentInfo.badgeBorder,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: paymentInfo.themeColor }} />
                          {paymentInfo.badgeText}
                        </span>
                      </div>

                      {/* Placed Time & Relative Elapsed Time */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                        <span style={{ 
                          fontSize: '11px', 
                          background: 'white', 
                          border: '1px solid rgba(0,0,0,0.1)', 
                          padding: '2px 8px', 
                          borderRadius: '8px',
                          color: '#0f172a',
                          fontWeight: '800',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                          whiteSpace: 'nowrap'
                        }} title={`Ordered at ${formatOrderTime(order.created_at)}`}>
                          <Clock size={11} color="#64748b" />
                          {formatOrderTime(order.created_at) || 'Just now'}
                        </span>
                        <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>
                          {timeAgo(order.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Customer Name & Phone Number */}
                    {(() => {
                      const cust = getCustomerDetails(order);
                      return (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          background: 'rgba(255, 255, 255, 0.85)',
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          padding: '6px 12px',
                          borderRadius: '10px',
                          marginBottom: '14px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                            <div style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              background: '#fff7ed',
                              color: '#ea580c',
                              border: '1px solid #fed7aa',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <User size={12} />
                            </div>
                            <span style={{ 
                              fontSize: '12px', 
                              fontWeight: '800', 
                              color: '#1e293b', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap' 
                            }}>
                              {cust.name}
                            </span>
                          </div>

                          {cust.phone && cust.phone !== '-' && (
                            <a
                              href={`tel:${cust.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                background: '#fff7ed',
                                border: '1px solid #fed7aa',
                                color: '#c2410c',
                                fontSize: '11px',
                                fontWeight: '700',
                                textDecoration: 'none',
                                flexShrink: 0,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                              }}
                              title="Call Customer"
                            >
                              <Phone size={10} />
                              <span>{cust.phone}</span>
                            </a>
                          )}
                        </div>
                      );
                    })()}

                    <div style={{ 
                      fontSize: '13px', 
                      color: 'var(--text-dark)', 
                      fontWeight: '600', 
                      marginBottom: '16px', 
                      lineHeight: '1.6' 
                    }}>
                      {order.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '16px',
                      paddingTop: '8px',
                      borderTop: `1px dashed ${paymentInfo.badgeBorder}`
                    }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        {isDelivery(order) ? 'Delivery' : isTakeaway(order) ? 'Takeaway' : `Table ${order.table_number}`}
                      </span>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: paymentInfo.amountColor }}>₹ {order.total_amount}</span>
                    </div>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      {/* Paid / Unpaid verification control */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: paymentInfo.isPaid ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        border: `1px solid ${paymentInfo.isPaid ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: paymentInfo.isPaid ? '#15803d' : '#b91c1c', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: paymentInfo.isPaid ? '#22c55e' : '#ef4444' }} />
                          Payment: {paymentInfo.isPaid ? 'PAID' : 'UNPAID'}
                        </span>

                        <div style={{ display: 'inline-flex', borderRadius: '14px', background: 'white', padding: '2px', border: '1px solid rgba(0,0,0,0.08)' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!paymentInfo.isPaid) updatePaymentStatus(order.order_id, true);
                            }}
                            style={{
                              padding: '3px 10px',
                              borderRadius: '12px',
                              border: 'none',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: paymentInfo.isPaid ? 'default' : 'pointer',
                              background: paymentInfo.isPaid ? '#16a34a' : 'transparent',
                              color: paymentInfo.isPaid ? 'white' : '#666',
                              transition: 'all 0.15s ease',
                              boxShadow: paymentInfo.isPaid ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                          >
                            ✓ Paid
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (paymentInfo.isPaid) updatePaymentStatus(order.order_id, false);
                            }}
                            style={{
                              padding: '3px 10px',
                              borderRadius: '12px',
                              border: 'none',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: !paymentInfo.isPaid ? 'default' : 'pointer',
                              background: !paymentInfo.isPaid ? '#dc2626' : 'transparent',
                              color: !paymentInfo.isPaid ? 'white' : '#666',
                              transition: 'all 0.15s ease',
                              boxShadow: !paymentInfo.isPaid ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                          >
                            ✕ Unpaid
                          </button>
                        </div>
                      </div>

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
                            {orderMode === 'TAKEAWAY' ? 'Mark Picked up' : orderMode === 'DELIVERY' ? 'Mark Dispatched' : 'Mark Served'}
                          </button>
                        ) : (
                          <button style={{ flex: 1, padding: '8px 0', borderRadius: '24px', border: 'none', background: '#e0e0e0', fontSize: '11px', fontWeight: '600', color: '#666', cursor: 'not-allowed' }}>
                            {orderMode === 'TAKEAWAY' ? 'Picked up' : orderMode === 'DELIVERY' ? 'Dispatched' : 'Completed'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ); })}
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
              <span>Customer</span>
              <span>{getCustomerDetails(selectedKOTOrder).name}</span>
            </div>
            {getCustomerDetails(selectedKOTOrder).phone && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
                <span>Phone</span>
                <span>{getCustomerDetails(selectedKOTOrder).phone}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
              <span>Table</span>
              <span>{isDelivery(selectedKOTOrder) ? 'Delivery' : isTakeaway(selectedKOTOrder) ? 'Takeaway' : `T${selectedKOTOrder.table_number.toString().padStart(2, '0')}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>
              <span>Type</span>
              <span>{isDelivery(selectedKOTOrder) ? 'Delivery' : isTakeaway(selectedKOTOrder) ? 'Takeaway' : 'Dine-In'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13px', fontWeight: '600' }}>
              <span>Payment</span>
              <span style={{ 
                color: getPaymentDisplayInfo(selectedKOTOrder).themeColor, 
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: getPaymentDisplayInfo(selectedKOTOrder).themeColor }} />
                {getPaymentDisplayInfo(selectedKOTOrder).badgeText}
              </span>
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
