import React from 'react';

const FutureSaleModal = ({ show, setShow, futureSale, setFutureSale }) => {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{ backgroundColor: 'white', padding: '24px', width: '400px', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>Future Sale Details</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input type="text" placeholder="Customer Name" value={futureSale.name} onChange={(e) => setFutureSale({...futureSale, name: e.target.value})} style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
          <input type="text" placeholder="Address" value={futureSale.address} onChange={(e) => setFutureSale({...futureSale, address: e.target.value})} style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
          <input type="text" placeholder="City" value={futureSale.city} onChange={(e) => setFutureSale({...futureSale, city: e.target.value})} style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
          <input type="text" placeholder="Phone Number" value={futureSale.phone} onChange={(e) => setFutureSale({...futureSale, phone: e.target.value})} style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }} />
          <input type="date" placeholder="Delivery Date" value={futureSale.deliveryDate} onChange={(e) => setFutureSale({...futureSale, deliveryDate: e.target.value})} style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontFamily: 'inherit' }} />
          <textarea placeholder="Notes" value={futureSale.notes || ''} onChange={(e) => setFutureSale({...futureSale, notes: e.target.value})} style={{ padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }}></textarea>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
          <button 
            onClick={() => setShow(false)} 
            style={{ padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', border: 'none' }}
          >
            Cancel
          </button>
          <button 
            onClick={() => setShow(false)} 
            style={{ padding: '10px 20px', backgroundColor: 'var(--accent-color)', color: 'white', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', border: 'none' }}
          >
            Save Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default FutureSaleModal;
