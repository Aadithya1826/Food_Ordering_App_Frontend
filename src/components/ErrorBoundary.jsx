import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: 'var(--background)',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'var(--surface)',
            padding: '40px',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
            maxWidth: '500px',
            width: '100%',
            border: '1px solid var(--border)'
          }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              background: '#fee2e2', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <AlertTriangle size={32} color="#dc2626" />
            </div>
            
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px', color: '#111827' }}>
              Something went wrong
            </h1>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.5' }}>
              We've encountered an unexpected issue while loading this page. Our team has been notified.
            </p>
            
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.opacity = 0.9}
              onMouseOut={e => e.currentTarget.style.opacity = 1}
            >
              <RefreshCw size={18} />
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
