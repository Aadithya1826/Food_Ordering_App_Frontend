import React, { useEffect } from 'react';
import { ArrowLeft, Printer, Activity } from 'lucide-react';
import { reportsService } from '../services/api';
import '../styles/modal.css'; // ensure invoice-modal styles are present for printing

const ReportView = ({ type, onBack }) => {
  const [reportData, setReportData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        if (type === 'hourly') {
          const res = await reportsService.getHourlyReport({ date: selectedDate });
          setReportData(res);
        } else if (type === 'item') {
          const res = await reportsService.getItemWiseReport({ date: selectedDate });
          setReportData(res);
        }
      } catch (err) {
        setError('Failed to fetch report data. Your session may have expired (401 Unauthorized), please try logging in again.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [type, selectedDate]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Activity size={48} style={{ margin: '0 auto 20px', color: 'var(--primary)' }} className="spin-animation" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading report data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: 'red' }}>{error}</p>
        <button className="primary-button" onClick={onBack} style={{ marginTop: '20px' }}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="report-view-container" style={{ paddingBottom: '40px' }}>
      
      {/* App UI - Visible to user, hidden during print */}
      <div className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <button 
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
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: '0' }}>
              {type === 'hourly' ? 'Hourly Sales Report' : 'Item Wise Sales Report'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '14px' }}>
              Date: {reportData?.date || selectedDate} | Starting Bill: {reportData?.starting_bill?.no || '-'} | Ending Bill: {reportData?.ending_bill?.no || '-'}
            </p>
          </div>
          
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input 
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
            <button onClick={handlePrint} style={{ 
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
            }}>
              <Printer size={18} /> Print Receipt
            </button>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 8px 0' }}>Total Sales</h3>
            <p style={{ fontSize: '28px', fontWeight: '700', margin: '0', color: 'black' }}>₹{reportData.total_sales.toFixed(2)}</p>
          </div>
          {type === 'item' && (
            <>
              <div style={{ background: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 8px 0' }}>Total Items Types Sold</h3>
                <p style={{ fontSize: '28px', fontWeight: '700', margin: '0', color: 'black' }}>{reportData.items.length}</p>
              </div>
              <div style={{ background: 'var(--surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '0 0 8px 0' }}>Total Quantity Sold</h3>
                <p style={{ fontSize: '28px', fontWeight: '700', margin: '0', color: 'black' }}>
                  {reportData.items.reduce((acc, curr) => acc + curr.qty, 0).toFixed(0)}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Data Table */}
        <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                {type === 'hourly' ? (
                  <>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Timeline</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'right' }}>Sales Amount (₹)</th>
                  </>
                ) : (
                  <>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Item Name</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'right' }}>Rate (₹)</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'right' }}>Quantity</th>
                    <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'right' }}>Amount (₹)</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {type === 'hourly' ? (
                reportData.timeline.map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '500', color: 'black' }}>{t.time}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: 'black', textAlign: 'right' }}>{Math.round(t.sales)}</td>
                  </tr>
                ))
              ) : (
                reportData.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '500', color: 'black' }}>{item.name}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'right' }}>{item.rate.toFixed(2)}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'right' }}>{item.qty.toFixed(2)}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: 'black', textAlign: 'right' }}>{item.amount.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden Receipt Layout - Only visible during print */}
      <div className="invoice-modal print-only">
        <div id="printable-report" style={{ 
          padding: '24px', 
          fontFamily: 'monospace', 
          fontSize: '13px', 
          lineHeight: '1.4',
          color: '#000',
          width: '100%',
          maxWidth: '80mm', /* Standard thermal printer width */
          margin: '0 auto',
          background: 'white'
        }}>
          
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>DATAUDIPI HOTEL</h1>
            <p style={{ margin: '0 0 2px 0' }}>MUGALIVAKKAM, CHENNAI</p>
            <p style={{ margin: '0 0 8px 0' }}>PH:9597066563 GSTIN : 33ADLPV4810B3ZQ</p>
            
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '16px 0 12px 0', textTransform: 'uppercase' }}>
              {type === 'hourly' ? 'HOURLY REPORT' : 'ITEM WISE REPORT'}
            </h2>
            
            <div style={{ textAlign: 'left', marginBottom: '12px' }}>
              {type === 'hourly' ? (
                <p style={{ margin: '0 0 8px 0' }}>Date : {reportData.date}</p>
              ) : (
                <>
                  <p style={{ margin: '0 0 2px 0' }}>Print Date : {reportData.date}</p>
                  <p style={{ margin: '0 0 2px 0' }}>Bills From : {reportData.date}</p>
                  <p style={{ margin: '0 0 8px 0' }}>To         : {reportData.date}</p>
                </>
              )}
              
              <p style={{ margin: '0 0 4px 0' }}>
                Starting BillNo.: {reportData.starting_bill?.no || '-'} - {reportData.starting_bill?.time || '-'}
              </p>
              <p style={{ margin: '0 0 8px 0' }}>
                Ending BillNo.  : {reportData.ending_bill?.no || '-'} - {reportData.ending_bill?.time || '-'}
              </p>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', margin: '8px 0', padding: '8px 0' }}>
            {type === 'hourly' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <span>Timeline</span>
                <span>SalesAmount</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 55px 45px 65px', gap: '4px', fontWeight: 'bold' }}>
                <span>Item Name</span>
                <span style={{ textAlign: 'right' }}>Rate</span>
                <span style={{ textAlign: 'right' }}>Qty</span>
                <span style={{ textAlign: 'right' }}>Amount</span>
              </div>
            )}
          </div>

          <div style={{ minHeight: '100px' }}>
            {type === 'hourly' ? (
              reportData.timeline.map((t, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                  <span>{t.time}</span>
                  <span>{Math.round(t.sales)}</span>
                </div>
              ))
            ) : (
              reportData.items.map((item, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 55px 45px 65px', gap: '4px', margin: '4px 0' }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                  <span style={{ textAlign: 'right' }}>{item.rate.toFixed(2)}</span>
                  <span style={{ textAlign: 'right' }}>{item.qty.toFixed(2)}</span>
                  <span style={{ textAlign: 'right' }}>{item.amount.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>

          <div style={{ borderTop: '1px dashed #000', marginTop: '12px', paddingTop: '12px' }}>
            {type === 'hourly' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '15px' }}>
                <span>TOTAL SALES</span>
                <span>{reportData.total_sales.toFixed(2)}</span>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span>Actual Sales</span>
                  <span>:  {reportData.actual_sales.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0' }}>
                  <span>CGST</span>
                  <span>:  {reportData.cgst.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '2px 0', borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '4px' }}>
                  <span>SGST</span>
                  <span>:  {reportData.sgst.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '15px' }}>
                  <span>Total Sales</span>
                  <span>:  {reportData.total_sales.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ReportView;
