import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Wallet,
  CreditCard,
  Banknote,
  IndianRupee
} from 'lucide-react';
import { orderService } from '../services/api';

const PaymentManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await orderService.getAllOrders();
        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch orders for payments', err);
        setError('Failed to load payment history.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Calculate stats based on fetched orders
  const paidOrders = orders.filter(o => o.payment_status?.toLowerCase() === 'paid');

  const totalCollection = paidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const upiPayments = paidOrders
    .filter(o => o.payment_method?.toLowerCase() === 'upi')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const cardPayments = paidOrders
    .filter(o => o.payment_method?.toLowerCase() === 'card')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const cashPayments = paidOrders
    .filter(o => o.payment_method?.toLowerCase() === 'cash')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  // Time formatter for "Time" column
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'N/A';
    const dStr = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(dStr);
    const now = new Date();
    const diffTime = Math.max(0, now - date);
    const diffMins = Math.floor(diffTime / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="page-container admin-page-mobile-wrapper">
      {/* Header section */}
      <div className="desktop-only" style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: '#1a1a2e' }}>Payments</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Track all payment transactions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid-responsive" style={{ marginBottom: '32px' }}>
        {/* Today's Collection */}
        <div style={{ background: '#ffffff', border: '1px solid #eaeaea', borderRadius: '12px', padding: '24px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '13px', fontWeight: '600' }}>
            <TrendingUp size={14} />
            +8%
          </div>
          <div style={{ width: '40px', height: '40px', background: '#ff6b35', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '16px' }}>
            <IndianRupee size={20} />
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px', color: '#1a1a2e' }}>₹{totalCollection.toLocaleString()}</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Overall Collection</p>
        </div>

        {/* UPI Payments */}
        <div style={{ background: '#ffffff', border: '1px solid #eaeaea', borderRadius: '12px', padding: '24px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '13px', fontWeight: '600' }}>
            <TrendingUp size={14} />
            +52%
          </div>
          <div style={{ width: '40px', height: '40px', background: '#ffe0e0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff4d4d', marginBottom: '16px' }}>
            <Wallet size={20} />
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px', color: '#1a1a2e' }}>₹{upiPayments.toLocaleString()}</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>UPI Payments</p>
        </div>

        {/* Card Payments */}
        <div style={{ background: '#ffffff', border: '1px solid #eaeaea', borderRadius: '12px', padding: '24px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '13px', fontWeight: '600' }}>
            <TrendingUp size={14} />
            +18%
          </div>
          <div style={{ width: '40px', height: '40px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', marginBottom: '16px' }}>
            <CreditCard size={20} />
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px', color: '#1a1a2e' }}>₹{cardPayments.toLocaleString()}</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Card Payments</p>
        </div>

        {/* Cash */}
        <div style={{ background: '#ffffff', border: '1px solid #eaeaea', borderRadius: '12px', padding: '24px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '13px', fontWeight: '600' }}>
            <TrendingUp size={14} />
            +25%
          </div>
          <div style={{ width: '40px', height: '40px', background: '#f5f5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', marginBottom: '16px' }}>
            <Banknote size={20} />
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px', color: '#1a1a2e' }}>₹{cashPayments.toLocaleString()}</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Cash</p>
        </div>
      </div>

      {/* Transaction History */}
      <div style={{ background: '#ffffff', border: '1px solid #eaeaea', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', background: '#f3f4f6', borderBottom: '1px solid #eaeaea' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e', margin: 0 }}>Transaction History</h2>
        </div>
        <div className="scroll-x">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead style={{ borderBottom: '1px solid #eaeaea' }}>
              <tr>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Order</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Table</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Amount</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Method</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Time</th>
                <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading transactions...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#ff4d4d' }}>{error}</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No transactions found.</td>
                </tr>
              ) : (
                orders.map((order) => {
                  const isPaid = order.payment_status?.toLowerCase() === 'paid';
                  const isPending = order.payment_status?.toLowerCase() === 'pending';
                  const isFailed = order.payment_status?.toLowerCase() === 'failed';

                  return (
                    <tr key={order.order_id} style={{ borderBottom: '1px solid #eaeaea' }}>
                      <td style={{ padding: '16px 24px', fontWeight: '700', fontSize: '14px', color: '#ff6b35' }}>#{order.order_id}</td>
                      <td style={{ padding: '16px 24px', fontWeight: '600', fontSize: '14px', color: '#1a1a2e' }}>
                        {(!order.table_number || order.table_number === 'N/A' || order.table_number.toString().toLowerCase() === 'takeaway') ? (order.order_type || 'Takeaway') : order.table_number}
                      </td>
                      <td style={{ padding: '16px 24px', fontWeight: '700', fontSize: '14px', color: '#1a1a2e' }}>₹{order.total_amount || 0}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-secondary)' }}>{order.payment_method || 'N/A'}</td>
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                        {formatTimeAgo(order.created_at)}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        {isPaid && (
                          <span style={{ display: 'inline-flex', padding: '4px 12px', background: '#f0fdf4', color: '#16a34a', borderRadius: '16px', fontSize: '12px', fontWeight: '600' }}>
                            Paid
                          </span>
                        )}
                        {isPending && (
                          <span style={{ display: 'inline-flex', padding: '4px 12px', background: '#fffbeb', color: '#d97706', borderRadius: '16px', fontSize: '12px', fontWeight: '600' }}>
                            Pending
                          </span>
                        )}
                        {isFailed && (
                          <span style={{ display: 'inline-flex', padding: '4px 12px', background: '#fff0f0', color: '#ff4d4d', borderRadius: '16px', fontSize: '12px', fontWeight: '600' }}>
                            Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentManagement;
