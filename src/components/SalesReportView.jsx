import React, { useEffect, useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Smartphone, 
  CreditCard,
  TrendingUp,
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
 * SalesReportView
 *
 * Universal Sales Report supporting:
 *   - mode="TOTAL"   : Consolidated sales (all amounts income) with (C) Cashier and (M) Mobile tags
 *   - mode="CASHIER" : Cashier POS sales only (C)
 *   - mode="MOBILE"  : Customer Mobile App sales only (M)
 *
 * Props:
 *   mode   - 'TOTAL' | 'CASHIER' | 'MOBILE' (default: 'TOTAL')
 *   onBack - callback to return
 */
const SalesReportView = ({ mode = 'TOTAL', onBack }) => {
  const [reportData, setReportData]       = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [selectedDate, setSelectedDate]   = useState(
    new Date().toISOString().split('T')[0]
  );
  
  // Table filters & controls
  const [searchTerm, setSearchTerm]       = useState('');
  const [statusFilter, setStatusFilter]   = useState('ALL');
  const [typeFilter, setTypeFilter]       = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter]   = useState('ALL'); // 'ALL' | 'CASHIER' | 'MOBILE'
  const [selectedOrder, setSelectedOrder] = useState(null);

  const config = useMemo(() => {
    if (mode === 'CASHIER') {
      return {
        title: 'Cashier Sales & Order History',
        badgeText: '(C) Cashier Sales Only',
        badgeBg: '#fff7ed',
        badgeColor: '#c2410c',
        badgeBorder: '#fed7aa',
        icon: CreditCard,
        csvPrefix: 'Cashier_Sales_Report',
        receiptTitle: 'CASHIER SALES REPORT (C)',
        fetchFn: reportsService.getCashierReport,
      };
    }
    if (mode === 'MOBILE') {
      return {
        title: 'Mobile App Sales & Order History',
        badgeText: '(M) Mobile App Sales Only',
        badgeBg: '#dcfce7',
        badgeColor: '#15803d',
        badgeBorder: '#86efac',
        icon: Smartphone,
        csvPrefix: 'Mobile_App_Sales_Report',
        receiptTitle: 'MOBILE APP SALES REPORT (M)',
        fetchFn: reportsService.getMobileAppReport,
      };
    }
    return {
      title: 'Total Sales & Consolidated Order History',
      badgeText: 'All Income (C + M)',
      badgeBg: '#ffedd5',
      badgeColor: '#ea580c',
      badgeBorder: '#fed7aa',
      icon: TrendingUp,
      csvPrefix: 'Total_Consolidated_Sales_Report',
      receiptTitle: 'TOTAL CONSOLIDATED SALES REPORT (C + M)',
      fetchFn: reportsService.getTotalSalesReport,
    };
  }, [mode]);

  // Fetch whenever date or mode changes
  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await config.fetchFn({ date: selectedDate });
        setReportData(res);
      } catch (err) {
        setError(
          `Failed to fetch ${config.title}. Your session may have expired (401). Please log in again.`
        );
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [config, selectedDate]);

  const handlePrint = () => window.print();

  // ── Filtered orders for table ──────────────────────────────────────────────
  const ordersList = useMemo(() => {
    return reportData?.orders || [];
  }, [reportData]);

  const filteredOrders = useMemo(() => {
    if (!ordersList || ordersList.length === 0) return [];
    return ordersList.filter((order) => {
      // Source filter (only in TOTAL mode)
      if (mode === 'TOTAL' && sourceFilter !== 'ALL') {
        if ((order.source || '').toUpperCase() !== sourceFilter) {
          return false;
        }
      }
      // Status filter
      if (statusFilter !== 'ALL' && (order.status || '').toUpperCase() !== statusFilter) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'ALL' && (order.order_type || '').toUpperCase() !== typeFilter) {
        return false;
      }
      // Payment filter (Paid vs Unpaid)
      if (paymentFilter !== 'ALL') {
        const isPaid = (order.payment_status || '').toLowerCase() === 'paid';
        if (paymentFilter === 'PAID' && !isPaid) return false;
        if (paymentFilter === 'UNPAID' && isPaid) return false;
      }
      // Search query (customer name, phone, order id, or items summary)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesName = (order.customer_name || '').toLowerCase().includes(q);
        const matchesPhone = (order.customer_phone || '').toLowerCase().includes(q);
        const matchesId = (order.order_id || '').toLowerCase().includes(q) || String(order.id).includes(q);
        const matchesItems = (order.items_summary || '').toLowerCase().includes(q);
        const matchesSource = (order.source_label || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesId && !matchesItems && !matchesSource) {
          return false;
        }
      }
      return true;
    });
  }, [ordersList, searchTerm, statusFilter, typeFilter, paymentFilter, sourceFilter, mode]);

  // ── Export CSV Report ──────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const ordersToExport = filteredOrders.length > 0 ? filteredOrders : ordersList;

    if (!ordersToExport || ordersToExport.length === 0) {
      alert(`No orders available to export for ${selectedDate || 'selected date'}.`);
      return;
    }

    const headers = [
      'Order ID',
      'Source (C / M)',
      'Customer Name',
      'Phone Number',
      'Order Type',
      'Ordered Items',
      'Items Count',
      'Date',
      'Time',
      'Paid or Unpaid',
      'Payment Method',
      'Order Status',
      'Total Amount (INR)'
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = ordersToExport.map((o) => [
      escapeCSV(o.order_id || `ORD-${o.id}`),
      escapeCSV(o.source_label || (o.source === 'CASHIER' ? '(C) Cashier' : '(M) Mobile')),
      escapeCSV(o.customer_name || (o.source === 'CASHIER' ? 'Walk-in' : 'Guest')),
      escapeCSV(o.customer_phone || ''),
      escapeCSV(o.order_type || ''),
      escapeCSV(o.items_summary || (o.items || []).map(i => `${i.name} x${i.quantity}`).join(', ')),
      escapeCSV(o.items_count || (o.items || []).length || 0),
      escapeCSV(o.date || ''),
      escapeCSV(o.time || ''),
      escapeCSV(o.payment_status || 'Pending'),
      escapeCSV(o.payment_method || ''),
      escapeCSV(o.status || ''),
      escapeCSV(Number(o.total_amount || 0).toFixed(2))
    ]);

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${config.csvPrefix}_${selectedDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ── Badges ─────────────────────────────────────────────────────────────────
  const getSourceBadge = (order) => {
    const isCashier = order.source === 'CASHIER' || (order.source_badge || '').includes('C');
    if (isCashier) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '800',
          background: '#fff7ed',
          color: '#c2410c',
          border: '1px solid #fed7aa',
          whiteSpace: 'nowrap'
        }}>
          (C) Cashier
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
        fontWeight: '800',
        background: '#dcfce7',
        color: '#15803d',
        border: '1px solid #86efac',
        whiteSpace: 'nowrap'
      }}>
        (M) Mobile
      </span>
    );
  };

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
        fontWeight: '700',
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
        background: 'rgba(255, 140, 66, 0.12)',
        color: '#ea580c',
        border: '1px solid rgba(255, 140, 66, 0.3)'
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
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '10px',
          fontSize: '11px',
          fontWeight: '700',
          background: isPaid ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          color: isPaid ? '#15803d' : '#b91c1c',
          border: `1px solid ${isPaid ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
        }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: isPaid ? '#22c55e' : '#ef4444' }} />
          {isPaid ? 'PAID' : 'UNPAID'}
        </span>
        {method && (
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginLeft: '2px' }}>
            {method}
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Activity size={48} style={{ margin: '0 auto 20px', color: 'var(--primary)' }} className="spin-animation" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading {config.title}...</p>
      </div>
    );
  }

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

  const HeaderIcon = config.icon;

  // ── Summary Cards definition ───────────────────────────────────────────────
  const summaryCards = mode === 'TOTAL' ? [
    {
      label: 'Total Consolidated Sales',
      value: `₹${(reportData?.total_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'All amounts income (C + M)',
      icon: IndianRupee,
      color: '#ff8c42'
    },
    {
      label: 'Cashier POS Sales (C)',
      value: `₹${(reportData?.cashier_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `${reportData?.cashier_orders_count || 0} orders via Cashier`,
      icon: CreditCard,
      color: '#ea580c'
    },
    {
      label: 'Mobile App Sales (M)',
      value: `₹${(reportData?.mobile_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: `${reportData?.mobile_orders_count || 0} orders via Mobile App`,
      icon: Smartphone,
      color: '#2d7a4a'
    },
    {
      label: 'Total Orders / Items Sold',
      value: `${reportData?.total_orders || 0} Orders`,
      subtitle: `${(reportData?.items || []).reduce((acc, i) => acc + (i.qty || 0), 0)} items sold`,
      icon: FileSpreadsheet,
      color: '#0284c7'
    }
  ] : mode === 'CASHIER' ? [
    {
      label: 'Total Cashier Sales',
      value: `₹${(reportData?.total_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'Cashier POS orders only (C)',
      icon: IndianRupee,
      color: '#ea580c'
    },
    {
      label: 'Fulfilled Cashier Orders',
      value: reportData?.total_orders ?? 0,
      subtitle: 'Completed / Paid orders',
      icon: CreditCard,
      color: '#2d7a4a'
    },
    {
      label: 'Total Cashier Records',
      value: reportData?.orders?.length ?? (reportData?.total_orders ?? 0),
      subtitle: 'All order records today',
      icon: FileSpreadsheet,
      color: '#ff8c42'
    },
    {
      label: 'Total Qty Sold',
      value: (reportData?.items || []).reduce((acc, i) => acc + (i.qty || 0), 0).toFixed(0),
      subtitle: 'Individual item portions',
      icon: Clock,
      color: '#f4a261'
    }
  ] : [
    {
      label: 'Total Mobile Sales',
      value: `₹${(reportData?.total_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'Customer mobile app orders (M)',
      icon: IndianRupee,
      color: '#ff8c42'
    },
    {
      label: 'Fulfilled Mobile Orders',
      value: reportData?.total_orders ?? 0,
      subtitle: 'Completed / Paid orders',
      icon: Smartphone,
      color: '#2d7a4a'
    },
    {
      label: 'Total Mobile Records',
      value: reportData?.orders?.length ?? (reportData?.total_orders ?? 0),
      subtitle: 'All customer records today',
      icon: FileSpreadsheet,
      color: '#ea580c'
    },
    {
      label: 'Total Qty Sold',
      value: (reportData?.items || []).reduce((acc, i) => acc + (i.qty || 0), 0).toFixed(0),
      subtitle: 'Individual item portions',
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
            id="report-back-btn"
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
              <HeaderIcon size={22} color="var(--primary)" />
              {config.title}
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                padding: '3px 8px',
                borderRadius: '12px',
                background: config.badgeBg,
                color: config.badgeColor,
                border: `1px solid ${config.badgeBorder}`,
                marginLeft: '8px'
              }}>
                {config.badgeText}
              </span>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                id="report-date-picker"
                type="date"
                value={selectedDate === 'all' ? '' : selectedDate}
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
              <button
                type="button"
                onClick={() => setSelectedDate(selectedDate === 'all' ? new Date().toISOString().split('T')[0] : 'all')}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: selectedDate === 'all' ? '#FFF7ED' : 'var(--surface)',
                  color: selectedDate === 'all' ? '#EA580C' : 'var(--text-secondary)',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {selectedDate === 'all' ? 'All Dates (Active)' : 'All Dates'}
              </button>
            </div>

            {/* Download CSV Report Button */}
            <button
              id="report-download-btn"
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
              title="Download Orders as CSV Report"
            >
              <Download size={16} /> Download CSV
            </button>

            {/* Print Report Slip Button */}
            <button
              id="report-print-btn"
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <Icon size={18} />
                </div>
                <div>
                  <h3 style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '0 0 4px 0', fontWeight: '500' }}>
                    {card.label}
                  </h3>
                  <p style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: 'black' }}>
                    {card.value}
                  </p>
                  {card.subtitle && (
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                      {card.subtitle}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Order Type Distribution ────────────────────────────────────── */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          padding: '20px 24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px', color: 'black' }}>
            Order Type Distribution
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px'
          }}>
            {[
              {
                key: 'DINE_IN',
                label: 'Dine-In',
                color: '#ea580c',
                bgLight: 'rgba(255, 140, 66, 0.08)',
                borderCol: 'rgba(255, 140, 66, 0.25)',
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
                color: '#ea580c',
                bgLight: 'rgba(255, 140, 66, 0.08)',
                borderCol: 'rgba(255, 140, 66, 0.25)',
                icon: Bike,
              }
            ].map(({ key, label, color, bgLight, borderCol, icon: TypeIcon }) => {
              const breakdown = reportData?.order_type_breakdown?.[key] || { count: 0, sales: 0.0 };
              const count = breakdown.count || 0;
              const sales = breakdown.sales || 0.0;
              const pct = (reportData?.total_orders || 0) > 0
                ? Math.round((count / (reportData.total_orders || 1)) * 100)
                : 0;

              return (
                <div
                  key={key}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    background: bgLight,
                    border: `1px solid ${borderCol}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0
                  }}>
                    <TypeIcon size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'black' }}>{label}</span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color }}>{pct}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{count} Orders</span>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: 'black' }}>
                        ₹{sales.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Order History Table Section ─────────────────────────────────── */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          marginBottom: '32px'
        }}>
          {/* Controls Bar */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'black' }}>
                    {mode === 'TOTAL' ? 'Consolidated Order History' : mode === 'CASHIER' ? 'Cashier POS Order History' : 'Mobile App Order History'}
                  </h2>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: 'rgba(255, 140, 66, 0.1)',
                    color: '#ea580c',
                    border: '1px solid rgba(255, 140, 66, 0.25)'
                  }}>
                    {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  {mode === 'TOTAL' 
                    ? 'All orders across Cashier and Mobile App with (C) and (M) source identification'
                    : mode === 'CASHIER'
                    ? 'Detailed record of POS counter orders created by Cashier'
                    : 'Customer mobile orders placed through mobile ordering application'}
                </p>
              </div>

              {/* Action and Filter Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Search Input */}
                <div style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  minWidth: '220px'
                }}>
                  <Search size={15} color="#888" style={{ marginRight: '6px' }} />
                  <input
                    id="report-search-input"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search name, phone, item..."
                    style={{
                      border: 'none',
                      outline: 'none',
                      fontSize: '12px',
                      width: '100%',
                      background: 'transparent'
                    }}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'flex' }}
                    >
                      <X size={14} color="#999" />
                    </button>
                  )}
                </div>

                {/* Source Filter (Only in TOTAL mode) */}
                {mode === 'TOTAL' && (
                  <select
                    id="report-source-filter"
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #fed7aa',
                      background: '#fff7ed',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: '#c2410c',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="ALL">All Sources (C + M)</option>
                    <option value="CASHIER">(C) Cashier Only</option>
                    <option value="MOBILE">(M) Mobile App Only</option>
                  </select>
                )}

                {/* Status Filter */}
                <select
                  id="report-status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'white',
                    fontSize: '12px',
                    color: 'black',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">All Status</option>
                  <option value="SERVED">Served / Completed</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="READY">Ready</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                {/* Order Type Filter */}
                <select
                  id="report-type-filter"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'white',
                    fontSize: '12px',
                    color: 'black',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">All Types</option>
                  <option value="DINE_IN">Dine-In</option>
                  <option value="TAKEAWAY">Takeaway</option>
                  <option value="DELIVERY">Delivery</option>
                </select>

                {/* Payment Filter */}
                <select
                  id="report-payment-filter"
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'white',
                    fontSize: '12px',
                    color: 'black',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ALL">All Payments</option>
                  <option value="PAID">Paid Only</option>
                  <option value="UNPAID">Unpaid / Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Order ID</th>
                  <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Source</th>
                  <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Customer Name</th>
                  <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Phone No</th>
                  <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Type</th>
                  <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Ordered Items</th>
                  <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Date & Time</th>
                  <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Payment</th>
                  <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textAlign: 'right' }}>Total (₹)</th>
                  <th style={{ padding: '12px 18px', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="11" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <AlertCircle size={28} style={{ margin: '0 auto 8px', color: '#9ca3af' }} />
                      <p style={{ margin: 0, fontWeight: '600' }}>No orders found matching the filter criteria.</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Try switching dates or clearing the search query.</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: '1px solid var(--border)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#fcfcfc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Order ID */}
                      <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '700', color: '#ff6b35', whiteSpace: 'nowrap' }}>
                        <div>{order.order_id || `ORD-${order.id}`}</div>
                        {order.bill_no && (
                          <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>
                            Bill #{order.bill_no}
                          </div>
                        )}
                      </td>

                      {/* Source: (C) or (M) */}
                      <td style={{ padding: '14px 18px' }}>
                        {getSourceBadge(order)}
                      </td>

                      {/* Customer Name */}
                      <td style={{ padding: '14px 18px', fontSize: '13px', fontWeight: '600', color: 'black' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: '#fff7ed',
                            color: '#ea580c',
                            border: '1px solid #fed7aa',
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
                        {order.customer_phone ? (
                          <a href={`tel:${order.customer_phone}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                            {order.customer_phone}
                          </a>
                        ) : '—'}
                      </td>

                      {/* Order Type */}
                      <td style={{ padding: '14px 18px' }}>
                        {getOrderTypeBadge(order.order_type)}
                      </td>

                      {/* Ordered Items Summary */}
                      <td style={{ padding: '14px 18px', fontSize: '12px', color: '#1f2937', maxWidth: '240px' }}>
                        <div style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: '500'
                        }} title={order.items_summary}>
                          {order.items_summary}
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {order.items_count} item{order.items_count === 1 ? '' : 's'}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: '600', color: 'black' }}>{order.time}</div>
                        <div>{order.date}</div>
                      </td>

                      {/* Payment Status & Method */}
                      <td style={{ padding: '14px 18px' }}>
                        {getPaymentBadge(order.payment_status, order.payment_method)}
                      </td>

                      {/* Order Status */}
                      <td style={{ padding: '14px 18px' }}>
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Total Amount */}
                      <td style={{ padding: '14px 18px', fontSize: '14px', fontWeight: '800', color: 'black', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        ₹{Number(order.total_amount || 0).toFixed(2)}
                      </td>

                      {/* Action Details */}
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          style={{
                            border: '1px solid var(--border)',
                            background: 'white',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            color: '#475569',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}
                          title="View Order Details"
                        >
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Order Details Modal ───────────────────────────────────────────── */}
      {selectedOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }} onClick={() => setSelectedOrder(null)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>
                  Order #{selectedOrder.order_id || selectedOrder.id}
                </h3>
                {getSourceBadge(selectedOrder)}
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Customer:</span>
                  <div style={{ fontWeight: '700', marginTop: '2px' }}>{selectedOrder.customer_name}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Phone:</span>
                  <div style={{ fontWeight: '700', marginTop: '2px' }}>{selectedOrder.customer_phone || 'N/A'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Order Type:</span>
                  <div style={{ fontWeight: '700', marginTop: '2px' }}>{selectedOrder.order_type}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Placed At:</span>
                  <div style={{ fontWeight: '700', marginTop: '2px' }}>{selectedOrder.date_time || `${selectedOrder.date} ${selectedOrder.time}`}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Payment:</span>
                  <div style={{ fontWeight: '700', marginTop: '2px' }}>{selectedOrder.payment_status} ({selectedOrder.payment_method})</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Order Status:</span>
                  <div style={{ fontWeight: '700', marginTop: '2px' }}>{selectedOrder.status}</div>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '12px', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', margin: '0 0 8px 0' }}>Ordered Items</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(selectedOrder.items || []).map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span>{it.name} x{it.quantity}</span>
                      <span style={{ fontWeight: '700' }}>₹{Number(it.amount || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '700' }}>Grand Total</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#ff6b35' }}>₹{Number(selectedOrder.total_amount || 0).toFixed(2)}</span>
              </div>
            </div>

            <div style={{ padding: '12px 20px', background: '#f8fafc', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ff6b35',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hidden Print-Only Thermal Slip Layout ─────────────────────────── */}
      <div className="invoice-modal print-only">
        <div id="printable-report" style={{
          padding: '24px',
          fontFamily: 'monospace',
          fontSize: '12px',
          lineHeight: '1.4',
          color: '#000',
          width: '100%',
          maxWidth: '80mm',
          margin: '0 auto',
          background: 'white'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '12px' }}>
            <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
              {reportData?.restaurant?.name || 'DATAUDIPI HOTEL'}
            </h1>
            <p style={{ margin: '0 0 2px 0', textTransform: 'uppercase' }}>
              {reportData?.restaurant?.address || 'MUGALIVAKKAM, CHENNAI'}
            </p>
            <p style={{ margin: '0 0 6px 0', textTransform: 'uppercase' }}>
              PH: {reportData?.restaurant?.phone || '9597066563'} GSTIN: {reportData?.restaurant?.gstin || '33ADLPV4810B3ZQ'}
            </p>
            <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />
            <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: '4px 0', textTransform: 'uppercase' }}>
              {config.receiptTitle}
            </h2>
            <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />
            <div style={{ textAlign: 'left', fontSize: '11px' }}>
              <p style={{ margin: '0 0 2px 0' }}>Date: {reportData?.date}</p>
              {reportData?.starting_order && (
                <p style={{ margin: '0 0 2px 0' }}>
                  Starting: {reportData.starting_order.id} {reportData.starting_order.source_badge || ''} ({reportData.starting_order.time})
                </p>
              )}
              {reportData?.ending_order && (
                <p style={{ margin: '0 0 4px 0' }}>
                  Ending  : {reportData.ending_order.id} {reportData.ending_order.source_badge || ''} ({reportData.ending_order.time})
                </p>
              )}
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', margin: '6px 0', padding: '4px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>Order / Cust</span>
              <span style={{ textAlign: 'right' }}>Amount</span>
            </div>
          </div>

          <div style={{ minHeight: '80px' }}>
            {(filteredOrders.length > 0 ? filteredOrders : ordersList).map((o, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px dotted #ccc' }}>
                <div>
                  <div>{o.source_badge || (o.source === 'CASHIER' ? '(C)' : '(M)')} {o.order_id || `ORD-${o.id}`}</div>
                  <div style={{ fontSize: '10px', color: '#555' }}>{o.customer_name} ({o.order_type})</div>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 'bold' }}>
                  ₹{Number(o.total_amount || 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px dashed #000', margin: '8px 0', paddingTop: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px' }}>
              <span>TOTAL SALES</span>
              <span>₹{(reportData?.total_sales || 0).toFixed(2)}</span>
            </div>
            {mode === 'TOTAL' && (
              <div style={{ fontSize: '10px', marginTop: '4px', color: '#333' }}>
                <div>(C) Cashier Sales: ₹{(reportData?.cashier_sales || 0).toFixed(2)}</div>
                <div>(M) Mobile Sales : ₹{(reportData?.mobile_sales || 0).toFixed(2)}</div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px' }}>
              <span>Total Orders</span>
              <span>{reportData?.total_orders || 0}</span>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '10px' }}>
            *** THANK YOU ***
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReportView;
