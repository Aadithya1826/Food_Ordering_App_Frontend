import React, { useState, useEffect } from 'react';
import { Download, Plus, Users, QrCode, Edit2, Trash2, X } from 'lucide-react';
import { tableService } from '../services/api';

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({ table_number: '', capacity: 4, qr_code: '', status: 'Vacant' });

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

  const handleDelete = async (tableId) => {
    if (!window.confirm("Are you sure you want to delete this table?")) return;
    
    try {
      await tableService.deleteTable(tableId);
      fetchTables();
    } catch (err) {
      console.error('Error deleting table:', err);
      alert('Could not delete table. It might have active orders.');
    }
  };

  const openModal = (table = null) => {
    if (table) {
      setEditingTable(table);
      setFormData({ 
        table_number: table.table_number, 
        capacity: table.capacity || 4, 
        qr_code: table.qr_code || '',
        status: table.status || 'Vacant'
      });
    } else {
      setEditingTable(null);
      setFormData({ table_number: '', capacity: 4, qr_code: '', status: 'Vacant' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTable) {
        await tableService.updateTable(editingTable.id, formData);
      } else {
        await tableService.createTable(formData);
      }
      setIsModalOpen(false);
      fetchTables();
    } catch (err) {
      console.error('Error saving table:', err);
      alert('Failed to save table.');
    }
  };

  if (loading) {
    return <div style={{ padding: '24px', color: 'var(--text-secondary)' }}>Loading tables...</div>;
  }

  // Calculate stats
  const total = tables.length;
  const occupiedCount = tables.filter(t => t.is_active && (t.status === 'Occupied' || t.current_order_id)).length;
  const inactiveCount = tables.filter(t => !t.is_active).length;
  const reservedCount = tables.filter(t => t.is_active && t.status === 'Reserved' && !t.current_order_id).length;
  const vacantCount = tables.filter(t => t.is_active && t.status !== 'Occupied' && t.status !== 'Reserved' && !t.current_order_id).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0px', boxSizing: 'border-box' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-dark)' }}>Tables & QR Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
            {occupiedCount} occupied · {vacantCount} vacant · {reservedCount} reserved · {total} total
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
          <button 
            onClick={() => openModal()}
            style={{
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: '#fff0ec', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '32px', fontWeight: '700', color: '#ff5a36', marginBottom: '4px' }}>{occupiedCount}</h3>
          <p style={{ fontSize: '15px', color: '#888', fontWeight: '500' }}>Occupied</p>
        </div>
        <div style={{ background: '#e8fdf2', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '32px', fontWeight: '700', color: '#00a36c', marginBottom: '4px' }}>{vacantCount}</h3>
          <p style={{ fontSize: '15px', color: '#888', fontWeight: '500' }}>Vacant</p>
        </div>
        <div style={{ background: '#f0f5ff', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '32px', fontWeight: '700', color: '#3b82f6', marginBottom: '4px' }}>{reservedCount}</h3>
          <p style={{ fontSize: '15px', color: '#888', fontWeight: '500' }}>Reserved</p>
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
          const isOccupied = table.is_active && (table.status === 'Occupied' || table.current_order_id);
          const isReserved = table.is_active && table.status === 'Reserved' && !table.current_order_id;
          const isVacant = table.is_active && !isOccupied && !isReserved;

          let cardBg = '#fafafa';
          let borderColor = '#eee';
          let statusColor = '#888';
          let bubbleBg = '#999';
          let displayStatus = 'Inactive';

          if (isOccupied) {
            cardBg = '#fffaf9';
            borderColor = '#ffdcd3';
            statusColor = '#ff5a36';
            bubbleBg = '#ff5a36';
            displayStatus = 'Occupied';
          } else if (isReserved) {
            cardBg = '#f0f6ff';
            borderColor = '#d1e3ff';
            statusColor = '#3b82f6';
            bubbleBg = '#3b82f6';
            displayStatus = 'Reserved';
          } else if (isVacant) {
            cardBg = '#f7fdfa';
            borderColor = '#d1f2e2';
            statusColor = '#00a36c';
            bubbleBg = '#00a36c';
            displayStatus = 'Vacant';
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
              
              {/* Actions Header */}
              <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                <button onClick={() => openModal(table)} style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}>
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(table.id)} style={{ background: 'transparent', border: 'none', color: '#ff5a36', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Table Number Bubble */}
              <div style={{
                background: bubbleBg,
                color: 'white',
                padding: '8px 20px',
                borderRadius: '24px',
                fontWeight: '700',
                fontSize: '18px',
                marginBottom: '16px',
                marginTop: '8px'
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
                {displayStatus}
              </div>

              {/* Order ID if occupied */}
              <div style={{ height: '20px', fontSize: '13px', color: '#999', fontWeight: '500', marginBottom: '20px' }}>
                {table.current_order_id ? `#${table.current_order_id}` : ''}
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
                <button 
                  onClick={() => openModal(table)}
                  title={table.qr_code ? "QR Code Configured (Click to edit)" : "No QR Code (Click to configure)"}
                  style={{ 
                    background: 'transparent', border: 'none', color: table.qr_code ? '#00a36c' : '#aaa', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                  <QrCode size={20} />
                </button>
                
                {/* Custom Toggle Switch */}
                <div 
                  onClick={() => handleToggleActive(table.id, table.is_active)}
                  title={table.is_active ? "Mark Inactive" : "Mark Active"}
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

      {/* Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--surface)', padding: '32px', borderRadius: '16px',
            width: '100%', maxWidth: '400px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>
                {editingTable ? 'Edit Table' : 'Add New Table'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Table Number/Name</label>
                <input 
                  type="text" 
                  value={formData.table_number}
                  onChange={e => setFormData({...formData, table_number: e.target.value})}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                  placeholder="e.g. T-01"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Seating Capacity</label>
                <input 
                  type="number" 
                  min="1"
                  value={formData.capacity}
                  onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Table Status</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                >
                  <option value="Vacant">Vacant</option>
                  <option value="Occupied">Occupied (Manual block)</option>
                  <option value="Reserved">Reserved</option>
                </select>
                <p style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                  Tables with active orders will automatically appear as Occupied.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>QR Code Link / URL</label>
                <input 
                  type="text" 
                  value={formData.qr_code}
                  onChange={e => setFormData({...formData, qr_code: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                  placeholder="https://example.com/menu/t1"
                />
                <p style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>You can link an external menu or QR target URL here.</p>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', background: 'white', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: '#ff5a36', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                >
                  {editingTable ? 'Save Changes' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagement;
