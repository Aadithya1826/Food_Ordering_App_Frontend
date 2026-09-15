import React, { useState, useEffect } from 'react';

const OrderHistoryModal = ({ show, setShow, api, user, onShowBill }) => {
  const [historyDate, setHistoryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    if (show) {
      fetchOrders();
    }
  }, [show, historyDate]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/orders?date=${historyDate}&restaurant_id=${user?.restaurant_id || ''}`);
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        width: '90%', maxWidth: '600px', backgroundColor: 'white', borderRadius: '12px', padding: '24px',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Order History</h2>
          <button onClick={() => setShow(false)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <label style={{ marginRight: '12px', fontWeight: 'bold' }}>Select Date: </label>
          <input 
            type="date" 
            value={historyDate} 
            onChange={(e) => setHistoryDate(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '8px', fontWeight: 'bold', color: '#4b5563', fontSize: '14px', marginBottom: '8px' }}>
          <div style={{ flex: 1 }}>Bill No</div>
          <div style={{ flex: 2 }}>Time</div>
          <div style={{ flex: 1 }}>Total (₹)</div>
          <div style={{ width: '80px', textAlign: 'center' }}>Action</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>Loading...</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontStyle: 'italic' }}>No orders found for this date.</div>
          ) : (
            orders.map(order => {
              const isExpanded = expandedOrderId === order.order_id;
              const orderTime = new Date(order.created_at + 'Z').toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={order.order_id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '8px', overflow: 'hidden' }}>
                  <div 
                    onClick={() => setExpandedOrderId(isExpanded ? null : order.order_id)}
                    style={{ display: 'flex', padding: '12px', alignItems: 'center', cursor: 'pointer', backgroundColor: 'white' }}
                  >
                    <div style={{ flex: 1, fontWeight: 'bold' }}>#{order.order_id}</div>
                    <div style={{ flex: 2 }}>{orderTime}</div>
                    <div style={{ flex: 1, color: '#16a34a', fontWeight: 'bold' }}>₹{order.total_amount?.toFixed(2)}</div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); if (onShowBill) onShowBill(order); }}
                      style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', width: '80px' }}
                    >
                      Show Bill
                    </button>
                  </div>

                  {isExpanded && (
                    <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderTop: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', fontWeight: 'bold', color: '#475569', fontSize: '13px', marginBottom: '8px', borderBottom: '1px solid #cbd5e1', paddingBottom: '4px' }}>
                        <div style={{ flex: 2 }}>Item</div>
                        <div style={{ flex: 1 }}>Qty</div>
                        <div style={{ flex: 1 }}>Price</div>
                      </div>
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', padding: '4px 0', fontSize: '13px', color: '#475569' }}>
                          <div style={{ flex: 2 }}>{item.name}</div>
                          <div style={{ flex: 1 }}>{item.quantity}</div>
                          <div style={{ flex: 1 }}>₹{item.price?.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryModal;
