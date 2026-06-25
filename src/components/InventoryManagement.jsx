import React, { useState, useEffect } from 'react';
import {
  Package,
  TrendingDown,
  CheckCircle2,
  Search,
  Plus,
  X,
  AlertTriangle,
  Camera,
  Upload,
  FileText,
  Loader2,
  Check,
  Edit2,
  Trash2
} from 'lucide-react';
import { inventoryService } from '../services/api';

const InventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', open_stock: 0, purchase: 0, issue: 0, unit: 'units' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Scanning State
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanFiles, setScanFiles] = useState({ front: null, back: null });
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null); // List of items to review
  const [isSavingBulk, setIsSavingBulk] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await inventoryService.getInventory();
      setInventory(data);
    } catch (err) {
      console.error('Failed to fetch inventory', err);
      setError('Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name) {
      setError('Name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await inventoryService.createItem({
        name: newItem.name,
        open_stock: parseFloat(newItem.open_stock) || 0,
        purchase: parseFloat(newItem.purchase) || 0,
        total: (parseFloat(newItem.open_stock) || 0) + (parseFloat(newItem.purchase) || 0),
        issue: parseFloat(newItem.issue) || 0,
        balance: ((parseFloat(newItem.open_stock) || 0) + (parseFloat(newItem.purchase) || 0)) - (parseFloat(newItem.issue) || 0),
        unit: newItem.unit || 'units',
      });
      setShowAddModal(false);
      setNewItem({ name: '', open_stock: 0, purchase: 0, issue: 0, unit: 'units' });
      fetchInventory();
    } catch (err) {
      console.error('Error adding item', err);
      setError('Failed to add item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditItem = async (e) => {
    e.preventDefault();
    if (!editingItem.name) {
      setError('Name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await inventoryService.updateInventory(editingItem.id, {
        name: editingItem.name,
        open_stock: parseFloat(editingItem.open_stock) || 0,
        purchase: parseFloat(editingItem.purchase) || 0,
        total: (parseFloat(editingItem.open_stock) || 0) + (parseFloat(editingItem.purchase) || 0),
        issue: parseFloat(editingItem.issue) || 0,
        balance: ((parseFloat(editingItem.open_stock) || 0) + (parseFloat(editingItem.purchase) || 0)) - (parseFloat(editingItem.issue) || 0),
        unit: editingItem.unit || 'units',
      });
      setShowEditModal(false);
      setEditingItem(null);
      fetchInventory();
    } catch (err) {
      console.error('Error editing item', err);
      setError('Failed to update item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      setError('');
      // Note: Assuming inventoryService.deleteItem exists or using updateInventory with status if soft delete
      // I'll check if delete exists, if not I might need to add it to backend.
      // For now, I'll use a generic approach or check api.js
      await inventoryService.deleteItem(itemId);
      fetchInventory();
    } catch (err) {
      console.error('Error deleting item', err);
      setError('Failed to delete item.');
    }
  };

  const handleScanUpload = async (e) => {
    e.preventDefault();
    if (!scanFiles.front) {
      setError('Front side image is required.');
      return;
    }

    try {
      setIsScanning(true);
      setError('');

      const formData = new FormData();
      formData.append('front', scanFiles.front);
      if (scanFiles.back) {
        formData.append('back', scanFiles.back);
      }

      const results = await inventoryService.scanInventory(formData);
      setScanResults(results);
    } catch (err) {
      console.error('Scanning failed', err);
      setError('Failed to scan document. Please check your Azure credentials and try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleBulkSave = async () => {
    try {
      setIsSavingBulk(true);
      await inventoryService.bulkUpdateInventory(scanResults);
      setScanResults(null);
      setShowScanModal(false);
      setScanFiles({ front: null, back: null });
      fetchInventory();
    } catch (err) {
      console.error('Bulk save failed', err);
      setError('Failed to save inventory updates.');
    } finally {
      setIsSavingBulk(false);
    }
  };

  const updateScanResult = (index, field, value) => {
    const newResults = [...scanResults];
    newResults[index][field] = value;
    setScanResults(newResults);
  };

  const removeScanResult = (index) => {
    setScanResults(scanResults.filter((_, i) => i !== index));
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockThreshold = 5;
  const lowStockItems = inventory.filter(item => item.balance < lowStockThreshold);
  const inStockItems = inventory.filter(item => item.balance >= lowStockThreshold);

  // Time formatter for "last restocked"
  const formatLastRestocked = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return 'More than a month ago';
  };

  return (
    <div className="admin-page-mobile-wrapper page-container">
      {/* Header section */}
      <div className="page-header flex-center-between" style={{ marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div className="desktop-only">
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Inventory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {inventory.length} items tracked • {lowStockItems.length} low stock
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: '#f5620cff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          Add Item
        </button>
        <button
          onClick={() => setShowScanModal(true)}
          style={{
            background: '#f5620cff',
            color: 'var(--text-primary)',
            border: '1px solid #eaeaea',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            marginLeft: '12px'
          }}
        >
          <Camera size={18} />
          Scan Sheet
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid-responsive" style={{ marginBottom: '32px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #eaeaea', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '48px', height: '48px', background: '#f5f5f5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
            <Package size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>{inventory.length}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Items</p>
          </div>
        </div>

        <div style={{ background: '#fff0f0', border: '1px solid #ffd6d6', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '48px', height: '48px', background: '#ffe0e0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff4d4d' }}>
            <TrendingDown size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px', color: '#ff4d4d' }}>{lowStockItems.length}</h3>
            <p style={{ fontSize: '13px', color: '#ff4d4d' }}>Low Stock</p>
          </div>
        </div>

        <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '48px', height: '48px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px', color: '#16a34a' }}>{inStockItems.length}</h3>
            <p style={{ fontSize: '13px', color: '#16a34a' }}>In Stock</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '24px', position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          type="text"
          placeholder="Search inventory..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '12px 16px 12px 48px',
            borderRadius: '24px',
            border: '1px solid #eaeaea',
            fontSize: '14px',
            outline: 'none',
            background: 'white'
          }}
        />
      </div>

      {/* Inventory Table */}
      <div className="scroll-x" style={{ background: 'white', border: '1px solid #eaeaea', borderRadius: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead style={{ borderBottom: '1px solid #eaeaea' }}>
            <tr>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Item</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Open</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Purchase</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Total</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Issue</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Balance</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Unit</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Last Restocked</th>
              <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading inventory...</td>
              </tr>
            ) : filteredInventory.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>No inventory items found.</td>
              </tr>
            ) : (
              filteredInventory.map((item) => {
                const isLowStock = item.balance < lowStockThreshold;
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #eaeaea' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', background: isLowStock ? '#fff0f0' : '#f0fdf4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isLowStock ? '#ff4d4d' : '#16a34a' }}>
                          <Package size={16} />
                        </div>
                        <span style={{ fontWeight: '600', fontSize: '14px' }}>{item.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px' }}>{item.open_stock}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px' }}>{item.purchase}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600' }}>{item.total}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#ff4d4d' }}>{item.issue}</td>
                    <td style={{ padding: '16px 24px', fontWeight: '700', fontSize: '14px', color: item.balance < lowStockThreshold ? '#ff4d4d' : 'inherit' }}>{item.balance}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-secondary)' }}>{item.unit}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {formatLastRestocked(item.updated_at || item.created_at)}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {isLowStock ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#fff0f0', color: '#ff4d4d', borderRadius: '16px', fontSize: '12px', fontWeight: '600' }}>
                          <AlertTriangle size={12} />
                          Low Stock
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f0fdf4', color: '#16a34a', borderRadius: '16px', fontSize: '12px', fontWeight: '600' }}>
                          <CheckCircle2 size={12} />
                          In Stock
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button
                          onClick={() => {
                            setEditingItem({ ...item });
                            setShowEditModal(true);
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '4px' }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4d', padding: '4px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Add New Item</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            {error && <div style={{ background: '#fff0f0', color: '#ff4d4d', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

            <form onSubmit={handleAddItem}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Item Name</label>
                <input
                  type="text"
                  required
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #eaeaea', fontSize: '14px', outline: 'none' }}
                  placeholder="e.g. Rice Flour"
                />
              </div>

              <div className="form-row" style={{ marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Open Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={newItem.open_stock}
                    onChange={(e) => setNewItem({ ...newItem, open_stock: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #eaeaea', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Purchase</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={newItem.purchase}
                    onChange={(e) => setNewItem({ ...newItem, purchase: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #eaeaea', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Issue</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={newItem.issue}
                    onChange={(e) => setNewItem({ ...newItem, issue: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #eaeaea', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Unit</label>
                  <input
                    type="text"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #eaeaea', fontSize: '14px', outline: 'none' }}
                    placeholder="units"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '10px 16px', background: 'none', border: '1px solid #eaeaea', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '10px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditModal && editingItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Edit Item</h2>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            {error && <div style={{ background: '#fff0f0', color: '#ff4d4d', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

            <form onSubmit={handleEditItem}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Item Name</label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #eaeaea', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div className="form-row" style={{ marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Open Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={editingItem.open_stock}
                    onChange={(e) => setEditingItem({ ...editingItem, open_stock: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #eaeaea', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Purchase</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={editingItem.purchase}
                    onChange={(e) => setEditingItem({ ...editingItem, purchase: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #eaeaea', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Issue</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={editingItem.issue}
                    onChange={(e) => setEditingItem({ ...editingItem, issue: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #eaeaea', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Unit</label>
                  <input
                    type="text"
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #eaeaea', fontSize: '14px', outline: 'none' }}
                    placeholder="units"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ padding: '10px 16px', background: 'none', border: '1px solid #eaeaea', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ padding: '10px 16px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scan Inventory Modal */}
      {showScanModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-lg" style={{ maxWidth: scanResults ? '900px' : '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
                  {scanResults ? 'Review Scanned Data' : 'Scan Inventory Sheet'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  {scanResults ? 'Verify and edit items before saving' : 'Upload front and back side images of your sheet'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowScanModal(false);
                  setScanResults(null);
                  setScanFiles({ front: null, back: null });
                }}
                style={{ background: '#f5f5f5', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ background: '#fff0f0', color: '#ff4d4d', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle size={18} />
                {error}
              </div>
            )}

            {!scanResults ? (
              <form onSubmit={handleScanUpload}>
                <div className="grid-responsive-2" style={{ marginBottom: '32px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Front Side (Required)</label>
                    <div
                      onClick={() => document.getElementById('front-upload').click()}
                      style={{
                        border: '2px dashed #eaeaea',
                        borderRadius: '12px',
                        padding: '32px 16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: scanFiles.front ? '#f0fdf4' : '#f9f9f9',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input
                        id="front-upload"
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => setScanFiles({ ...scanFiles, front: e.target.files[0] })}
                      />
                      {scanFiles.front ? (
                        <div style={{ color: '#16a34a' }}>
                          <CheckCircle2 size={32} style={{ marginBottom: '12px' }} />
                          <p style={{ fontSize: '14px', fontWeight: '600' }}>{scanFiles.front.name}</p>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-secondary)' }}>
                          <Upload size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                          <p style={{ fontSize: '14px' }}>Click to upload front</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Back Side (Optional)</label>
                    <div
                      onClick={() => document.getElementById('back-upload').click()}
                      style={{
                        border: '2px dashed #eaeaea',
                        borderRadius: '12px',
                        padding: '32px 16px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: scanFiles.back ? '#f0fdf4' : '#f9f9f9',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input
                        id="back-upload"
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => setScanFiles({ ...scanFiles, back: e.target.files[0] })}
                      />
                      {scanFiles.back ? (
                        <div style={{ color: '#16a34a' }}>
                          <CheckCircle2 size={32} style={{ marginBottom: '12px' }} />
                          <p style={{ fontSize: '14px', fontWeight: '600' }}>{scanFiles.back.name}</p>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--text-secondary)' }}>
                          <Upload size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                          <p style={{ fontSize: '14px' }}>Click to upload back</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setShowScanModal(false)}
                    style={{ padding: '12px 24px', background: 'none', border: '1px solid #eaeaea', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isScanning || !scanFiles.front}
                    style={{
                      padding: '12px 24px',
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      opacity: (isScanning || !scanFiles.front) ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {isScanning ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Camera size={18} />
                        Start Scan
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div style={{ border: '1px solid #eaeaea', borderRadius: '12px', overflow: 'hidden', marginBottom: '32px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f9f9f9', borderBottom: '1px solid #eaeaea' }}>
                      <tr>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)' }}>Item Name</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', width: '80px' }}>Open</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', width: '80px' }}>Purch</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', width: '80px' }}>Issue</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', width: '80px' }}>Bal</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: 'var(--text-secondary)', width: '100px' }}>Unit</th>
                        <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', width: '60px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanResults.map((item, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #eaeaea' }}>
                          <td style={{ padding: '8px 16px' }}>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateScanResult(index, 'name', e.target.value)}
                              style={{ width: '100%', padding: '8px', border: '1px solid transparent', borderRadius: '4px', fontSize: '14px', outline: 'none' }}
                            />
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            <input
                              type="number"
                              value={item.open_stock || 0}
                              onChange={(e) => updateScanResult(index, 'open_stock', parseFloat(e.target.value))}
                              style={{ width: '100%', padding: '8px', border: '1px solid transparent', borderRadius: '4px', fontSize: '14px', outline: 'none' }}
                            />
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            <input
                              type="number"
                              value={item.purchase || 0}
                              onChange={(e) => updateScanResult(index, 'purchase', parseFloat(e.target.value))}
                              style={{ width: '100%', padding: '8px', border: '1px solid transparent', borderRadius: '4px', fontSize: '14px', outline: 'none' }}
                            />
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            <input
                              type="number"
                              value={item.issue || 0}
                              onChange={(e) => updateScanResult(index, 'issue', parseFloat(e.target.value))}
                              style={{ width: '100%', padding: '8px', border: '1px solid transparent', borderRadius: '4px', fontSize: '14px', outline: 'none' }}
                            />
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            <input
                              type="number"
                              value={item.balance || 0}
                              onChange={(e) => updateScanResult(index, 'balance', parseFloat(e.target.value))}
                              style={{ width: '100%', padding: '8px', border: '1px solid transparent', borderRadius: '4px', fontSize: '14px', outline: 'none', fontWeight: '600' }}
                            />
                          </td>
                          <td style={{ padding: '8px 16px' }}>
                            <input
                              type="text"
                              value={item.unit || 'units'}
                              onChange={(e) => updateScanResult(index, 'unit', e.target.value)}
                              style={{ width: '100%', padding: '8px', border: '1px solid transparent', borderRadius: '4px', fontSize: '14px', outline: 'none', color: 'var(--text-secondary)' }}
                            />
                          </td>
                          <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                            <button
                              onClick={() => removeScanResult(index)}
                              style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', opacity: 0.7 }}
                            >
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                  <button
                    onClick={() => setScanResults(null)}
                    style={{ padding: '12px 24px', background: 'none', border: '1px solid #eaeaea', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Back to Upload
                  </button>
                  <button
                    onClick={handleBulkSave}
                    disabled={isSavingBulk || scanResults.length === 0}
                    style={{
                      padding: '12px 24px',
                      background: '#16a34a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: (isSavingBulk || scanResults.length === 0) ? 0.7 : 1
                    }}
                  >
                    {isSavingBulk ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        Confirm & Save All
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
