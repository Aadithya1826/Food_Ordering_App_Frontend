import React from 'react';

const InvoiceModal = ({ show, lastBillNo, lastOrderType, lastPaymentMethod, lastFutureSale, lastCart, lastBillAmt }) => {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div className="invoice-modal" style={{ backgroundColor: 'white', padding: '24px', width: '320px', fontFamily: 'monospace', color: 'black', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '4px', fontSize: '18px' }}>DATA UDIPI HOTEL</h3>
        <p style={{ textAlign: 'center', fontSize: '12px', margin: 0 }}>M G R Nagar, Chennai</p>
        <p style={{ textAlign: 'center', fontSize: '12px', marginBottom: '16px' }}>Phone: 31595014</p>

        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', marginBottom: '12px', border: '1px solid black', padding: '4px' }}>
          COUNTER POS
        </div>

        <hr style={{ borderTop: '1px dashed black', marginBottom: '8px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
          <span>Bill No: <strong>{lastBillNo}</strong></span>
          <span>{new Date().toLocaleString()}</span>
        </div>
        <div style={{ fontSize: '13px', marginBottom: '8px', textAlign: 'left' }}>
          Mode: <strong>{lastOrderType === 'dine-in' ? 'Dine In' : 'Take Away'}</strong> | Pay: <strong>{lastPaymentMethod}</strong>
        </div>

        {lastFutureSale && lastFutureSale.name && (
          <div style={{ fontSize: '12px', marginBottom: '8px', textAlign: 'left', border: '1px solid black', padding: '4px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '2px', textAlign: 'center', fontSize: '13px' }}>FUTURE SALE</div>
            <div>Name: {lastFutureSale.name}</div>
            {lastFutureSale.phone && <div>Phone: {lastFutureSale.phone}</div>}
            {lastFutureSale.deliveryDate && <div>Delivery: {lastFutureSale.deliveryDate}</div>}
            {lastFutureSale.city && <div>City: {lastFutureSale.city}</div>}
          </div>
        )}
        <hr style={{ borderTop: '1px dashed black', marginBottom: '12px' }} />

        <table style={{ width: '100%', fontSize: '13px', marginBottom: '12px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', paddingBottom: '8px' }}>Item</th>
              <th style={{ textAlign: 'right', paddingBottom: '8px' }}>Qty</th>
              <th style={{ textAlign: 'right', paddingBottom: '8px' }}>Amt</th>
            </tr>
          </thead>
          <tbody>
            {lastCart.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', padding: '16px 0', color: '#6b7280', fontStyle: 'italic' }}>
                  No items in bill
                </td>
              </tr>
            ) : (
              lastCart.map(item => (
                <tr key={item.id}>
                  <td style={{ paddingBottom: '4px' }}>
                    <div>{item.description}</div>
                    <div style={{ fontSize: '11px', color: '#4b5563' }}>{item.product_code}</div>
                  </td>
                  <td style={{ textAlign: 'right', paddingBottom: '4px' }}>{item.qty}</td>
                  <td style={{ textAlign: 'right', paddingBottom: '4px' }}>₹{item.amount.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <hr style={{ borderTop: '1px dashed black', marginBottom: '12px' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '15px' }}>
          <span>TOTAL</span>
          <span>₹{lastBillAmt.toFixed(2)}</span>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', fontStyle: 'italic' }}>
          Thank you! Visit again.
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: '#555', borderTop: '1px solid #ddd', paddingTop: '8px' }}>
          <div>Techwizard AI partners</div>
          <div>vasu@t-wi.com</div>
        </div>

      </div>
    </div>
  );
};

export default InvoiceModal;
