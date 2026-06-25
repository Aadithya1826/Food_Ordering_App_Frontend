import React, { useState, useEffect } from 'react';
import { Search, Plus, Star, Edit2, Trash2 } from 'lucide-react';
import { menuService } from '../services/api';

const MenuManagement = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    category_id: '',
    price: '',
    description: '',
    quantity: '0',
    image_url: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [generatingImageId, setGeneratingImageId] = useState(null);

  useEffect(() => {
    const handleNavigateCategory = (e) => {
      if (e.detail && e.detail.category) {
        const searchCat = e.detail.category.toLowerCase();
        // Try to find the exact category name to ensure the tab highlights correctly
        const matchedCategory = categories.find(c => c.name.toLowerCase().includes(searchCat));
        
        if (matchedCategory) {
          setActiveCategory(matchedCategory.name);
        } else {
          setActiveCategory(e.detail.category); // fallback
        }
      }
    };

    window.addEventListener('navigate-menu-category', handleNavigateCategory);
    return () => window.removeEventListener('navigate-menu-category', handleNavigateCategory);
  }, [categories]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsData, categoriesData] = await Promise.all([
        menuService.getItems().catch(() => []),
        menuService.getCategories().catch(() => []),
      ]);
      setItems(itemsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch menu data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailable = async (item) => {
    try {
      const updatedItem = await menuService.updateItem(item.id, {
        is_available: !item.is_available,
      });
      setItems(items.map(i => i.id === item.id ? updatedItem : i));
    } catch (error) {
      console.error('Error updating item availability', error);
      alert('Failed to update availability.');
    }
  };

  const handleUpdateQuantity = async (item, change) => {
    const newQuantity = Math.max(0, (item.quantity || 0) + change);
    if (newQuantity === item.quantity) return;
    
    try {
      const updatedItem = await menuService.updateItem(item.id, {
        quantity: newQuantity,
      });
      setItems(items.map(i => i.id === item.id ? updatedItem : i));
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Failed to update quantity.');
    }
  };

  const handleGenerateImage = async (itemId) => {
    setGeneratingImageId(itemId);
    try {
      const updatedItem = await menuService.generateImage(itemId);
      setItems(items.map(i => i.id === itemId ? updatedItem : i));
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Please check API key and quotas.');
    } finally {
      setGeneratingImageId(null);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.category_id || !newItem.price) {
      alert("Please fill all required fields");
      return;
    }
    
    setSubmitting(true);
    try {
      if (editingItem) {
        const updatedItem = await menuService.updateItem(editingItem.id, {
          name: newItem.name,
          category_id: parseInt(newItem.category_id),
          price: parseFloat(newItem.price),
          description: newItem.description,
          quantity: parseInt(newItem.quantity) || 0,
          image_url: newItem.image_url || null,
        });
        setItems(items.map(i => i.id === editingItem.id ? updatedItem : i));
      } else {
        const createdItem = await menuService.createItem({
          name: newItem.name,
          category_id: parseInt(newItem.category_id),
          price: parseFloat(newItem.price),
          description: newItem.description || "A delicious new addition to our menu.",
          quantity: parseInt(newItem.quantity) || 0,
          image_url: newItem.image_url || null,
        });
        setItems([...items, createdItem]);
      }
      closeModal();
    } catch (error) {
      console.error("Error saving item:", error);
      alert("Failed to save menu item. Make sure you have the correct permissions.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      try {
        await menuService.deleteItem(itemId);
        setItems(items.filter(i => i.id !== itemId));
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("Failed to delete item.");
      }
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      category_id: item.category_id,
      price: item.price,
      description: item.description || '',
      quantity: item.quantity?.toString() || '0',
      image_url: item.image_url || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setNewItem({ name: '', category_id: '', price: '', description: '', quantity: '0', image_url: '' });
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesCategory = true;
    if (activeCategory !== 'All') {
      // Find category case-insensitively and allowing partial matches (e.g., 'noodle' matching 'Noodles')
      const searchCat = activeCategory.toLowerCase();
      const categoryObj = categories.find(c => c.name.toLowerCase().includes(searchCat));
      matchesCategory = categoryObj && item.category_id === categoryObj.id;
    }
    
    return matchesSearch && matchesCategory;
  });

  const availableCount = items.filter(i => i.is_available).length;

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
          .menu-card-badge {
            font-size: 9px !important;
            padding: 3px 6px !important;
            border-radius: 6px !important;
          }
          .menu-card-rating {
            font-size: 9px !important;
            padding: 3px 6px !important;
            border-radius: 6px !important;
          }
          .menu-categories-scroll {
            margin: 0 -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }
      `}</style>
      {/* Header Area */}
      <div className="page-header desktop-only" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0', color: '#111827' }}>Menu Management</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
            {items.length} items · {availableCount} available
          </p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setNewItem({ name: '', category_id: '', price: '', description: '', quantity: '0', image_url: '' });
            setIsModalOpen(true);
          }}
          style={{
            background: '#ff5722',
            color: 'white',
            border: 'none',
            borderRadius: '24px',
            padding: '10px 20px',
            fontWeight: '600',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(255, 87, 34, 0.2)',
            transition: 'background 0.2s ease',
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#e64a19'}
          onMouseOut={(e) => e.currentTarget.style.background = '#ff5722'}
        >
          <Plus size={18} />
          Add Item
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mobile-search-filter" style={{ marginBottom: '32px', width: '100%', minWidth: 0 }}>
        <div style={{ position: 'relative', maxWidth: '600px', marginBottom: '16px' }}>
          <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search menu item"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 42px',
              borderRadius: '24px',
              border: '1px solid #E5E7EB',
              fontSize: '13px',
              outline: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#ff5722'}
            onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>

        <div className="scroll-x menu-categories-scroll" style={{ display: 'flex', gap: '8px', paddingBottom: '4px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {['All', ...categories.map(c => c.name)].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '6px 16px',
                borderRadius: '24px',
                border: activeCategory === cat ? 'none' : '1px solid #E5E7EB',
                background: activeCategory === cat ? '#FF5722' : 'white',
                color: activeCategory === cat ? 'white' : '#111',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <p style={{ color: '#6B7280' }}>Loading menu items...</p>
      ) : (
        <div className="grid-responsive manager-menu-grid" style={{ minWidth: 0, width: '100%' }}>
          {filteredItems.map((item) => (
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
              {/* Image Area */}
              <div className="menu-card-image" style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                backgroundColor: '#f3f4f6',
                height: '180px'
              }}>
                {item.image_url ? (
                  <img 
                    src={item.image_url.startsWith('/') ? `http://localhost:8000${item.image_url}` : item.image_url}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: '500' }}>No Image</span>
                  </div>
                )}
                
                {/* Popular Badge overlay */}
                {item.id % 3 === 0 && ( // Just simulating some popular items
                  <div className="menu-card-badge" style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: '#FF5722',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg> Popular
                  </div>
                )}

                {/* Rating Overlay */}
                <div className="menu-card-rating" style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '8px',
                  background: '#000',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Star fill="#FBBF24" color="#FBBF24" size={10} /> 4.8
                </div>
                
                {/* Price Overlay */}
                <div className="menu-card-price" style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '800',
                  textShadow: '0 2px 8px rgba(0,0,0,0.8)'
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
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  fontWeight: '500'
                }}>
                  {item.description || 'Crispy golden crepe filled with spiced potato, served with...'}
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

                  {/* Quantity Control */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F3F4F6', padding: '4px 8px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#4B5563' }}>Qty:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button 
                        onClick={() => handleUpdateQuantity(item, -1)}
                        style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px', borderRadius: '4px', background: 'white', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111', padding: 0, fontSize: '14px', fontWeight: 'bold' }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#111', minWidth: '16px', textAlign: 'center' }}>
                        {item.quantity || 0}
                      </span>
                      <button 
                        onClick={() => handleUpdateQuantity(item, 1)}
                        style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px', borderRadius: '4px', background: 'white', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#111', padding: 0, fontSize: '14px', fontWeight: 'bold' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Item Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay">
          {/* Modal Container */}
          <div className="modal-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <div style={{ background: '#ff5722', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {editingItem ? <Edit2 size={20} /> : <Plus size={20} />}
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>
                {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </h2>
            </div>
            
            <form onSubmit={handleAddItem}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                {/* Item Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    placeholder="e.g. Masala Dosa"
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
                
                {/* Category */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Category
                  </label>
                  <select
                    value={newItem.category_id}
                    onChange={(e) => setNewItem({...newItem, category_id: e.target.value})}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      fontSize: '15px',
                      outline: 'none',
                      background: 'white',
                      boxSizing: 'border-box',
                      appearance: 'none', // removes default OS dropdown styling
                    }}
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Price */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Price
                  </label>
                  <input
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                    placeholder="INR (₹) 0.00"
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

                {/* Quantity */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Available Quantity
                  </label>
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                    placeholder="0"
                    required
                    min="0"
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
                    Description
                  </label>
                  <textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    placeholder="Crispy golden crepe..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid #E5E7EB',
                      fontSize: '15px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'none'
                    }}
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Image URL (Optional)
                    </span>
                    {newItem.image_url && (
                      <button 
                        type="button" 
                        onClick={() => setNewItem({...newItem, image_url: ''})}
                        style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Remove Image
                      </button>
                    )}
                  </label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                      type="text"
                      value={newItem.image_url}
                      onChange={(e) => setNewItem({...newItem, image_url: e.target.value})}
                      placeholder="https://example.com/image.jpg"
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '1px solid #E5E7EB',
                        fontSize: '15px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  {/* Image Preview */}
                  {newItem.image_url && (
                    <div style={{ marginTop: '12px', borderRadius: '12px', overflow: 'hidden', height: '120px', border: '1px solid #E5E7EB', background: '#f3f4f6' }}>
                      <img 
                        src={newItem.image_url.startsWith('/') ? `http://localhost:8000${newItem.image_url}` : newItem.image_url} 
                        alt="Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
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
                  {submitting ? 'Saving...' : (editingItem ? 'Save Changes' : '+ Add Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
