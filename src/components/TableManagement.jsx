import React, { useState, useEffect } from 'react';
import { Download, Plus, Users, QrCode, Edit2, Trash2, X, Search, Clock } from 'lucide-react';
import { tableService } from '../services/api';

const TableManagement = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({ table_number: '', capacity: 4, qr_code: '', status: 'Vacant' });
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 10000); // Poll for real-time status updates
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOpenModal = () => {
      setEditingTable(null);
      setFormData({ table_number: '', capacity: 4, qr_code: '', status: 'Vacant' });
      setIsModalOpen(true);
    };
    window.addEventListener('open-add-table-modal', handleOpenModal);
    return () => window.removeEventListener('open-add-table-modal', handleOpenModal);
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
    <div className="admin-page-mobile-wrapper page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
      
      {/* Header section */}
      <div className="page-header desktop-only" style={{ marginBottom: '24px' }}>
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

      {/* Stats Cards Desktop */}
      <div className="grid-responsive desktop-only" style={{ marginBottom: '32px' }}>
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

      {/* Mobile Live Floor & Search */}
      <div className="mobile-only-orders" style={{ background: 'linear-gradient(135deg, #ff6b35, #ff4b2b)', borderRadius: '24px', padding: '24px', color: 'white', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        <h3 style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1px', marginBottom: '16px', opacity: 0.9 }}>LIVE FLOOR</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '36px', fontWeight: '800', lineHeight: '1' }}>{total > 0 ? Math.round((occupiedCount / total) * 100) : 0}%</div>
            <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '8px' }}>Occupancy - {occupiedCount} of {total} tables seated</div>
          </div>
          
          <div style={{ width: '70px', height: '70px', position: 'relative' }}>
            <svg viewBox="0 0 36 36" className="circular-chart" style={{ width: '100%', height: '100%' }}>
              <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="circle" strokeDasharray={`${total > 0 ? (occupiedCount / total) * 100 : 0}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', opacity: 0.9, fontWeight: '700', marginBottom: '4px' }}>OCCUPIED</div>
            <div style={{ fontSize: '18px', fontWeight: '700' }}>{occupiedCount}</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', opacity: 0.9, fontWeight: '700', marginBottom: '4px' }}>VACANT</div>
            <div style={{ fontSize: '18px', fontWeight: '700' }}>{vacantCount}</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', opacity: 0.9, fontWeight: '700', marginBottom: '4px' }}>INACTIVE</div>
            <div style={{ fontSize: '18px', fontWeight: '700' }}>{inactiveCount}</div>
          </div>
        </div>
      </div>

      <div className="mobile-only-orders" style={{ marginBottom: '24px' }}>
        <div style={{ background: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', padding: '10px 16px', border: '1px solid #eee', marginBottom: '16px' }}>
          <Search size={16} color="#aaa" />
          <input type="text" placeholder="Find a table or order" style={{ border: 'none', outline: 'none', marginLeft: '8px', fontSize: '13px', width: '100%' }} />
        </div>
        <div className="scroll-x" style={{ display: 'flex', gap: '12px', paddingBottom: '8px' }}>
          <button onClick={() => setActiveFilter('All')} style={{ padding: '6px 16px', borderRadius: '20px', border: activeFilter === 'All' ? 'none' : '1px solid #ddd', background: activeFilter === 'All' ? '#ff6b35' : 'white', color: activeFilter === 'All' ? 'white' : '#666', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s' }}>All {total}</button>
          <button onClick={() => setActiveFilter('Occupied')} style={{ padding: '6px 16px', borderRadius: '20px', border: activeFilter === 'Occupied' ? 'none' : '1px solid #ddd', background: activeFilter === 'Occupied' ? '#ff6b35' : 'white', color: activeFilter === 'Occupied' ? 'white' : '#666', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s' }}>Occupied {occupiedCount}</button>
          <button onClick={() => setActiveFilter('Vacant')} style={{ padding: '6px 16px', borderRadius: '20px', border: activeFilter === 'Vacant' ? 'none' : '1px solid #ddd', background: activeFilter === 'Vacant' ? '#ff6b35' : 'white', color: activeFilter === 'Vacant' ? 'white' : '#666', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.2s' }}>Vacant {vacantCount}</button>
        </div>
      </div>

      <div className="mobile-only-orders" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <span style={{ fontSize: '18px' }}>🍴</span>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111' }}>Floor Plan</h3>
      </div>

      {/* Table Grid */}
      <div className="manager-table-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
        gap: '20px',
        paddingBottom: '24px'
      }}>
        {tables.filter(table => {
          if (activeFilter === 'All') return true;
          const isOccupied = table.is_active && (table.status === 'Occupied' || table.current_order_id);
          const isReserved = table.is_active && table.status === 'Reserved' && !table.current_order_id;
          const isVacant = table.is_active && !isOccupied && !isReserved;
          if (activeFilter === 'Occupied') return isOccupied;
          if (activeFilter === 'Vacant') return isVacant;
          return true;
        }).map(table => {
          const isOccupied = table.is_active && (table.status === 'Occupied' || table.current_order_id);
          const isReserved = table.is_active && table.status === 'Reserved' && !table.current_order_id;
          const isVacant = table.is_active && !isOccupied && !isReserved;

          let cardBg = '#ffffff';
          let borderColor = '#f0f0f0';
          let statusColor = '#888';
          let displayStatus = 'Inactive';
          let pillBg = '#f5f5f5';

          if (isOccupied) {
            borderColor = '#ff6b35';
            statusColor = 'white';
            pillBg = '#ff6b35';
            displayStatus = 'Occupied';
          } else if (isReserved) {
            borderColor = '#3b82f6';
            statusColor = 'white';
            pillBg = '#3b82f6';
            displayStatus = 'Reserved';
          } else if (isVacant) {
            borderColor = '#10B981';
            statusColor = 'white';
            pillBg = '#10B981';
            displayStatus = 'Vacant';
          }

          return (
            <div key={table.id} style={{
              background: cardBg,
              border: `1px solid ${borderColor}`,
              borderRadius: '20px',
              padding: '16px',
              paddingTop: '20px',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
              marginTop: '16px'
            }}>
              
              <div style={{
                  position: 'absolute',
                  top: '-16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: pillBg,
                  color: statusColor,
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '14px',
                  border: '3px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                {table.table_number.replace('T-', '')}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontWeight: '800', fontSize: '14px', color: '#111' }}>
                  Table {table.table_number.replace('T-', '')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#888', fontSize: '11px', fontWeight: '700' }}>
                  <Users size={12} />
                  {table.capacity}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ 
                  background: pillBg,
                  color: statusColor,
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: '800',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}>
                  {displayStatus}
                </div>
                {table.qr_code && (
                  <button onClick={() => openModal(table)} style={{ background: 'none', border: 'none', padding: 0, color: '#ff6b35', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: '700' }}>
                     <QrCode size={12} /> View QR
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '12px', borderTop: '1px dashed #eee', gap: '4px' }}>
                <div style={{ fontSize: '11px', color: '#999', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Clock size={12} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{table.current_order_id ? `#${table.current_order_id}` : 'No order'}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', margin: 0 }}>
                    <div style={{ position: 'relative', width: '28px', height: '16px', background: table.is_active ? '#10B981' : '#E5E7EB', borderRadius: '8px', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: '2px', left: table.is_active ? '14px' : '2px', width: '12px', height: '12px', background: 'white', borderRadius: '50%', transition: 'left 0.2s' }} />
                    </div>
                    <input 
                      type="checkbox" 
                      checked={table.is_active}
                      onChange={() => handleToggleActive(table.id, table.is_active)}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <button onClick={() => openModal(table)} style={{ background: 'none', border: 'none', padding: 0, color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 'auto', minHeight: 'auto', width: '24px', height: '24px' }} title="Edit Table">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(table.id)} style={{ background: 'none', border: 'none', padding: 0, color: '#ff4b2b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 'auto', minHeight: 'auto', width: '24px', height: '24px' }} title="Delete Table">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
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
                  disabled={editingTable && editingTable.current_order_id}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box', background: (editingTable && editingTable.current_order_id) ? '#f5f5f5' : 'white', cursor: (editingTable && editingTable.current_order_id) ? 'not-allowed' : 'default' }}
                >
                  <option value="Vacant">Vacant</option>
                  <option value="Occupied">Occupied (Manual block)</option>
                  <option value="Reserved">Reserved</option>
                </select>
                {editingTable && editingTable.current_order_id ? (
                  <p style={{ fontSize: '12px', color: '#ff6b35', marginTop: '6px', fontWeight: '600' }}>
                    Cannot change status. This table currently has an active order (#{editingTable.current_order_id}).
                  </p>
                ) : (
                  <p style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                    Tables with active orders will automatically appear as Occupied.
                  </p>
                )}
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
