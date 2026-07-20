import React from 'react';

const LandingScreen = ({ setIsPosActive }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg-main)' }}>
      <div style={{ padding: '40px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px' }}>DATA UDIPI HOTEL</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Cashier POS System</p>
        
        <button 
          onClick={() => setIsPosActive(true)}
          style={{
            backgroundColor: 'var(--accent-color)',
            color: 'white',
            border: 'none',
            padding: '16px 32px',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            width: '100%',
            transition: 'transform 0.1s, backgroundColor 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'var(--accent-color)'}
          onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
        >
          Open Cashier Terminal
        </button>
      </div>
    </div>
  );
};

export default LandingScreen;
