import React, { useEffect, useState } from 'react';
import { ArrowLeft, Printer, Smartphone, Activity, Package, IndianRupee, Clock, Utensils, ShoppingBag, Bike } from 'lucide-react';
import { reportsService } from '../services/api';

/**
 * MobileAppSalesReport
 *
 * Dedicated view for mobile app (customer-originated) order sales.
 * Orders are identified server-side by: user_id IS NULL AND customer_phone IS NOT NULL.
 *
 * Props:
 *   onBack  – callback to return to the main Reports page
 */
const MobileAppSalesReport = ({ onBack }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

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

  const hasOrders = reportData && reportData.total_orders > 0;

  // ── Helper: summary cards ─────────────────────────────────────────────────
  const summaryCards = [
    {
      label: 'Total Mobile Sales',
      value: `₹${(reportData?.total_sales || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: IndianRupee,
      color: '#ff8c42'
    },
    {
      label: 'Total Orders',
      value: reportData?.total_orders ?? 0,
      icon: Smartphone,
      color: '#2d7a4a'
    },
    {
      label: 'Item Types Sold',
      value: reportData?.items?.length ?? 0,
      icon: Package,
      color: '#6c63ff'
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
              Mobile App Sales Report
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <input
              id="mobile-report-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'black',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            />
            <button
              id="mobile-report-print-btn"
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '6px',
                background: '#f3f4f6',
                border: '1px solid #111',
                color: '#111',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: '1px 1px 0px #111'
              }}
            >
              <Printer size={18} /> Print Report
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
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
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
                  <p style={{ fontSize: '24px', fontWeight: '700', margin: 0, color: 'black' }}>
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
              No eligible paid mobile app orders exist for {reportData?.date || selectedDate}.
              Try selecting a different date.
            </p>
          </div>
        )}

        {/* ── Item-wise table ─────────────────────────────────────────────── */}
        {hasOrders && (
          <div style={{
            background: 'var(--surface)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            marginBottom: '24px'
          }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '15px', fontWeight: '600', margin: 0, color: 'black' }}>Item Wise Sales</h2>
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
                  <td colSpan={3} style={{ padding: '14px 24px', fontSize: '13px', fontWeight: '700', color: 'black' }}>Total</td>
                  <td style={{ padding: '14px 24px', fontSize: '15px', fontWeight: '700', color: '#ff8c42', textAlign: 'right' }}>
                    ₹{(reportData.total_sales || 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ── Hourly breakdown table ──────────────────────────────────────── */}
        {hasOrders && (
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

          <div style={{ borderTop: '1px dashed #000', marginTop: '12px', paddingTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '15px' }}>
              <span>TOTAL SALES</span>
              <span>{(reportData?.total_sales || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileAppSalesReport;
