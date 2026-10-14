import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Users, MapPin, DollarSign, CreditCard, 
  Search, Filter, ChevronRight, CheckCircle2, AlertTriangle, 
  X, RefreshCw, Eye, CheckCircle, ShieldCheck, FileText, ArrowRight
} from 'lucide-react';
import { cateringAdminService } from '../services/api';
import { toast } from './Toast';

const CateringOrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Selected Order Detail Modal
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchReports();
  }, [statusFilter, paymentFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'ALL') params.order_status = statusFilter;
      if (paymentFilter !== 'ALL') params.payment_status = paymentFilter;
      if (dateFilter) params.date_from = dateFilter;

      const data = await cateringAdminService.getOrders(params);
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch catering orders:', error);
      toast.error('Failed to load catering orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setReportsLoading(true);
      const data = await cateringAdminService.getCateringReports();
      setReports(data);
    } catch (error) {
      console.error('Failed to fetch catering reports:', error);
    } finally {
      setReportsLoading(false);
    }
  };

  const openOrderDetail = async (orderId) => {
    setSelectedOrderId(orderId);
    try {
      setDetailLoading(true);
      const data = await cateringAdminService.getOrderDetail(orderId);
      setOrderDetail(data);
    } catch (error) {
      console.error('Failed to fetch order detail:', error);
      toast.error('Failed to load order details');
      setSelectedOrderId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeOrderDetail = () => {
    setSelectedOrderId(null);
    setOrderDetail(null);
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!orderDetail) return;
    try {
      setStatusUpdating(true);
      await cateringAdminService.updateOrderStatus(orderDetail.order.id, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      // Refresh details and list
      const updated = await cateringAdminService.getOrderDetail(orderDetail.order.id);
      setOrderDetail(updated);
      fetchOrders();
      fetchReports();
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error(error.response?.data?.detail || 'Failed to update order status');
    } finally {
      setStatusUpdating(false);
    }
  };

  // Filtered orders in memory for quick search
  const filteredOrders = orders.filter(order => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      order.id.toString().includes(q) ||
      (order.customer_name || '').toLowerCase().includes(q) ||
      (order.customer_phone || '').toLowerCase().includes(q) ||
      (order.package_name || '').toLowerCase().includes(q) ||
      (order.package_code || '').toLowerCase().includes(q) ||
      (order.event_name || '').toLowerCase().includes(q)
    );
  });

  const getOrderStatusBadge = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'CONFIRMED':
        return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE', label: 'Confirmed' };
      case 'PREPARING':
        return { bg: '#FAF5FF', text: '#7C3AED', border: '#E9D5FF', label: 'Preparing' };
      case 'READY':
        return { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA', label: 'Ready for Service' };
      case 'COMPLETED':
        return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', label: 'Service Completed' };
      case 'CANCELLED':
        return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', label: 'Cancelled' };
      default:
        return { bg: '#F3F4F6', text: '#4B5563', border: '#E5E7EB', label: status || 'Pending' };
    }
  };

  const getPaymentStatusBadge = (status, balance) => {
    if (balance <= 0 || (status || '').toUpperCase() === 'PAID') {
      return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', label: 'Fully Paid' };
    }
    if ((status || '').toUpperCase() === 'PARTIALLY_PAID') {
      return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A', label: 'Advance Paid (50%)' };
    }
    return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', label: 'Payment Pending' };
  };

  return (
    <div className="catering-orders-page" style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px', color: '#EA580C', textTransform: 'uppercase', marginBottom: '6px' }}>
          CATERING / MANAGEMENT
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
          Confirmed Catering Orders
        </h1>
        <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
          Manage customer catering events, verified advance & balance payments, menu customizations, and workflow execution.
        </p>
      </div>

      {/* KPI Summary Cards (Phase 8: Reporting Architecture) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '18px 20px', borderRadius: '14px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>Total Confirmed Orders</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>
            {reportsLoading ? '...' : reports?.total_orders ?? 0}
          </div>
          <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px', fontWeight: '600' }}>
            {reports?.upcoming_events ?? 0} upcoming events
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '18px 20px', borderRadius: '14px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>Total Booked Value</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>
            ₹{reportsLoading ? '...' : (reports?.total_booked_sales ?? 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>
            Committed order sales
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '18px 20px', borderRadius: '14px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>Verified Collections</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669' }}>
            ₹{reportsLoading ? '...' : (reports?.total_collected_revenue ?? 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px' }}>
            ₹{(reports?.verified_advance_collections ?? 0).toLocaleString()} Adv · ₹{(reports?.verified_balance_collections ?? 0).toLocaleString()} Bal
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '18px 20px', borderRadius: '14px', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '4px' }}>Outstanding Receivables</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#EA580C' }}>
            ₹{reportsLoading ? '...' : (reports?.outstanding_receivables ?? 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#D97706', marginTop: '4px' }}>
            Due 2 days prior to events
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '260px', maxWidth: '420px' }}>
          <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by customer, phone, package, order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '9px 12px 9px 38px',
              fontSize: '13px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              outline: 'none'
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#374151',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Order Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY">Ready for Service</option>
            <option value="COMPLETED">Service Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            style={{
              padding: '9px 12px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#374151',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Fully Paid</option>
            <option value="PARTIALLY_PAID">Advance Paid (50%)</option>
            <option value="PENDING">Pending</option>
          </select>

          <button
            onClick={() => { fetchOrders(); fetchReports(); }}
            title="Refresh Orders"
            style={{
              padding: '9px 12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#4B5563'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Confirmed Orders Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '260px' }}>
          <RefreshCw className="animate-spin" size={28} color="#EA580C" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px dashed #D1D5DB'
        }}>
          <Calendar size={36} color="#9CA3AF" style={{ marginBottom: '10px' }} />
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#374151', margin: '0 0 6px 0' }}>No catering orders found</h3>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: 0 }}>Try clearing filters or check customer app booking activity.</p>
        </div>
      ) : (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '14px',
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#4B5563' }}>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Order ID</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Customer</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Event & Date</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Package & Guests</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Total Amount</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Paid / Balance</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Payment Status</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Order Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const orderBadge = getOrderStatusBadge(order.order_status);
                const paymentBadge = getPaymentStatusBadge(order.payment_status, order.balance_amount);
                const eventDateFormatted = order.event_date ? new Date(order.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date not set';
                
                return (
                  <tr 
                    key={order.id} 
                    style={{ borderBottom: '1px solid #F3F4F6', transition: 'background-color 0.15s ease' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#111827' }}>
                      #{order.id}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '700', color: '#111827' }}>{order.customer_name || 'Guest'}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>{order.customer_phone}</div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', color: '#111827' }}>{order.event_name || 'Catering Event'}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>
                        📅 {eventDateFormatted} {order.serving_time ? `· ${order.serving_time}` : ''}
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '600', color: '#111827' }}>{order.package_name}</div>
                      <div style={{ fontSize: '11px', color: '#6B7280' }}>
                        👥 {order.guest_count} guests (PKG {order.package_code})
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', fontWeight: '800', color: '#111827' }}>
                      ₹{Math.round(order.total_amount).toLocaleString()}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '700', color: '#059669' }}>
                        ₹{Math.round(order.paid_amount).toLocaleString()} paid
                      </div>
                      <div style={{ fontSize: '11px', color: order.balance_amount > 0 ? '#EA580C' : '#6B7280' }}>
                        {order.balance_amount > 0 ? `₹${Math.round(order.balance_amount).toLocaleString()} due` : 'Fully settled'}
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: paymentBadge.bg,
                        color: paymentBadge.text,
                        border: `1px solid ${paymentBadge.border}`
                      }}>
                        {paymentBadge.label}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: orderBadge.bg,
                        color: orderBadge.text,
                        border: `1px solid ${orderBadge.border}`
                      }}>
                        {orderBadge.label}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => openOrderDetail(order.id)}
                        style={{
                          backgroundColor: '#FFF7ED',
                          color: '#EA580C',
                          border: '1px solid #FED7AA',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}


      {/* ============================================================ */}
      {/* DEEP ORDER DETAILS MODAL (PHASE 5, 6, 7) */}
      {/* ============================================================ */}
      {selectedOrderId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '920px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#FAFAFA'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: 0 }}>
                    Catering Order #{orderDetail?.order?.id}
                  </h2>
                  {orderDetail && (
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '700',
                      backgroundColor: getOrderStatusBadge(orderDetail.order.order_status).bg,
                      color: getOrderStatusBadge(orderDetail.order.order_status).text
                    }}>
                      {orderDetail.order.order_status}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>
                  Confirmed booking snapshot, dish customizations, and verified payment audit
                </p>
              </div>

              <button
                onClick={closeOrderDetail}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            {detailLoading || !orderDetail ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '360px' }}>
                <RefreshCw className="animate-spin" size={28} color="#EA580C" />
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                
                {/* 1. Event & Customer Info Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  {/* Customer Card */}
                  <div style={{ backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#4B5563', textTransform: 'uppercase', marginBottom: '8px' }}>
                      CUSTOMER DETAILS
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                      {orderDetail.customer.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#4B5563', marginBottom: '2px' }}>
                      📞 {orderDetail.customer.phone}
                    </div>
                    {orderDetail.customer.email && (
                      <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>
                        ✉️ {orderDetail.customer.email}
                      </div>
                    )}
                    {orderDetail.customer.address && (
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>
                        🏠 {orderDetail.customer.address}
                      </div>
                    )}
                  </div>

                  {/* Event Card */}
                  <div style={{ backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: '#4B5563', textTransform: 'uppercase', marginBottom: '8px' }}>
                      EVENT DETAILS
                    </div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                      {orderDetail.event.event_name || 'Catering Gathering'}
                    </div>
                    <div style={{ fontSize: '13px', color: '#4B5563', marginBottom: '2px' }}>
                      📅 {orderDetail.event.event_date ? new Date(orderDetail.event.event_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'}
                      {orderDetail.event.serving_time ? ` at ${orderDetail.event.serving_time}` : ''}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '2px' }}>
                      👥 Guests: <strong>{orderDetail.event.guest_count}</strong> · Service: <strong>{orderDetail.event.service_type || 'Standard'}</strong>
                    </div>
                    {orderDetail.event.delivery_address_snapshot && (
                      <div style={{ fontSize: '12px', color: '#4B5563', marginTop: '4px' }}>
                        📍 Venue: {orderDetail.event.delivery_address_snapshot}
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Menu Package & Booked Pricing */}
                <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '800', color: '#EA580C', textTransform: 'uppercase', marginBottom: '2px' }}>
                        SELECTED PACKAGE
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>
                        {orderDetail.package.package_name} ({orderDetail.package.package_code})
                      </h3>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: '#6B7280' }}>Booked price:</span>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#111827' }}>
                        ₹{orderDetail.package.booked_package_price} / person
                      </div>
                    </div>
                  </div>

                  {/* Included dishes sample */}
                  {orderDetail.package.included_dishes?.length > 0 && (
                    <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#4B5563' }}>Package Baseline Dishes: </span>
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>
                        {orderDetail.package.included_dishes.map(d => d.item_name).join(' · ')}
                      </span>
                    </div>
                  )}
                </div>

                {/* 3. Customizations & Upgrades History (Phase 3 & 5) */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#111827', marginBottom: '10px' }}>
                    Confirmed Dish Customizations ({orderDetail.customizations.length})
                  </div>
                  {orderDetail.customizations.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#6B7280', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
                      No dish replacements or modifications were requested for this order. Original package dishes retained.
                    </div>
                  ) : (
                    <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#4B5563', textAlign: 'left' }}>
                            <th style={{ padding: '8px 12px' }}>Action</th>
                            <th style={{ padding: '8px 12px' }}>Original Dish</th>
                            <th style={{ padding: '8px 12px' }}>Customized To</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Adjustment / Person</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total Adjustment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderDetail.customizations.map((c) => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                              <td style={{ padding: '8px 12px', fontWeight: '700' }}>
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  fontSize: '10px',
                                  backgroundColor: c.action_type === 'REPLACE' ? '#EFF6FF' : c.action_type === 'ADD' ? '#ECFDF5' : '#FEF2F2',
                                  color: c.action_type === 'REPLACE' ? '#2563EB' : c.action_type === 'ADD' ? '#059669' : '#DC2626'
                                }}>
                                  {c.action_type}
                                </span>
                              </td>
                              <td style={{ padding: '8px 12px', color: '#4B5563' }}>{c.original_item_name || 'None'}</td>
                              <td style={{ padding: '8px 12px', fontWeight: '600', color: '#111827' }}>{c.new_item_name || 'Removed'}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', color: '#4B5563' }}>
                                {c.price_adjustment_per_person >= 0 ? `+₹${c.price_adjustment_per_person}` : `-₹${Math.abs(c.price_adjustment_per_person)}`}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '700', color: c.total_price_adjustment >= 0 ? '#111827' : '#059669' }}>
                                {c.total_price_adjustment >= 0 ? `+₹${c.total_price_adjustment.toLocaleString()}` : `-₹${Math.abs(c.total_price_adjustment).toLocaleString()}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 4. Payment Management Ledger (Phase 6) */}
                <div style={{
                  backgroundColor: '#F9FAFB',
                  padding: '18px',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  marginBottom: '24px'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#111827', marginBottom: '14px' }}>
                    Payment & Receivable Ledger (Policy: Min 50% Advance · Balance due 2 days prior)
                  </div>

                  {/* Summary Bar */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '12px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#6B7280' }}>Total Order Value</span>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#111827' }}>
                        ₹{Math.round(orderDetail.financials.total_amount).toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: '#6B7280' }}>50% Advance Required</span>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#2563EB' }}>
                        ₹{Math.round(orderDetail.financials.advance_amount).toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: '#6B7280' }}>Total Verified Paid</span>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#059669' }}>
                        ₹{Math.round(orderDetail.financials.paid_amount).toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', color: '#6B7280' }}>Outstanding Balance</span>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: orderDetail.financials.balance_amount > 0 ? '#EA580C' : '#059669' }}>
                        ₹{Math.round(orderDetail.financials.balance_amount).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {orderDetail.financials.full_payment_due_date && (
                    <div style={{ fontSize: '12px', color: '#B45309', backgroundColor: '#FEF3C7', padding: '6px 12px', borderRadius: '6px', marginBottom: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={14} />
                      <span>Full payment due date: <strong>{orderDetail.financials.full_payment_due_date}</strong> (2 days before event)</span>
                    </div>
                  )}

                  {/* Verified Transactions Table */}
                  <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#4B5563', marginBottom: '8px' }}>
                      Verified Razorpay Transactions ({orderDetail.payments.length})
                    </div>
                    {orderDetail.payments.length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#6B7280' }}>No transactions recorded yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {orderDetail.payments.map((p) => (
                          <div key={p.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#FFFFFF',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #E5E7EB',
                            fontSize: '12px'
                          }}>
                            <div>
                              <span style={{ fontWeight: '700', color: '#111827', marginRight: '8px' }}>
                                ₹{p.amount.toLocaleString()} ({p.payment_type})
                              </span>
                              <span style={{ color: '#6B7280', fontSize: '11px' }}>
                                Ref: {p.transaction_id}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: '#059669', fontWeight: '700', fontSize: '11px' }}>
                                ✓ {p.payment_status}
                              </span>
                              <span style={{ color: '#9CA3AF', fontSize: '11px' }}>
                                {p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : ''}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Order Status Transition Controller (Phase 7) */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
                    Order Status Transitions
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { status: 'CONFIRMED', label: 'Confirmed' },
                      { status: 'PREPARING', label: 'Preparing' },
                      { status: 'READY', label: 'Ready for Service' },
                      { status: 'COMPLETED', label: 'Service Completed' },
                      { status: 'CANCELLED', label: 'Cancel Order' }
                    ].map((step) => {
                      const isCurrent = (orderDetail.order.order_status || '').toUpperCase() === step.status;
                      const isCancelled = step.status === 'CANCELLED';
                      return (
                        <button
                          key={step.status}
                          disabled={isCurrent || statusUpdating}
                          onClick={() => handleUpdateStatus(step.status)}
                          style={{
                            padding: '8px 14px',
                            fontSize: '12px',
                            fontWeight: '700',
                            borderRadius: '8px',
                            border: isCurrent ? '1.5px solid #111827' : isCancelled ? '1px solid #FECACA' : '1px solid #E5E7EB',
                            backgroundColor: isCurrent ? '#111827' : isCancelled ? '#FEF2F2' : '#FFFFFF',
                            color: isCurrent ? '#FFFFFF' : isCancelled ? '#DC2626' : '#374151',
                            cursor: isCurrent || statusUpdating ? 'default' : 'pointer',
                            opacity: isCurrent ? 1 : 0.9
                          }}
                        >
                          {isCurrent ? `✓ ${step.label}` : step.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'flex-end',
              backgroundColor: '#FAFAFA'
            }}>
              <button
                onClick={closeOrderDetail}
                style={{
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CateringOrdersManagement;
