import React, { useState, useEffect } from 'react';
import { Download, Plus, Users, QrCode } from 'lucide-react';
import { tableService } from '../services/api';

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 10000); // Poll for real-time status updates
    return () => clearInterval(interval);
  }, []);

  const fetchTables = async () => {
    try {
      const data = await tableService.getTables();
      setTables(data);
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (tableId, currentStatus) => {
    // Optimistic update
    setTables(current => current.map(t => t.id === tableId ? { ...t, is_active: !currentStatus } : t));
    try {
      await tableService.updateTable(tableId, { is_active: !currentStatus });
      fetchTables();
    } catch (err) {
      console.error('Error updating table:', err);
      fetchTables(); // revert
    }
  };

  if (loading) {
    return <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>Loading tables...</div>;
  }

  // Calculate stats
  const total = tables.length;
  const occupiedCount = tables.filter(t => t.is_active && t.current_order_id).length;
  const inactiveCount = tables.filter(t => !t.is_active).length;
  const vacantCount = tables.filter(t => t.is_active && !t.current_order_id).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0px', boxSizing: 'border-box' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-dark)' }}>Tables & QR Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            {occupiedCount} occupied · {vacantCount} vacant · {total} total
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 16px', borderRadius: '8px',
            border: '1px solid rgba(0,0,0,0.1)',
            background: 'var(--surface)', color: 'var(--text-dark)',
            fontWeight: '600', fontSize: '14px', cursor: 'pointer'
          }}>
            <Download size={16} />
            Export QR
          </button>
          <button style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 16px', borderRadius: '8px',
            border: 'none',
            background: '#ff5a36', color: '#fff',
            fontWeight: '600', fontSize: '14px', cursor: 'pointer'
          }}>
            <Plus size={16} />
            Add Table
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: '#fff0ec', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '32px', fontWeight: '700', color: '#ff5a36', marginBottom: '4px' }}>{occupiedCount}</h3>
          <p style={{ fontSize: '15px', color: '#888', fontWeight: '500' }}>Occupied</p>
        </div>
        <div style={{ background: '#e8fdf2', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '32px', fontWeight: '700', color: '#00a36c', marginBottom: '4px' }}>{vacantCount}</h3>
          <p style={{ fontSize: '15px', color: '#888', fontWeight: '500' }}>Vacant</p>
        </div>
        <div style={{ background: '#f5f5f5', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '32px', fontWeight: '700', color: '#666', marginBottom: '4px' }}>{inactiveCount}</h3>
          <p style={{ fontSize: '15px', color: '#888', fontWeight: '500' }}>Inactive</p>
        </div>
      </div>

      {/* Table Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
        gap: '20px',
        paddingBottom: '24px'
      }}>
        {tables.map(table => {
          const isOccupied = table.is_active && table.current_order_id;
          const isVacant = table.is_active && !table.current_order_id;
          const isInactive = !table.is_active;

          let cardBg = '#fafafa';
          let borderColor = '#eee';
          let statusColor = '#888';
          let bubbleBg = '#999';

          if (isOccupied) {
            cardBg = '#fffaf9';
            borderColor = '#ffdcd3';
            statusColor = '#ff5a36';
            bubbleBg = '#ff5a36';
          } else if (isVacant) {
            cardBg = '#f7fdfa';
            borderColor = '#d1f2e2';
            statusColor = '#00a36c';
            bubbleBg = '#00a36c';
          }

          return (
            <div key={table.id} style={{
              background: cardBg,
              border: `1px solid ${borderColor}`,
              borderRadius: '16px',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative'
            }}>
              {/* Table Number Bubble */}
              <div style={{
                background: bubbleBg,
                color: 'white',
                padding: '8px 20px',
                borderRadius: '24px',
                fontWeight: '700',
                fontSize: '18px',
                marginBottom: '16px'
              }}>
                {table.table_number}
              </div>

              {/* Seats Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#888', marginBottom: '16px' }}>
                <Users size={16} />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{table.capacity} Seats</span>
              </div>

              {/* Status */}
              <div style={{ 
                color: statusColor, 
                fontWeight: '700', 
                fontSize: '15px',
                marginBottom: '4px'
              }}>
                {isOccupied ? 'Occupied' : isVacant ? 'Vacant' : 'Inactive'}
              </div>

              {/* Order ID if occupied */}
              <div style={{ height: '20px', fontSize: '13px', color: '#999', fontWeight: '500', marginBottom: '20px' }}>
                {isOccupied ? `#${table.current_order_id}` : ''}
              </div>

              {/* Footer row (QR and Toggle) */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                width: '100%',
                marginTop: 'auto',
                paddingTop: '16px',
                borderTop: `1px solid ${borderColor}`
              }}>
                <button style={{ 
                  background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <QrCode size={20} />
                </button>
                
                {/* Custom Toggle Switch */}
                <div 
                  onClick={() => handleToggleActive(table.id, table.is_active)}
                  style={{
                    width: '40px',
                    height: '22px',
                    borderRadius: '12px',
                    background: table.is_active ? statusColor : '#ccc',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#fff',
                    position: 'absolute',
                    top: '2px',
                    left: table.is_active ? '20px' : '2px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TableManagement;
