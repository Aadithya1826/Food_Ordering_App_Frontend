import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Clock, ChefHat, CheckCircle2, Truck, Search, SlidersHorizontal, Bell, BellOff, Volume2, User, Phone, Copy, Check, MapPin } from 'lucide-react';
import { orderService } from '../services/api';
import { kotAudio, ringKOTOrders, stopKOTRinging, unlockKOTAudio } from '../utils/kotAudio';

const KDS_COLUMNS = [
  { id: 'NEW', title: 'New Orders', icon: Clock, color: '#ff8c42', bg: 'rgba(255, 140, 66, 0.1)', iconBg: '#ff8c42', defaultBg: '#fff' },
  { id: 'HISTORY', title: 'History', icon: CheckCircle2, color: '#2d7a4a', bg: 'rgba(45, 122, 74, 0.1)', iconBg: '#2d7a4a', defaultBg: '#fff' },
];

const isOrderInColumn = (order, columnId) => {
  const status = (order.status || '').toUpperCase();
  if (columnId === 'NEW') {
    return status === 'PENDING' || status === 'CONFIRMED' || status === 'PREPARING';
  }
  if (columnId === 'HISTORY') {
    return status === 'READY' || status === 'SERVED';
  }
  return false;
};

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMobileTab, setActiveMobileTab] = useState('NEW');
  const [selectedKOTOrder, setSelectedKOTOrder] = useState(null);
  const [orderMode, setOrderMode] = useState('ALL'); // 'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'
  const [ringingInfo, setRingingInfo] = useState({ isRinging: false, remainingCount: 0, isUnlocked: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedOrderId, setCopiedOrderId] = useState(null);
  const knownOrderIdsRef = useRef(null);
  const pendingUpdatesRef = useRef(new Map());

  // Copy address to clipboard with fallback for non-secure / webview contexts
  const handleCopyAddress = (textToCopy, orderId) => {
    if (!textToCopy) return;
    const onSuccess = () => {
      setCopiedOrderId(orderId);
      setTimeout(() => setCopiedOrderId(null), 2500);
    };

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy).then(onSuccess).catch(() => {
        fallbackCopy(textToCopy, onSuccess);
      });
    } else {
      fallbackCopy(textToCopy, onSuccess);
    }
  };

  const fallbackCopy = (text, onSuccess) => {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.top = '-9999px';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Subscribe to KOT audio controller state
  useEffect(() => {
    const unsubscribe = kotAudio.subscribe((state) => {
      setRingingInfo(state);
    });
    return () => unsubscribe();
  }, []);

  // Unlock AudioContext and HTML5 Audio on ANY user interaction with the page (required by iOS/Android)
  useEffect(() => {
    const handleInteraction = () => {
      unlockKOTAudio().catch(() => {});
    };

    const events = ['click', 'touchstart', 'touchend', 'pointerdown'];
    events.forEach(ev => window.addEventListener(ev, handleInteraction, { passive: true }));
    return () => {
      events.forEach(ev => window.removeEventListener(ev, handleInteraction));
    };
  }, []);

  const isDelivery = (order) => {
    if (!order) return false;
    const type = (order.order_type || '').toLowerCase();
    if (type === 'delivery' || type.includes('deliv')) return true;
    if (order.delivery_address || order.delivery_address_snapshot) return true;
    return false;
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
  const fetchOrders = useCallback(async () => {
    try {
      const data = await orderService.getLiveOrders();
      let currentOrders = Array.isArray(data) ? data : [];
      
      // Preserve active optimistic updates so polling never reverts in-flight user actions
      if (pendingUpdatesRef.current.size > 0) {
        currentOrders = currentOrders.map(o => {
          const pendingStatus = pendingUpdatesRef.current.get(o.order_id);
          if (pendingStatus) {
            return { ...o, status: pendingStatus };
          }
          return o;
        });
      }

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
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 2000); // Fast live polling every 2s for instant reflection

    const handleVoiceNav = (e) => {
      if (e.detail && e.detail.tab) {
        const tabStr = e.detail.tab.toUpperCase();
        const tabMap = {
          'PENDING': 'NEW', 'NEW ORDERS': 'NEW', 'NEW': 'NEW',
          'PREPARING': 'NEW',
          'READY': 'HISTORY', 'READY TO SERVE': 'HISTORY', 'HISTORY': 'HISTORY',
          'SERVED': 'HISTORY'
        };
        const mappedTab = tabMap[tabStr] || tabStr;
        setActiveMobileTab(mappedTab);
      }
    };
    window.addEventListener('navigate-orders-tab', handleVoiceNav);

    let channel = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('udipi_kds_sync_channel');
        channel.onmessage = () => {
          fetchOrders();
        };
      } catch (e) {}
    }

    const handleStorage = (e) => {
      if (e.key === 'kds_instant_sync_ping') {
        fetchOrders();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('navigate-orders-tab', handleVoiceNav);
      window.removeEventListener('storage', handleStorage);
      if (channel) channel.close();
    };
  }, [fetchOrders]);

  const updateOrderStatus = useCallback((orderId, newStatus) => {
    if (!orderId) return;

    // Record optimistic status in cache
    pendingUpdatesRef.current.set(orderId, newStatus);

    // 1. INSTANT 0ms synchronous UI update (guarantees instantaneous reaction on click)
    setOrders(current =>
      current.map(o => (o.order_id === orderId ? { ...o, status: newStatus } : o))
    );

    // 2. Non-blocking asynchronous network update in background (zero latency for user)
    orderService.updateOrderStatus(orderId, newStatus)
      .then(() => {
        // Shield against any race condition with background polling for 5 seconds
        setTimeout(() => {
          pendingUpdatesRef.current.delete(orderId);
        }, 5000);
      })
      .catch((err) => {
        console.error('Error updating order status:', err);
        pendingUpdatesRef.current.delete(orderId);
        // Only re-fetch if the server explicitly rejected the update
        fetchOrders();
      });
  }, [fetchOrders]);

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

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    const orderId = parseInt(e.dataTransfer.getData('orderId'), 10);
    if (!orderId) return;

    const order = orders.find(o => o.order_id === orderId);
    if (order) {
      if (targetColumnId === 'NEW' && (order.status === 'READY' || order.status === 'SERVED')) {
        updateOrderStatus(orderId, 'PREPARING');
      } else if (targetColumnId === 'HISTORY' && (order.status === 'PENDING' || order.status === 'CONFIRMED' || order.status === 'PREPARING')) {
        updateOrderStatus(orderId, 'READY');
      }
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
    const rawDelivery = order?.delivery_address || order?.delivery_address_snapshot || order?.address;
    if (rawDelivery) {
      if (typeof rawDelivery === 'string') {
        const trimmed = rawDelivery.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            deliveryObj = JSON.parse(trimmed);
          } catch (e) {
            deliveryObj = null;
          }
        }
      } else if (typeof rawDelivery === 'object' && rawDelivery !== null) {
        deliveryObj = rawDelivery;
      }
    }

    if (deliveryObj) {
      if (!name || name === 'Guest' || name === phone || name === 'None' || name === 'Delivery Guest') {
        const addrName = deliveryObj.contact_name || deliveryObj.name;
        if (addrName) name = addrName.trim();
      }
      if (!phone || phone === '-') {
        const addrPhone = deliveryObj.contact_phone || deliveryObj.phone;
        if (addrPhone) phone = addrPhone.trim();
      }
    }

    if (!name || name === 'None') {
      if (phone && phone !== '-') {
        name = 'Customer';
      } else if (order?.table_number && !isTakeaway(order) && !isDelivery(order)) {
        name = `Table ${order.table_number}`;
      } else {
        name = isTakeaway(order) ? 'Takeaway Guest' : isDelivery(order) ? 'Delivery Guest' : 'Guest';
      }
    }

    return { name, phone };
  };

  // Helper to extract comprehensive delivery details for delivery orders
  const getDeliveryDetails = (order) => {
    if (!order) return null;

    const raw = order.delivery_address || order.delivery_address_snapshot || order.address || null;
    let parsed = null;
    let rawString = '';

    if (raw) {
      if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            parsed = JSON.parse(trimmed);
          } catch (e) {
            parsed = null;
            rawString = trimmed;
          }
        } else {
          rawString = trimmed;
        }
      } else if (typeof raw === 'object' && raw !== null) {
        parsed = raw;
      }
    }

    // Customer Name & Phone
    let name = (order.customer_name || '').trim();
    if (!name || name === 'Guest' || name === 'None' || name === 'Delivery Guest') {
      name = (parsed?.contact_name || parsed?.name || '').trim();
    }
    if (!name) name = 'Delivery Customer';

    let phone = (order.customer_phone || '').trim();
    if (!phone || phone === '-') {
      phone = (parsed?.contact_phone || parsed?.phone || '').trim();
    }

    // Full Address
    let fullAddress = '';
    if (parsed) {
      if (typeof parsed.full_address === 'string' && parsed.full_address.trim()) {
        fullAddress = parsed.full_address.trim();
      } else if (typeof parsed.address === 'string' && parsed.address.trim()) {
        fullAddress = parsed.address.trim();
      } else {
        const parts = [
          parsed.flat_house_no,
          parsed.floor ? `Floor ${parsed.floor}` : '',
          parsed.building_apartment_name,
          parsed.landmark ? `Near ${parsed.landmark}` : '',
          parsed.city,
          parsed.state,
          parsed.pincode
        ].filter(Boolean);
        if (parts.length > 0) {
          fullAddress = parts.join(', ');
        }
      }
    }
    if (!fullAddress && rawString) {
      fullAddress = rawString;
    }

    const landmark = (parsed?.landmark || '').trim();
    const addressType = (parsed?.address_type || parsed?.type || '').trim();
    const instructions = (
      order.delivery_instructions || 
      parsed?.delivery_instructions || 
      parsed?.instructions || 
      order.notes || 
      ''
    ).trim();
    const deliveryFee = order.delivery_fee != null ? order.delivery_fee : (parsed?.delivery_fee != null ? parsed.delivery_fee : null);
    const deliveryStatus = order.delivery_status || parsed?.delivery_status || null;

    let copyableAddress = fullAddress || '';
    if (landmark && !copyableAddress.toLowerCase().includes(landmark.toLowerCase())) {
      copyableAddress = copyableAddress ? `${copyableAddress}, Landmark: ${landmark}` : `Landmark: ${landmark}`;
    }

    return {
      name,
      phone,
      fullAddress,
      copyableAddress: copyableAddress.trim(),
      landmark,
      addressType,
      instructions,
      deliveryFee,
      deliveryStatus,
      rawObj: parsed
    };
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

  const currentColumns = KDS_COLUMNS;
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesMode = orderMode === 'ALL' ? true : orderMode === 'TAKEAWAY' ? isTakeaway(order) : orderMode === 'DELIVERY' ? isDelivery(order) : isDineIn(order);
      if (!matchesMode) return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      const orderIdStr = (order.order_id || '').toString().toLowerCase();
      const branchOrderIdStr = (order.branch_order_id || '').toString().toLowerCase();
      const billNoStr = (order.bill_no || '').toString().toLowerCase();
      const cust = getCustomerDetails(order);
      const nameMatch = cust.name.toLowerCase().includes(term);
      const phoneMatch = cust.phone.toLowerCase().includes(term);
      const itemsMatch = order.items && order.items.some(i => (i.name || '').toLowerCase().includes(term));
      const tableMatch = (order.table_number || '').toString().toLowerCase().includes(term);
      return orderIdStr.includes(term) || branchOrderIdStr.includes(term) || billNoStr.includes(term) || nameMatch || phoneMatch || itemsMatch || tableMatch;
    });
  }, [orders, orderMode, searchTerm]);
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

      {/* Mobile & Tablet Audio Activation Prompt */}
      {!ringingInfo.isUnlocked && (
        <div 
          onClick={async () => {
            await unlockKOTAudio();
            ringKOTOrders(1);
          }}
          style={{
            background: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 100%)',
            color: 'white',
            padding: '12px 18px',
            borderRadius: '16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(37, 99, 235, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>🔊</span>
            <div>
              <div style={{ fontWeight: '800', fontSize: '14px', letterSpacing: '0.2px' }}>
                Tap Anywhere to Enable Loud Order Audio Alerts
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                Required on mobile phones & tablets (iPhone, iPad, Samsung, Vivo, Oppo) so incoming orders ring loudly
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              await unlockKOTAudio();
              ringKOTOrders(1);
            }}
            style={{
              background: 'white',
              color: '#1d4ed8',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '20px',
              fontWeight: '800',
              fontSize: '12px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            🔔 Enable & Test
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
        @media print {
          body * {
            visibility: hidden;
          }
          .kot-ticket-content, .kot-ticket-content * {
            visibility: visible;
          }
          .kot-modal-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: transparent !important;
            padding: 0 !important;
          }
          .kot-ticket-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
          .kot-ticket-content button,
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', padding: '4px', background: 'rgba(0,0,0,0.04)', borderRadius: '24px', width: 'fit-content' }}>
        <button 
          onClick={() => setOrderMode('ALL')}
          style={{ display: 'flex', alignItems: 'center', padding: '8px 24px', borderRadius: '20px', border: 'none', background: orderMode === 'ALL' ? 'white' : 'transparent', color: orderMode === 'ALL' ? '#111' : '#666', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: orderMode === 'ALL' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', transition: 'all 0.2s' }}
        >
          All Orders
          {orderMode !== 'ALL' && (activeDineInOrdersCount + activeTakeawayOrdersCount + activeDeliveryOrdersCount) > 0 && (
            <span className="blinking-badge">{activeDineInOrdersCount + activeTakeawayOrdersCount + activeDeliveryOrdersCount}</span>
          )}
        </button>
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
            const count = filteredOrders.filter(o => isOrderInColumn(o, column.id)).length;
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
                  flex: 1,
                  justifyContent: 'center'
                }}
              >
                <Icon size={15} color={isActive ? 'white' : column.color} />
                <span style={{ fontSize: '13px', fontWeight: '800', color: isActive ? 'white' : '#111' }}>{column.title}</span>
                {count > 0 && (
                  <span style={{ background: isActive ? '#333' : '#eee', color: isActive ? 'white' : '#111', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '800' }}>{count}</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="manager-orders-grid" style={{ paddingTop: '8px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
          {filteredOrders.filter(o => isOrderInColumn(o, activeMobileTab)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(order => {
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
              {/* Header: Centered Extra-Large Bill Number & Time Below */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '12px', 
                gap: '6px' 
              }}>
                <span style={{
                  fontSize: '24px',
                  fontWeight: '900',
                  letterSpacing: '0.5px',
                  padding: '4px 16px',
                  borderRadius: '10px',
                  background: paymentInfo.isPaid ? '#dcfce7' : '#fee2e2',
                  color: paymentInfo.isPaid ? '#14532d' : '#991b1b',
                  border: `2px solid ${paymentInfo.isPaid ? '#86efac' : '#fca5a5'}`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}>
                  Bill #{order.bill_no || order.branch_order_id || order.order_id}
                </span>

                {/* Placed Time & Relative Elapsed Time below Bill Number */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ 
                    background: 'white', 
                    color: '#0f172a', 
                    border: '1px solid rgba(0,0,0,0.15)',
                    padding: '2px 10px', 
                    borderRadius: '8px', 
                    fontSize: '12px', 
                    fontWeight: '900',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    whiteSpace: 'nowrap'
                  }} title={`Ordered at ${formatOrderTime(order.created_at)}`}>
                    <Clock size={12} color="#334155" />
                    {formatOrderTime(order.created_at) || 'Just now'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#475569', fontWeight: '800' }}>
                    {timeAgo(order.created_at)}
                  </span>
                  {order.status === 'PREPARING' && (
                    <span style={{
                      background: '#fef3c7',
                      color: '#b45309',
                      border: '1px solid #fcd34d',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '900',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <ChefHat size={11} color="#b45309" />
                      Preparing
                    </span>
                  )}
                  {order.status === 'READY' && (
                    <span style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      border: '1px solid #86efac',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '900',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <CheckCircle2 size={11} color="#15803d" />
                      Ready
                    </span>
                  )}
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
                    fontSize: '13px', 
                    fontWeight: '900', 
                    color: '#0f172a', 
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
                      fontSize: '12px',
                      fontWeight: '800',
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

              {/* Delivery Address snippet with 1-click Copy */}
              {isDelivery(order) && (() => {
                const dDetails = getDeliveryDetails(order);
                if (!dDetails || !dDetails.fullAddress) return null;
                const isCardCopied = copiedOrderId === (order.order_id || order.id);
                return (
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '6px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '5px 8px',
                      marginBottom: '10px',
                      fontSize: '11px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, flex: 1 }}>
                      <MapPin size={11} color="#ea580c" style={{ flexShrink: 0 }} />
                      <span 
                        style={{ 
                          color: '#334155', 
                          fontWeight: '700', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap' 
                        }}
                        title={dDetails.fullAddress}
                      >
                        {dDetails.fullAddress}
                      </span>
                    </div>
                    <button
                      type="button"
                      draggable={false}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyAddress(dDetails.copyableAddress || dDetails.fullAddress, order.order_id || order.id);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        background: isCardCopied ? '#dcfce7' : '#ffffff',
                        border: isCardCopied ? '1px solid #86efac' : '1px solid #cbd5e1',
                        color: isCardCopied ? '#15803d' : '#334155',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        flexShrink: 0,
                        touchAction: 'manipulation',
                        userSelect: 'none'
                      }}
                      title="Copy delivery address"
                    >
                      {isCardCopied ? <Check size={10} /> : <Copy size={10} />}
                      <span>{isCardCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                );
              })()}

              <div style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '12px', lineHeight: '1.5', flex: 1 }}>
                {order.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: `1px dashed ${paymentInfo.badgeBorder}`, paddingBottom: '12px' }}>
                <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '800' }}>
                  {isDelivery(order) ? 'Delivery' : isTakeaway(order) ? 'Takeaway' : `Table ${order.table_number}`}
                </span>
                <span style={{ fontSize: '16px', fontWeight: '900', color: paymentInfo.amountColor }}>₹ {order.total_amount}</span>
              </div>

              <div 
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
              >
                <button 
                  type="button"
                  draggable={false}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); setSelectedKOTOrder(order); }}
                  style={{ flex: 1, padding: '10px 0', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '20px', fontSize: '12px', fontWeight: '800', color: '#334155', cursor: 'pointer', touchAction: 'manipulation', userSelect: 'none' }}
                >
                  Details
                </button>
                {order.status === 'PENDING' || order.status === 'CONFIRMED' ? (
                  <button 
                    type="button"
                    draggable={false}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.order_id, 'PREPARING'); }}
                    style={{ flex: 1.5, padding: '10px 0', background: '#ff6b35', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: '800', color: 'white', cursor: 'pointer', boxShadow: '0 2px 6px rgba(255,107,53,0.3)', touchAction: 'manipulation', userSelect: 'none' }}
                  >
                    Accept & Start Preparing
                  </button>
                ) : order.status === 'PREPARING' ? (
                  <button 
                    type="button"
                    draggable={false}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.order_id, 'READY'); }}
                    style={{ flex: 1.5, padding: '10px 0', background: '#16a34a', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: '800', color: 'white', cursor: 'pointer', boxShadow: '0 2px 6px rgba(22,163,74,0.3)', touchAction: 'manipulation', userSelect: 'none' }}
                  >
                    ✓ Mark Ready
                  </button>
                ) : order.status === 'READY' ? (
                  <button 
                    type="button"
                    draggable={false}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.order_id, 'SERVED'); }}
                    style={{ flex: 1.5, padding: '10px 0', background: '#2563eb', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: '800', color: 'white', cursor: 'pointer', touchAction: 'manipulation', userSelect: 'none' }}
                  >
                    {orderMode === 'TAKEAWAY' ? 'Mark Picked up' : orderMode === 'DELIVERY' ? 'Mark Dispatched' : 'Mark Served'}
                  </button>
                ) : (
                  <button 
                    type="button"
                    disabled
                    style={{ flex: 1.5, padding: '10px 0', background: '#e2e8f0', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: '800', color: '#64748b', cursor: 'not-allowed', touchAction: 'manipulation', userSelect: 'none' }}
                  >
                    {orderMode === 'TAKEAWAY' ? 'Picked up' : orderMode === 'DELIVERY' ? 'Dispatched' : 'Served'}
                  </button>
                )}
              </div>
            </div>
          ); })}
        </div>
      </div>

      <div className="desktop-only" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '24px', flex: 1, paddingBottom: '16px' }}>
        {currentColumns.map(column => {
          const columnOrders = filteredOrders
            .filter(o => isOrderInColumn(o, column.id))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          const Icon = column.icon;

          return (
            <div 
              key={column.id} 
              style={{ 
                minWidth: 0, 
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
                    {/* Header: Centered Extra-Large Bill Number & Time Below */}
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      marginBottom: '14px', 
                      gap: '6px' 
                    }}>
                      <span style={{
                        fontSize: '24px',
                        fontWeight: '900',
                        letterSpacing: '0.5px',
                        padding: '4px 16px',
                        borderRadius: '10px',
                        background: paymentInfo.isPaid ? '#dcfce7' : '#fee2e2',
                        color: paymentInfo.isPaid ? '#14532d' : '#991b1b',
                        border: `2px solid ${paymentInfo.isPaid ? '#86efac' : '#fca5a5'}`,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center'
                      }}>
                        Bill #{order.bill_no || order.branch_order_id || order.order_id}
                      </span>

                      {/* Placed Time & Relative Elapsed Time below Bill Number */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ 
                          fontSize: '12px', 
                          background: 'white', 
                          border: '1px solid rgba(0,0,0,0.15)', 
                          padding: '2px 10px', 
                          borderRadius: '8px',
                          color: '#0f172a',
                          fontWeight: '900',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                          whiteSpace: 'nowrap'
                        }} title={`Ordered at ${formatOrderTime(order.created_at)}`}>
                          <Clock size={12} color="#334155" />
                          {formatOrderTime(order.created_at) || 'Just now'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#475569', fontWeight: '800' }}>
                          {timeAgo(order.created_at)}
                        </span>
                        {order.status === 'PREPARING' && (
                          <span style={{
                            background: '#fef3c7',
                            color: '#b45309',
                            border: '1px solid #fcd34d',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '900',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <ChefHat size={11} color="#b45309" />
                            Preparing
                          </span>
                        )}
                        {order.status === 'READY' && (
                          <span style={{
                            background: '#dcfce7',
                            color: '#15803d',
                            border: '1px solid #86efac',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '900',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <CheckCircle2 size={11} color="#15803d" />
                            Ready
                          </span>
                        )}
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
                              fontSize: '13px', 
                              fontWeight: '900', 
                              color: '#0f172a', 
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
                                fontSize: '12px',
                                fontWeight: '800',
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

                    {/* Delivery Address snippet with 1-click Copy */}
                    {isDelivery(order) && (() => {
                      const dDetails = getDeliveryDetails(order);
                      if (!dDetails || !dDetails.fullAddress) return null;
                      const isCardCopied = copiedOrderId === (order.order_id || order.id);
                      return (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '6px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            marginBottom: '12px',
                            fontSize: '11px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, flex: 1 }}>
                            <MapPin size={11} color="#ea580c" style={{ flexShrink: 0 }} />
                            <span 
                              style={{ 
                                color: '#334155', 
                                fontWeight: '700', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                whiteSpace: 'nowrap' 
                              }}
                              title={dDetails.fullAddress}
                            >
                              {dDetails.fullAddress}
                            </span>
                          </div>
                          <button
                            type="button"
                            draggable={false}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyAddress(dDetails.copyableAddress || dDetails.fullAddress, order.order_id || order.id);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              background: isCardCopied ? '#dcfce7' : '#ffffff',
                              border: isCardCopied ? '1px solid #86efac' : '1px solid #cbd5e1',
                              color: isCardCopied ? '#15803d' : '#334155',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '800',
                              cursor: 'pointer',
                              flexShrink: 0,
                              touchAction: 'manipulation',
                              userSelect: 'none'
                            }}
                            title="Copy delivery address"
                          >
                            {isCardCopied ? <Check size={10} /> : <Copy size={10} />}
                            <span>{isCardCopied ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      );
                    })()}

                    <div style={{ 
                      fontSize: '14px', 
                      color: '#0f172a', 
                      fontWeight: '800', 
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
                      <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: '800' }}>
                        {isDelivery(order) ? 'Delivery' : isTakeaway(order) ? 'Takeaway' : `Table ${order.table_number}`}
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: '900', color: paymentInfo.amountColor }}>₹ {order.total_amount}</span>
                    </div>

                    <div 
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
                    >
                      <button 
                        type="button"
                        draggable={false}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedKOTOrder(order);
                        }} 
                        style={{ flex: 1, padding: '10px 0', borderRadius: '24px', border: '1px solid #cbd5e1', background: '#f8fafc', fontSize: '12px', fontWeight: '800', color: '#334155', cursor: 'pointer', touchAction: 'manipulation', userSelect: 'none' }}
                      >
                        Details
                      </button>
                      
                      {order.status === 'PENDING' || order.status === 'CONFIRMED' ? (
                        <button 
                          type="button"
                          draggable={false}
                          onMouseDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.order_id, 'PREPARING');
                          }} 
                          style={{ flex: 1.5, padding: '10px 0', borderRadius: '24px', border: 'none', background: '#ff6b35', fontSize: '12px', fontWeight: '800', color: '#fff', cursor: 'pointer', boxShadow: '0 2px 6px rgba(255,107,53,0.3)', touchAction: 'manipulation', userSelect: 'none' }}
                        >
                          Accept & Start Preparing
                        </button>
                      ) : order.status === 'PREPARING' ? (
                        <button 
                          type="button"
                          draggable={false}
                          onMouseDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.order_id, 'READY');
                          }} 
                          style={{ flex: 1.5, padding: '10px 0', borderRadius: '24px', border: 'none', background: '#16a34a', fontSize: '12px', fontWeight: '800', color: '#fff', cursor: 'pointer', boxShadow: '0 2px 6px rgba(22,163,74,0.3)', touchAction: 'manipulation', userSelect: 'none' }}
                        >
                          ✓ Mark Ready
                        </button>
                      ) : order.status === 'READY' ? (
                        <button 
                          type="button"
                          draggable={false}
                          onMouseDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.order_id, 'SERVED');
                          }} 
                          style={{ flex: 1.5, padding: '10px 0', borderRadius: '24px', border: 'none', background: '#2563eb', fontSize: '12px', fontWeight: '800', color: '#fff', cursor: 'pointer', touchAction: 'manipulation', userSelect: 'none' }}
                        >
                          {orderMode === 'TAKEAWAY' ? 'Mark Picked up' : orderMode === 'DELIVERY' ? 'Mark Dispatched' : 'Mark Served'}
                        </button>
                      ) : (
                        <button 
                          type="button"
                          disabled
                          style={{ flex: 1.5, padding: '10px 0', borderRadius: '24px', border: 'none', background: '#e2e8f0', fontSize: '12px', fontWeight: '800', color: '#64748b', cursor: 'not-allowed', touchAction: 'manipulation', userSelect: 'none' }}
                        >
                          {orderMode === 'TAKEAWAY' ? 'Picked up' : orderMode === 'DELIVERY' ? 'Dispatched' : 'Completed'}
                        </button>
                      )}
                    </div>
                  </div>
                ); })}
              </div>
            </div>
          );
        })}
      </div>

      {/* KOT Modal */}
      {selectedKOTOrder && (() => {
        const isDeliv = isDelivery(selectedKOTOrder);
        const delivInfo = isDeliv ? getDeliveryDetails(selectedKOTOrder) : null;
        const custDetails = getCustomerDetails(selectedKOTOrder);
        const customerName = (isDeliv && delivInfo?.name) ? delivInfo.name : custDetails.name;
        const customerPhone = (isDeliv && delivInfo?.phone) ? delivInfo.phone : custDetails.phone;
        const isTicketCopied = copiedOrderId === (selectedKOTOrder.order_id || selectedKOTOrder.id);

        return (
          <div 
            className="kot-modal-overlay"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} 
            onClick={() => setSelectedKOTOrder(null)}
          >
            <div 
              className="kot-ticket-content"
              style={{ background: '#f8f9fa', padding: '28px 22px', borderRadius: '12px', maxWidth: '380px', width: '100%', fontFamily: 'monospace', color: 'black', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #e2e8f0' }} 
              onClick={e => e.stopPropagation()}
            >
              <div style={{ textAlign: 'center', fontWeight: '900', fontSize: '17px', letterSpacing: '2px', marginBottom: '6px' }}>KITCHEN ORDER TICKET</div>
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', letterSpacing: '4px', color: '#64748b', marginBottom: '14px' }}>* * * KOT * * *</div>
              
              {/* Prominent Verification Box: Highlighted Bill No */}
              <div style={{ borderTop: '1px dashed #aaa', margin: '10px 0' }}></div>
              <div style={{ margin: '12px 0' }}>
                <div style={{ textAlign: 'center', padding: '12px 8px', background: '#f0fdf4', borderRadius: '10px', border: '2px solid #86efac', boxShadow: '0 2px 6px rgba(34,197,94,0.15)' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Bill Number</div>
                  <div style={{ fontSize: '28px', fontWeight: '900', color: '#15803d', letterSpacing: '0.5px' }}>
                    {selectedKOTOrder.bill_no ? `#${selectedKOTOrder.bill_no}` : `#${selectedKOTOrder.branch_order_id || selectedKOTOrder.order_id}`}
                  </div>
                </div>
              </div>
              
              <div style={{ borderTop: '1px dashed #aaa', margin: '12px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', fontWeight: '800' }}>
                <span>Bill Number</span>
                <span style={{ fontWeight: '900', color: '#15803d', background: '#ecfdf5', padding: '2px 8px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                  {selectedKOTOrder.bill_no ? `#${selectedKOTOrder.bill_no}` : `#${selectedKOTOrder.branch_order_id || selectedKOTOrder.order_id}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '800' }}>
                <span>Date</span>
                <span style={{ fontWeight: '800' }}>{new Date(selectedKOTOrder.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '800' }}>
                <span>Time</span>
                <span style={{ fontWeight: '800' }}>{new Date(selectedKOTOrder.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '800' }}>
                <span>Customer</span>
                <span style={{ fontWeight: '900' }}>{customerName}</span>
              </div>
              {customerPhone && customerPhone !== '-' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '800' }}>
                  <span>Phone</span>
                  <span style={{ fontWeight: '800' }}>{customerPhone}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontWeight: '800' }}>
                <span>Table</span>
                <span style={{ fontWeight: '900' }}>{isDeliv ? 'Delivery' : isTakeaway(selectedKOTOrder) ? 'Takeaway' : `T${selectedKOTOrder.table_number.toString().padStart(2, '0')}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13px', fontWeight: '800' }}>
                <span>Type</span>
                <span style={{ 
                  fontWeight: '900',
                  color: isDeliv ? '#c2410c' : 'inherit',
                  background: isDeliv ? '#ffedd5' : 'transparent',
                  padding: isDeliv ? '2px 8px' : '0',
                  borderRadius: isDeliv ? '4px' : '0'
                }}>
                  {isDeliv ? '🛵 DELIVERY' : isTakeaway(selectedKOTOrder) ? 'Takeaway' : 'Dine-In'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13px', fontWeight: '800' }}>
                <span>Payment</span>
                <span style={{ 
                  color: getPaymentDisplayInfo(selectedKOTOrder).themeColor, 
                  fontWeight: '900',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: getPaymentDisplayInfo(selectedKOTOrder).themeColor }} />
                  {getPaymentDisplayInfo(selectedKOTOrder).badgeText}
                </span>
              </div>

              {/* EXTRA DELIVERY DETAILS SECTION (Included when delivery orders are placed) */}
              {isDeliv && delivInfo && (
                <div style={{
                  background: '#ffffff',
                  border: '2px solid #0f172a',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                  {/* Delivery section header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px dashed #94a3b8',
                    paddingBottom: '8px',
                    marginBottom: '10px'
                  }}>
                    <span style={{
                      fontWeight: '900',
                      fontSize: '13px',
                      letterSpacing: '1px',
                      color: '#c2410c'
                    }}>
                      🛵 DELIVERY DETAILS
                    </span>
                    {delivInfo.addressType && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '800',
                        background: '#ffedd5',
                        color: '#9a3412',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {delivInfo.addressType}
                      </span>
                    )}
                  </div>

                  {/* Customer Name */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                    <span style={{ color: '#475569', fontWeight: '700' }}>Customer:</span>
                    <span style={{ fontWeight: '900', color: '#0f172a', textAlign: 'right' }}>
                      {customerName}
                    </span>
                  </div>

                  {/* Phone Number with Click-to-Call */}
                  {customerPhone && customerPhone !== '-' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '13px' }}>
                      <span style={{ color: '#475569', fontWeight: '700' }}>Phone:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '900', color: '#0f172a' }}>{customerPhone}</span>
                        <a
                          href={`tel:${customerPhone}`}
                          className="no-print"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#ffedd5',
                            color: '#c2410c',
                            border: '1px solid #fdba74',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            textDecoration: 'none'
                          }}
                          title="Call Customer"
                        >
                          <Phone size={10} />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Delivery Address Box with Prominent Copy Button */}
                  <div style={{
                    marginTop: '8px',
                    padding: '10px',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px'
                    }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        📍 Address:
                      </span>
                      <button
                        type="button"
                        className="no-print"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyAddress(delivInfo.copyableAddress || delivInfo.fullAddress, selectedKOTOrder.order_id || selectedKOTOrder.id);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          background: isTicketCopied ? '#16a34a' : '#ff6b35',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                        title="Click to copy delivery address"
                      >
                        {isTicketCopied ? <Check size={12} /> : <Copy size={12} />}
                        <span>{isTicketCopied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>

                    <div style={{
                      fontSize: '13px',
                      fontWeight: '800',
                      color: '#0f172a',
                      lineHeight: '1.45',
                      wordBreak: 'break-word',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {delivInfo.fullAddress || 'No address provided'}
                    </div>

                    {delivInfo.landmark && (
                      <div style={{ marginTop: '6px', fontSize: '12px', color: '#475569', fontWeight: '700' }}>
                        <span style={{ color: '#64748b' }}>Landmark: </span>
                        <span>{delivInfo.landmark}</span>
                      </div>
                    )}
                  </div>

                  {/* Delivery Instructions */}
                  {delivInfo.instructions && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 10px',
                      background: '#fffbeb',
                      borderRadius: '6px',
                      border: '1px solid #fef3c7',
                      fontSize: '12px'
                    }}>
                      <span style={{ fontWeight: '800', color: '#b45309' }}>📌 Instructions: </span>
                      <span style={{ fontStyle: 'italic', color: '#92400e', fontWeight: '700' }}>
                        {delivInfo.instructions}
                      </span>
                    </div>
                  )}

                  {/* Delivery Status & Fee */}
                  {(delivInfo.deliveryStatus || delivInfo.deliveryFee != null) && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '8px',
                      paddingTop: '6px',
                      borderTop: '1px dashed #cbd5e1',
                      fontSize: '12px'
                    }}>
                      {delivInfo.deliveryStatus && (
                        <span>
                          <span style={{ color: '#64748b', fontWeight: '700' }}>Status: </span>
                          <span style={{ fontWeight: '800', color: '#0369a1' }}>{delivInfo.deliveryStatus}</span>
                        </span>
                      )}
                      {delivInfo.deliveryFee != null && (
                        <span style={{ marginLeft: 'auto' }}>
                          <span style={{ color: '#64748b', fontWeight: '700' }}>Fee: </span>
                          <span style={{ fontWeight: '800' }}>₹{delivInfo.deliveryFee}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div style={{ borderTop: '1px dashed #aaa', margin: '12px 0' }}></div>
              <div style={{ display: 'flex', gap: '16px', fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ width: '32px' }}>QTY</span>
                <span>ITEM</span>
              </div>
              <div style={{ borderTop: '1px dashed #aaa', margin: '12px 0' }}></div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', fontSize: '14px' }}>
                {selectedKOTOrder.items && selectedKOTOrder.items.map((item, idx) => {
                  const isCancelled = (item.status || '').toUpperCase() === 'CANCELLED';
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '16px', opacity: isCancelled ? 0.5 : 1 }}>
                      <span style={{ width: '32px', fontWeight: 'bold', textDecoration: isCancelled ? 'line-through' : 'none' }}>{item.quantity}</span>
                      <span style={{ fontWeight: 'bold', textDecoration: isCancelled ? 'line-through' : 'none', color: isCancelled ? '#dc2626' : 'inherit' }}>
                        {item.item_name?.toUpperCase() || item.name?.toUpperCase() || `ITEM #${item.item_id}`}
                        {isCancelled && <span style={{ marginLeft: '8px', color: '#dc2626', fontSize: '11px', background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>CANCELLED</span>}
                      </span>
                    </div>
                  );
                })}
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
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  onClick={() => window.print()}
                  style={{ flex: 1, padding: '12px', background: '#ff6b35', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  🖨️ PRINT KOT
                </button>
                <button 
                  onClick={() => setSelectedKOTOrder(null)}
                  style={{ flex: 1, padding: '12px', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', fontFamily: 'sans-serif' }}
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default OrdersManagement;
