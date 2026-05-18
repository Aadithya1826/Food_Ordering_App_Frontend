import React, { useState, useEffect } from 'react';
import { Clock, ChefHat, CheckCircle2, Truck } from 'lucide-react';
import { orderService } from '../services/api';

const COLUMNS = [
  { id: 'PENDING', title: 'New Orders', icon: Clock, color: '#ff8c42', bg: 'rgba(255, 140, 66, 0.1)', iconBg: '#ff8c42', defaultBg: '#fff' },
  { id: 'PREPARING', title: 'Preparing', icon: ChefHat, color: '#fbb117', bg: 'rgba(251, 177, 23, 0.1)', iconBg: '#fbb117', defaultBg: '#fff' },
  { id: 'READY', title: 'Ready to Serve', icon: CheckCircle2, color: '#2d7a4a', bg: 'rgba(45, 122, 74, 0.1)', iconBg: '#2d7a4a', defaultBg: '#fff' },
  { id: 'SERVED', title: 'Served', icon: Truck, color: '#666', bg: 'rgba(100, 100, 100, 0.1)', iconBg: '#888', defaultBg: '#fff' },
];

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Polling every 10s
    return () => clearInterval(interval);
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
    const minutes = Math.floor((new Date() - new Date(dateString)) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hr ago`;
  };

  if (loading) {
    return <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>Loading orders...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
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
            {orders.filter(o => o.status !== 'SERVED').length} Active Orders
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flex: 1, overflowX: 'auto', paddingBottom: '16px' }}>
        {COLUMNS.map(column => {
          // 'PENDING' also includes 'CONFIRMED'
          const columnOrders = orders.filter(o => {
            if (column.id === 'PENDING') return o.status === 'PENDING' || o.status === 'CONFIRMED';
            return o.status === column.id;
          });

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
                      <span style={{ fontWeight: '700', fontSize: '16px', color: column.iconBg }}>#{order.order_id}</span>
                      <span style={{ 
                        fontSize: '12px', 
                        background: 'rgba(0,0,0,0.04)', 
                        padding: '4px 10px', 
                        borderRadius: '16px',
                        color: 'var(--text-secondary)',
                        fontWeight: '600'
                      }}>
                        {timeAgo(order.created_at)}
                      </span>
                    </div>

                    <div style={{ 
                      fontSize: '14px', 
                      color: 'var(--text-dark)', 
                      fontWeight: '600', 
                      marginBottom: '24px', 
                      lineHeight: '1.6' 
                    }}>
                      {order.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      borderTop: '1px solid rgba(0,0,0,0.06)',
                      paddingTop: '16px'
                    }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>Table {order.table_number}</span>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-dark)' }}>₹ {order.total_amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrdersManagement;
