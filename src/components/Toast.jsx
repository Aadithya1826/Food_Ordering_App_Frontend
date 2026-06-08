import React, { useState, useEffect } from 'react';

// Custom event dispatcher for easy access from anywhere (e.g., api.js interceptor)
export const toast = {
  error: (message) => window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type: 'error' } })),
  success: (message) => window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type: 'success' } })),
  info: (message) => window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type: 'info' } })),
};

const Toast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleShowToast = (event) => {
      const { message, type } = event.detail;
      const id = Date.now();
      
      setToasts(prev => [...prev, { id, message, type }]);

      // Auto-remove after 4 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };

    window.addEventListener('show-toast', handleShowToast);
    return () => window.removeEventListener('show-toast', handleShowToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === 'error' ? '#fee2e2' : t.type === 'success' ? '#dcfce7' : '#e0f2fe',
          color: t.type === 'error' ? '#991b1b' : t.type === 'success' ? '#166534' : '#075985',
          border: `1px solid ${t.type === 'error' ? '#f87171' : t.type === 'success' ? '#4ade80' : '#7dd3fc'}`,
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          minWidth: '250px',
          maxWidth: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <span style={{ fontSize: '14px', fontWeight: '500' }}>{t.message}</span>
          <button 
            onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              opacity: 0.6,
              marginLeft: '12px',
              fontSize: '18px'
            }}
          >
            &times;
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Toast;
