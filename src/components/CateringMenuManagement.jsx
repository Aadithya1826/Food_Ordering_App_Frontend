import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { toast } from '../components/Toast';

const CateringMenuManagement = () => {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [newMenu, setNewMenu] = useState({
    name: '',
    code: '',
    price: '',
    description: '',
    minimum_order_quantity: '50'
  });

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/catering');
      setMenus(response.data);
    } catch (error) {
      console.error('Failed to fetch catering menus:', error);
      toast.error('Failed to load catering menus');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailable = async (item) => {
    try {
      const response = await api.patch(`/api/v1/catering/${item.id}`, {
        is_available: !item.is_available,
      });
      setMenus(menus.map(i => i.id === item.id ? response.data : i));
    } catch (error) {
      console.error('Error updating item availability', error);
      alert('Failed to update availability.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this catering menu?")) {
      try {
        await api.delete(`/api/v1/catering/${itemId}`);
        setMenus(menus.filter(i => i.id !== itemId));
        toast.success('Deleted successfully');
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("Failed to delete item.");
      }
    }
  };

  const openEditModal = (item) => {
    setEditingMenu(item);
    setNewMenu({
      name: item.name,
      code: item.code || '',
      price: item.price,
      description: item.description || '',
      minimum_order_quantity: item.minimum_order_quantity?.toString() || '50',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMenu(null);
    setNewMenu({ name: '', code: '', price: '', description: '', minimum_order_quantity: '50' });
  };

  const handleAddMenu = async (e) => {
    e.preventDefault();
    if (!newMenu.name || !newMenu.price) {
      alert("Please fill all required fields");
      return;
    }
    
    setSubmitting(true);
    try {
      if (editingMenu) {
        const response = await api.patch(`/api/v1/catering/${editingMenu.id}`, {
          name: newMenu.name,
          code: newMenu.code || null,
          price: parseFloat(newMenu.price),
          description: newMenu.description || null,
          minimum_order_quantity: parseInt(newMenu.minimum_order_quantity) || 50,
        });
        setMenus(menus.map(i => i.id === editingMenu.id ? response.data : i));
        toast.success('Updated successfully');
      } else {
        const response = await api.post('/api/v1/catering', {
          name: newMenu.name,
          code: newMenu.code || null,
          price: parseFloat(newMenu.price),
          description: newMenu.description || null,
          minimum_order_quantity: parseInt(newMenu.minimum_order_quantity) || 50,
        });
        setMenus([...menus, response.data]);
        toast.success('Added successfully');
      }
      closeModal();
    } catch (error) {
      console.error("Error saving menu:", error);
      alert("Failed to save menu.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMenus = menus.filter(menu => 
    menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (menu.code && menu.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="admin-page-mobile-wrapper page-container">
      <style>{`
        @media (max-width: 1024px) {
          .manager-menu-grid {
            display: grid !important;
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)) !important;
            gap: 12px !important;
          }
          .mobile-search-filter {
            margin-top: 8px;
            margin-bottom: 16px !important;
          }
          .menu-card-image {
            height: 96px !important;
          }
          .menu-card-content {
            padding: 8px !important;
          }
          .menu-card-title {
            font-size: 12px !important;
            margin-bottom: 2px !important;
          }
          .menu-card-desc {
            font-size: 9px !important;
            margin-bottom: 8px !important;
            -webkit-line-clamp: 2 !important;
          }
          .menu-card-price {
            font-size: 13px !important;
          }
        }
      `}</style>
      {/* Header Area */}
      <div className="page-header desktop-only" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111', margin: '0 0 4px 0' }}>Catering Order Menu</h2>
          <p style={{ color: '#6B7280', margin: 0, fontSize: '14px' }}>Manage menus for catering and bulk orders</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{
            background: '#111',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s'
          }}
        >
          <Plus size={18} />
          Add Catering Menu
        </button>
      </div>

      {/* Mobile Header / Actions */}
      <div className="mobile-search-filter mobile-only" style={{ display: 'none', gap: '8px', marginBottom: '16px' }}>
        <style>{`@media (max-width: 1024px) { .mobile-search-filter { display: flex !important; } .desktop-only { display: none !important; } }`}</style>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search catering menus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              background: '#F9FAFB',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          style={{
            background: '#FF5722',
            color: 'white',
            border: 'none',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Desktop Search */}
      <div className="desktop-only" style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search catering menus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 42px',
              borderRadius: '24px',
              border: '1px solid #E5E7EB',
              background: '#F9FAFB',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280', background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          Loading catering menus...
        </div>
      ) : filteredMenus.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: 'white', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: '#F3F4F6', color: '#9CA3AF', marginBottom: '16px' }}>
            <Search size={32} />
          </div>
          <h3 style={{ margin: '0 0 8px 0', color: '#111', fontSize: '18px' }}>No menus found</h3>
          <p style={{ margin: 0, color: '#6B7280', fontSize: '14px' }}>Try adjusting your search</p>
        </div>
      ) : (
        <div className="manager-menu-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {filteredMenus.map((item) => (
            <div key={item.id} className="manager-menu-item-card" style={{
              background: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              border: '1px solid rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0
            }}>
              {/* Image Area - No images for catering, so just a header block */}
              <div className="menu-card-image" style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                backgroundColor: '#ffe8e2',
                height: '100px'
              }}>
                <span style={{ fontSize: '16px', color: '#FF5722', fontWeight: '800' }}>{item.code || 'CATERING'}</span>
                
                {/* Price Overlay */}
                <div className="menu-card-price" style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  color: '#111',
                  fontSize: '18px',
                  fontWeight: '800',
                  background: 'white',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  ₹{item.price}
                </div>
              </div>

              {/* Content Area */}
              <div className="menu-card-content" style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 className="menu-card-title" style={{ fontSize: '18px', fontWeight: '800', color: '#111', margin: '0 0 8px 0', lineHeight: '1.2' }}>{item.name}</h3>
                
                <p className="menu-card-desc" style={{ 
                  color: '#888', 
                  fontSize: '13px', 
                  lineHeight: '1.4',
                  margin: '0 0 16px 0',
                  fontWeight: '500'
                }}>
                  {item.description}
                </p>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #f5f5f5', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <div style={{ position: 'relative', width: '32px', height: '18px', background: item.is_available ? '#10B981' : '#E5E7EB', borderRadius: '9px', transition: 'background 0.2s', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', top: '2px', left: item.is_available ? '16px' : '2px', width: '14px', height: '14px', background: 'white', borderRadius: '50%', transition: 'left 0.2s' }} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#111' }}>
                        Avail
                      </span>
                      <input 
                        type="checkbox" 
                        checked={item.is_available}
                        onChange={() => handleToggleAvailable(item)}
                        style={{ display: 'none' }}
                      />
                    </label>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => openEditModal(item)}
                        style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 'auto', minHeight: 'auto', width: '24px', height: '24px' }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 'auto', minHeight: 'auto', width: '24px', height: '24px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F3F4F6', padding: '4px 8px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#4B5563' }}>Min Order:</span>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#111', minWidth: '16px', textAlign: 'center' }}>
                      {item.minimum_order_quantity || 50}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid #f0f0f0' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#111' }}>
                {editingMenu ? 'Edit Menu' : 'Add Catering Menu'}
              </h2>
              <button 
                onClick={closeModal}
                style={{ background: '#F3F4F6', border: 'none', width: '32px', height: '32px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4B5563' }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddMenu} style={{ padding: '24px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                {/* Menu Code */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Menu Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={newMenu.code}
                    onChange={(e) => setNewMenu({...newMenu, code: e.target.value})}
                    placeholder="e.g. MENU 1"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Menu Name *
                  </label>
                  <input
                    type="text"
                    value={newMenu.name}
                    onChange={(e) => setNewMenu({...newMenu, name: e.target.value})}
                    placeholder="e.g. REGULAR BREAKFAST"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                {/* Price */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={newMenu.price}
                    onChange={(e) => setNewMenu({...newMenu, price: e.target.value})}
                    placeholder="160"
                    required
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Min Quantity */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Minimum Order Quantity
                  </label>
                  <input
                    type="number"
                    value={newMenu.minimum_order_quantity}
                    onChange={(e) => setNewMenu({...newMenu, minimum_order_quantity: e.target.value})}
                    placeholder="50"
                    required
                    min="1"
                    step="1"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Items Included / Description
                  </label>
                  <textarea
                    value={newMenu.description}
                    onChange={(e) => setNewMenu({...newMenu, description: e.target.value})}
                    placeholder="Idly, Medu Vadai, Sambar..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
              
              {/* Buttons */}
              <div style={{ display: 'flex', gap: '16px' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '24px',
                    border: '1px solid #E5E7EB',
                    background: 'white',
                    color: '#4B5563',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '24px',
                    border: 'none',
                    background: submitting ? '#ffb09c' : '#ff5722',
                    color: 'white',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Saving...' : (editingMenu ? 'Save Changes' : '+ Add Menu')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CateringMenuManagement;
