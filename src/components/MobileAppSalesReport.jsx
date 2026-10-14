import React, { useEffect, useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Smartphone, 
  Activity, 
  Package, 
  IndianRupee, 
  Clock, 
  Utensils, 
  ShoppingBag, 
  Bike,
  Download,
  Search,
  Filter,
  Eye,
  X,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { reportsService } from '../services/api';

/**
 * MobileAppSalesReport
 *
 * Dedicated view for mobile app (customer-originated) order sales.
 * Orders are identified server-side by: user_id IS NULL AND customer_phone IS NOT NULL.
 *
 * Features:
 *   - Overall sales summary cards
 *   - Order type breakdown (Dine-In, Takeaway, Delivery)
 *   - Comprehensive Mobile Order History table with Name, Phone, Items, Date/Time, Status, and Payment
 *   - CSV Report Export (downloadable reports with Excel BOM support)
 *   - Order Item Details Modal
 *   - Thermal / Slip Printable Layout
 *
 * Props:
 *   onBack – callback to return to the main Reports page
 */
const MobileAppSalesReport = ({ onBack }) => {
  const [reportData, setReportData]       = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [selectedDate, setSelectedDate]   = useState(
    new Date().toISOString().split('T')[0]
  );
  
  // Order history table controls
  const [searchTerm, setSearchTerm]       = useState('');
  const [statusFilter, setStatusFilter]   = useState('ALL');
  const [typeFilter, setTypeFilter]       = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch whenever date changes
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await reportsService.getMobileAppReport({ date: selectedDate });
        setReportData(res);
      } catch (err) {
        setError(
          'Failed to fetch Mobile App Sales report. Your session may have expired (401). Please log in again.'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [selectedDate]);

  const handlePrint = () => window.print();

  // ── Filtered orders for table ──────────────────────────────────────────────
  const ordersList = useMemo(() => {
    return reportData?.orders || [];
  }, [reportData]);

  const filteredOrders = useMemo(() => {
    if (!ordersList || ordersList.length === 0) return [];
    return ordersList.filter((order) => {
      // Status filter
      if (statusFilter !== 'ALL' && (order.status || '').toUpperCase() !== statusFilter) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'ALL' && (order.order_type || '').toUpperCase() !== typeFilter) {
        return false;
      }
      // Search query (customer name, phone, order id, or items summary)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesName = (order.customer_name || '').toLowerCase().includes(q);
        const matchesPhone = (order.customer_phone || '').toLowerCase().includes(q);
        const matchesId = (order.order_id || '').toLowerCase().includes(q) || String(order.id).includes(q);
        const matchesItems = (order.items_summary || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesId && !matchesItems) {
          return false;
        }
      }
      return true;
    });
  }, [ordersList, searchTerm, statusFilter, typeFilter]);

  // ── Export CSV Report ──────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const ordersToExport = filteredOrders.length > 0 ? filteredOrders : ordersList;

    if (!ordersToExport || ordersToExport.length === 0) {
      alert('No mobile orders available to export for this date.');
      return;
    }

    const headers = [
      'Order ID',
      'Date & Time (IST)',
      'Customer Name',
      'Phone Number',
      'Order Type',
      'Ordered Items',
      'Items Count',
      'Order Status',
      'Payment Status',
      'Payment Method',
      'Total Amount (INR)'
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = ordersToExport.map((o) => [
      escapeCSV(o.order_id || `ORD-${o.id}`),
      escapeCSV(o.date_time || `${o.date} ${o.time}`),
      escapeCSV(o.customer_name || 'Guest'),
      escapeCSV(o.customer_phone || ''),
      escapeCSV(o.order_type || ''),
      escapeCSV(o.items_summary || (o.items || []).map(i => `${i.name} x${i.quantity}`).join(', ')),
      escapeCSV(o.items_count || (o.items || []).length || 0),
      escapeCSV(o.status || ''),
      escapeCSV(o.payment_status || ''),
      escapeCSV(o.payment_method || ''),
      escapeCSV(Number(o.total_amount || 0).toFixed(2))
    ]);

    // Prepend UTF-8 BOM so Microsoft Excel renders Indian Rupee and text symbols correctly
    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Mobile_App_Orders_Report_${selectedDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ── Badge Helpers ──────────────────────────────────────────────────────────
  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    let bg = 'rgba(107, 114, 128, 0.1)';
    let color = '#4b5563';
    let border = 'rgba(107, 114, 128, 0.25)';

    if (s === 'SERVED' || s === 'COMPLETED' || s === 'DELIVERED') {
      bg = 'rgba(16, 185, 129, 0.12)';
      color = '#059669';
      border = 'rgba(16, 185, 129, 0.3)';
    } else if (s === 'CONFIRMED' || s === 'PREPARING' || s === 'READY') {
      bg = 'rgba(59, 130, 246, 0.12)';
      color = '#2563eb';
      border = 'rgba(59, 130, 246, 0.3)';
    } else if (s === 'CANCELLED') {
      bg = 'rgba(239, 68, 68, 0.12)';
      color = '#dc2626';
      border = 'rgba(239, 68, 68, 0.3)';
    } else if (s === 'PENDING') {
      bg = 'rgba(245, 158, 11, 0.12)';
      color = '#d97706';
      border = 'rgba(245, 158, 11, 0.3)';
    }

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600',
        background: bg,
        color: color,
        border: `1px solid ${border}`,
        letterSpacing: '0.3px',
        textTransform: 'uppercase'
      }}>
        {status || 'UNKNOWN'}
      </span>
    );
  };

  const getOrderTypeBadge = (type) => {
    const t = (type || '').toUpperCase();
    if (t.includes('DELIV')) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '600',
          background: 'rgba(255, 140, 66, 0.12)',
          color: '#ea580c',
          border: '1px solid rgba(255, 140, 66, 0.3)'
        }}>
          <Bike size={12} /> Delivery
        </span>
      );
    }
    if (t.includes('TAKE')) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '600',
          background: 'rgba(45, 122, 74, 0.12)',
          color: '#2d7a4a',
          border: '1px solid rgba(45, 122, 74, 0.3)'
        }}>
          <ShoppingBag size={12} /> Takeaway
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600',
        background: 'rgba(108, 99, 255, 0.12)',
        color: '#6c63ff',
        border: '1px solid rgba(108, 99, 255, 0.3)'
      }}>
        <Utensils size={12} /> Dine-In
      </span>
    );
  };

  const getPaymentBadge = (status, method) => {
    const isPaid = (status || '').toLowerCase() === 'paid';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          width: 'fit-content',
          padding: '2px 6px',
          borderRadius: '10px',
          fontSize: '10px',
          fontWeight: '700',
          background: isPaid ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: isPaid ? '#15803d' : '#b91c1c',
          border: `1px solid ${isPaid ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          textTransform: 'uppercase'
        }}>
          {isPaid ? 'Paid' : 'Unpaid'}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>
          {method || 'UPI'}
        </span>
      </div>
    );
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Activity
          size={48}
          style={{ margin: '0 auto 20px', color: 'var(--primary)' }}
          className="spin-animation"
        />
        <p style={{ color: 'var(--text-secondary)' }}>Loading Mobile App Sales report...</p>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: 'red' }}>{error}</p>
        <button
          className="primary-button"
          onClick={onBack}
          style={{ marginTop: '20px' }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const hasOrders = reportData && (reportData.total_orders > 0 || (reportData.orders && reportData.orders.length > 0));

  // ── Helper: summary cards ─────────────────────────────────────────────────
  const summaryCards = [
    {
      label: 'Total Mobile Sales',
      value: `₹${(reportData?.total_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: IndianRupee,
      color: '#ff8c42'
    },
    {
      label: 'Fulfilled Orders',
      value: reportData?.total_orders ?? 0,
      icon: Smartphone,
      color: '#2d7a4a'
    },
    {
      label: 'Total Mobile Orders',
      value: reportData?.orders?.length ?? (reportData?.total_orders ?? 0),
      icon: FileSpreadsheet,
      color: '#0284c7'
    },
    {
      label: 'Total Qty Sold',
      value: (reportData?.items || [])
        .reduce((acc, i) => acc + (i.qty || 0), 0)
        .toFixed(0),
      icon: Clock,
      color: '#f4a261'
    }
  ];

  return (
    <div className="report-view-container" style={{ paddingBottom: '40px' }}>

      {/* ── App UI — hidden during print ──────────────────────────────────── */}
      <div className="no-print">

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            id="mobile-report-back-btn"
            onClick={onBack}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <ArrowLeft size={20} />
          </button>

          <div style={{ flex: 1, minWidth: '180px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: '700', margin: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={22} color="var(--primary)" />
              Mobile App Sales & Order History
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '13px' }}>
              Date: {reportData?.date || selectedDate}
              {reportData?.starting_order && (
                <> &nbsp;|&nbsp; First: {reportData.starting_order.id} ({reportData.starting_order.time})</>
              )}
              {reportData?.ending_order && (
                <> &nbsp;|&nbsp; Last: {reportData.ending_order.id} ({reportData.ending_order.time})</>
              )}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flexShrink: 0 }}>
            <input
              id="mobile-report-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'black',
                fontWeight: '500',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            />

            {/* Download CSV Report Button */}
            <button
              id="mobile-report-download-btn"
              onClick={handleExportCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                background: '#16a34a',
                border: '1px solid #15803d',
                color: 'white',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)',
                transition: 'all 0.15s ease'
              }}
              title="Download Mobile Orders as CSV Report"
            >
              <Download size={16} /> Download CSV
            </button>

            {/* Print Report Slip Button */}
            <button
              id="mobile-report-print-btn"
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: '#111',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              <Printer size={16} /> Print Report
            </button>
          </div>
        </div>

        {/* ── Summary cards ──────────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {summaryCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                style={{
                  background: 'var(--surface)',
                  padding: '18px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={18} color="white" />
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {card.label}
                  </p>
                  <p style={{ fontSize: '22px', fontWeight: '700', margin: 0, color: 'black' }}>
                    {card.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Order type breakdown ───────────────────────────────────────── */}
        {hasOrders && (
          <div style={{
            background: 'var(--surface)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '600', margin: 0, color: 'black' }}>Order Type Sales Breakdown</h2>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Dine-In • Takeaway • Delivery
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px'
            }}>
              {[
                {
                  key: 'DINE_IN',
                  label: 'Dine-In',
                  color: '#6c63ff',
                  bgLight: 'rgba(108, 99, 255, 0.08)',
                  borderCol: 'rgba(108, 99, 255, 0.25)',
                  icon: Utensils,
                },
                {
                  key: 'TAKEAWAY',
                  label: 'Takeaway',
                  color: '#2d7a4a',
                  bgLight: 'rgba(45, 122, 74, 0.08)',
                  borderCol: 'rgba(45, 122, 74, 0.25)',
                  icon: ShoppingBag,
                },
                {
                  key: 'DELIVERY',
                  label: 'Delivery',
                  color: '#ff8c42',
                  bgLight: 'rgba(255, 140, 66, 0.08)',
                  borderCol: 'rgba(255, 140, 66, 0.25)',
                  icon: Bike,
                }
              ].map((item) => {
                const breakdownItem = reportData?.order_type_breakdown?.[item.key] || {
                  count: reportData?.order_type_counts?.[item.key] || 0,
                  sales: 0
                };
                const count = breakdownItem.count || 0;
                const sales = breakdownItem.sales || 0;
                const totalSalesVal = reportData?.total_sales || 0;
                const pct = totalSalesVal > 0 ? ((sales / totalSalesVal) * 100).toFixed(1) : 0;
                const IconComp = item.icon;

                return (
                  <div
                    key={item.key}
                    style={{
                      background: item.bgLight,
                      border: `1px solid ${item.borderCol}`,
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: item.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white'
                        }}>
                          <IconComp size={16} />
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'black' }}>
                          {item.label}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: 'white',
                        color: item.color,
                        border: `1px solid ${item.borderCol}`
                      }}>
                        {count} {count === 1 ? 'Order' : 'Orders'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '4px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Sales
                        </span>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: 'black' }}>
                          ₹{sales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      {totalSalesVal > 0 && (
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                          {pct}% share
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Empty state ─────────────────────────────────────────────────── */}
        {!hasOrders && (
          <div style={{
            background: 'var(--surface)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            padding: '60px 20px',
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <Smartphone size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
            <p style={{ fontSize: '16px', fontWeight: '600', color: 'black', marginBottom: '8px' }}>
              No Mobile App Orders Found
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              No mobile app orders exist for {reportData?.date || selectedDate}.
              Try selecting a different date.
            </p>
          </div>
        )}

        {/* ── MOBILE ORDER HISTORY TABLE (NEW & HIGHLIGHTED) ────────────────── */}
        {hasOrders && (
          <div style={{
            background: 'var(--surface)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            marginBottom: '24px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            {/* Table Header Controls */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'black' }}>
                    Mobile Order History
                  </h2>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: 'rgba(108, 99, 255, 0.1)',
                    color: '#6c63ff',
                    border: '1px solid rgba(108, 99, 255, 0.2)'
                  }}>
                    {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Full record of customer mobile orders including name, phone number, items, and status
                </p>
              </div>

              {/* Action and Filter Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Search Input */}
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-secondary)' }} />
                  <input
                    type="text"
                    placeholder="Search name, phone, items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      padding: '7px 28px 7px 30px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      fontSize: '12px',
                      background: 'var(--background)',
                      color: 'black',
                      width: '210px'
                    }}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    fontSize: '12px',
                    background: 'var(--background)',
                    color: 'black',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SERVED">SERVED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PREPARING">PREPARING</option>
                  <option value="READY">READY</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>

                {/* Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={{
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    fontSize: '12px',
                    background: 'var(--background)',
                    color: 'black',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">All Types</option>
                  <option value="DINE_IN">Dine-In</option>
                  <option value="TAKEAWAY">Takeaway</option>
                  <option value="DELIVERY">Delivery</option>
                </select>

                {/* Download CSV button */}
                <button
                  onClick={handleExportCSV}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 12px',
                    borderRadius: '6px',
                    background: 'rgba(22, 163, 74, 0.1)',
                    border: '1px solid rgba(22, 163, 74, 0.3)',
                    color: '#15803d',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                  title="Export orders to CSV"
                >
                  <Download size={14} /> Export CSV
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
                <thead>
                  <tr style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Order ID</th>
                    <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Date & Time</th>
                    <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Customer Name</th>
                    <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Phone No</th>
                    <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Order Type</th>
                    <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', minWidth: '180px' }}>Ordered Items</th>
                    <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Order Status</th>
                    <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Payment</th>
                    <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textAlign: 'right', textTransform: 'uppercase' }}>Total Amount</th>
                    <th style={{ padding: '12px 18px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textAlign: 'center', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: '36px 18px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
                        No orders match the current filter or search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order, idx) => (
                      <tr 
                        key={order.id || idx} 
                        style={{ 
                          borderBottom: '1px solid var(--border)',
                          transition: 'background 0.1s ease',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.015)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        onClick={() => setSelectedOrder(order)}
                      >
                        {/* Order ID */}
                        <td style={{ padding: '14px 18px', fontSize: '12px', fontWeight: '700', color: 'black', fontFamily: 'monospace' }}>
                          {order.order_id || `ORD-${order.id}`}
                        </td>

                        {/* Date & Time */}
                        <td style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: '600', color: 'black' }}>{order.date}</div>
                          <div style={{ fontSize: '11px' }}>{order.time}</div>
                        </td>

                        {/* Customer Name */}
                        <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '600', color: 'black' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: 'rgba(108, 99, 255, 0.1)',
                              color: '#6c63ff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: '700',
                              flexShrink: 0
                            }}>
                              {(order.customer_name || 'G')[0].toUpperCase()}
                            </div>
                            <span>{order.customer_name || 'Guest'}</span>
                          </div>
                        </td>

                        {/* Phone Number */}
                        <td style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          {order.customer_phone || '—'}
                        </td>

                        {/* Order Type */}
                        <td style={{ padding: '14px 18px', fontSize: '12px' }}>
                          {getOrderTypeBadge(order.order_type)}
                        </td>

                        {/* Ordered Items */}
                        <td style={{ padding: '14px 18px', fontSize: '12px', color: 'black' }}>
                          <div style={{ fontWeight: '500', maxWidth: '240px', lineHeight: '1.3' }}>
                            {order.items_summary || 'No items'}
                          </div>
                          {order.items && order.items.length > 0 && (
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                            </div>
                          )}
                        </td>

                        {/* Order Status */}
                        <td style={{ padding: '14px 18px' }}>
                          {getStatusBadge(order.status)}
                        </td>

                        {/* Payment Status & Method */}
                        <td style={{ padding: '14px 18px' }}>
                          {getPaymentBadge(order.payment_status, order.payment_method)}
                        </td>

                        {/* Total Amount */}
                        <td style={{ padding: '14px 18px', fontSize: '14px', fontWeight: '700', color: 'black', textAlign: 'right' }}>
                          ₹{(order.total_amount || 0).toFixed(2)}
                        </td>

                        {/* Action: View Modal */}
                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                            }}
                            style={{
                              background: 'var(--background)',
                              border: '1px solid var(--border)',
                              borderRadius: '6px',
                              padding: '5px 8px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-secondary)',
                              transition: 'all 0.15s ease'
                            }}
                            title="View Order Details"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Item-wise table ─────────────────────────────────────────────── */}
        {hasOrders && reportData?.items && reportData.items.length > 0 && (
          <div style={{
            background: 'var(--surface)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            marginBottom: '24px'
          }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '600', margin: 0, color: 'black' }}>Item Wise Sales Summary</h2>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Item Name</th>
                  <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'right', textTransform: 'uppercase' }}>Rate (₹)</th>
                  <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'right', textTransform: 'uppercase' }}>Qty</th>
                  <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'right', textTransform: 'uppercase' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {reportData.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 24px', fontSize: '13px', fontWeight: '500', color: 'black' }}>{item.name}</td>
                    <td style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'right' }}>{item.rate.toFixed(2)}</td>
                    <td style={{ padding: '14px 24px', fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'right' }}>{item.qty.toFixed(0)}</td>
                    <td style={{ padding: '14px 24px', fontSize: '13px', fontWeight: '600', color: 'black', textAlign: 'right' }}>{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'rgba(255,140,66,0.06)', borderTop: '2px solid var(--border)' }}>
                  <td colSpan={3} style={{ padding: '14px 24px', fontSize: '13px', fontWeight: '700', color: 'black' }}>Total Sales</td>
                  <td style={{ padding: '14px 24px', fontSize: '15px', fontWeight: '700', color: '#ff8c42', textAlign: 'right' }}>
                    ₹{(reportData.total_sales || 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ── Hourly breakdown table ──────────────────────────────────────── */}
        {hasOrders && reportData?.timeline && (
          <div style={{
            background: 'var(--surface)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '600', margin: 0, color: 'black' }}>Hourly Sales (IST)</h2>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Timeline</th>
                  <th style={{ padding: '14px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'right', textTransform: 'uppercase' }}>Sales Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {(reportData?.timeline || [])
                  .filter(t => t.sales > 0)
                  .map((t, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 24px', fontSize: '13px', fontWeight: '500', color: 'black' }}>{t.time}</td>
                      <td style={{ padding: '14px 24px', fontSize: '13px', color: 'black', textAlign: 'right' }}>{Math.round(t.sales)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Identification note ─────────────────────────────────────────── */}
        <div style={{
          marginTop: '24px',
          padding: '12px 16px',
          borderRadius: '8px',
          background: 'rgba(108,99,255,0.06)',
          border: '1px solid rgba(108,99,255,0.2)',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>
          <strong style={{ color: 'black' }}>ℹ️ Identification Note:</strong>{' '}
          {reportData?.identification_note}
        </div>
      </div>

      {/* ── ORDER DETAILS MODAL ───────────────────────────────────────────── */}
      {selectedOrder && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: '16px',
              maxWidth: '540px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
              padding: '24px',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: 'black', fontFamily: 'monospace' }}>
                    {selectedOrder.order_id || `ORD-${selectedOrder.id}`}
                  </span>
                  {getOrderTypeBadge(selectedOrder.order_type)}
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Placed on {selectedOrder.date_time || `${selectedOrder.date} at ${selectedOrder.time}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#4b5563'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Customer Details Box */}
            <div style={{
              background: '#f9fafb',
              borderRadius: '10px',
              padding: '14px 16px',
              border: '1px solid var(--border)',
              marginBottom: '20px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Customer Name
                </span>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'black', marginTop: '2px' }}>
                  {selectedOrder.customer_name || 'Guest'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Phone Number
                </span>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'black', marginTop: '2px', fontFamily: 'monospace' }}>
                  {selectedOrder.customer_phone || '—'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Order Status
                </span>
                <div style={{ marginTop: '4px' }}>
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Payment Status
                </span>
                <div style={{ marginTop: '4px' }}>
                  {getPaymentBadge(selectedOrder.payment_status, selectedOrder.payment_method)}
                </div>
              </div>
            </div>

            {/* Ordered Items Breakdown */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 10px 0', color: 'black' }}>
                Ordered Items
              </h3>
              <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>Item</th>
                      <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'right' }}>Rate</th>
                      <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'right' }}>Qty</th>
                      <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: '500' }}>{it.name}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--text-secondary)' }}>₹{(it.rate || it.price || 0).toFixed(2)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>{it.quantity}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600' }}>₹{(it.amount || ((it.rate || it.price || 0) * it.quantity)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: 'rgba(255, 140, 66, 0.08)' }}>
                      <td colSpan={3} style={{ padding: '12px', fontWeight: '700', fontSize: '13px' }}>Total Amount</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800', fontSize: '15px', color: '#ff8c42' }}>
                        ₹{(selectedOrder.total_amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="secondary-button"
                onClick={() => setSelectedOrder(null)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer', background: 'white' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Print layout — only visible during print ──────────────────────── */}
      <div className="invoice-modal print-only">
        <div
          id="printable-mobile-report"
          style={{
            padding: '24px',
            fontFamily: 'monospace',
            fontSize: '13px',
            lineHeight: '1.4',
            color: '#000',
            width: '100%',
            maxWidth: '80mm',
            margin: '0 auto',
            background: 'white'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
              {reportData?.restaurant?.name || 'DATAUDIPI HOTEL'}
            </h1>
            <p style={{ margin: '0 0 2px 0', textTransform: 'uppercase' }}>
              {reportData?.restaurant?.address || 'MUGALIVAKKAM, CHENNAI'}
            </p>
            <p style={{ margin: '0 0 8px 0', textTransform: 'uppercase' }}>
              PH:{reportData?.restaurant?.phone || '9597066563'} GSTIN : {reportData?.restaurant?.gstin || '33ADLPV4810B3ZQ'}
            </p>

            <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: '16px 0 12px 0', textTransform: 'uppercase' }}>
              MOBILE APP SALES REPORT
            </h2>

            <div style={{ textAlign: 'left', marginBottom: '12px' }}>
              <p style={{ margin: '0 0 2px 0' }}>Print Date : {reportData?.date}</p>
              {reportData?.starting_order && (
                <p style={{ margin: '0 0 2px 0' }}>First Order: {reportData.starting_order.id} - {reportData.starting_order.time}</p>
              )}
              {reportData?.ending_order && (
                <p style={{ margin: '0 0 8px 0' }}>Last Order : {reportData.ending_order.id} - {reportData.ending_order.time}</p>
              )}
              <p style={{ margin: '0 0 4px 0' }}>Total Orders : {reportData?.total_orders || 0}</p>
            </div>

            {/* Order type breakdown in printable slip */}
            <div style={{ borderTop: '1px dashed #000', margin: '8px 0', padding: '6px 0', fontSize: '11px', textAlign: 'left' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase' }}>ORDER TYPE BREAKDOWN:</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                <span>Dine-In ({reportData?.order_type_breakdown?.DINE_IN?.count ?? reportData?.order_type_counts?.DINE_IN ?? 0} ord):</span>
                <span>₹{(reportData?.order_type_breakdown?.DINE_IN?.sales ?? 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                <span>Takeaway ({reportData?.order_type_breakdown?.TAKEAWAY?.count ?? reportData?.order_type_counts?.TAKEAWAY ?? 0} ord):</span>
                <span>₹{(reportData?.order_type_breakdown?.TAKEAWAY?.sales ?? 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                <span>Delivery ({reportData?.order_type_breakdown?.DELIVERY?.count ?? reportData?.order_type_counts?.DELIVERY ?? 0} ord):</span>
                <span>₹{(reportData?.order_type_breakdown?.DELIVERY?.sales ?? 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', margin: '8px 0', padding: '8px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 55px 45px 65px', gap: '4px', fontWeight: 'bold' }}>
              <span>Item Name</span>
              <span style={{ textAlign: 'right' }}>Rate</span>
              <span style={{ textAlign: 'right' }}>Qty</span>
              <span style={{ textAlign: 'right' }}>Amount</span>
            </div>
          </div>

          <div style={{ minHeight: '60px' }}>
            {(reportData?.items || []).map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 55px 45px 65px', gap: '4px', margin: '4px 0' }}>
                <span style={{ wordBreak: 'break-word' }}>{item.name}</span>
                <span style={{ textAlign: 'right' }}>{item.rate.toFixed(2)}</span>
                <span style={{ textAlign: 'right' }}>{item.qty.toFixed(0)}</span>
                <span style={{ textAlign: 'right' }}>{item.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Printable Order History Summary */}
          {reportData?.orders && reportData.orders.length > 0 && (
            <div style={{ borderTop: '1px dashed #000', margin: '10px 0', paddingTop: '8px', fontSize: '10px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>MOBILE ORDERS LOG ({reportData.orders.length}):</div>
              {reportData.orders.slice(0, 15).map((ord, idx) => (
                <div key={idx} style={{ margin: '3px 0', borderBottom: '1px dotted #ddd', paddingBottom: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                    <span>{ord.order_id} • {ord.customer_name}</span>
                    <span>₹{(ord.total_amount || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ color: '#444' }}>
                    {ord.time} | {ord.customer_phone} | {ord.order_type} | {ord.status}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ borderTop: '1px dashed #000', marginTop: '12px', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '15px' }}>
              <span>TOTAL SALES</span>
              <span>₹{(reportData?.total_sales || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileAppSalesReport;
