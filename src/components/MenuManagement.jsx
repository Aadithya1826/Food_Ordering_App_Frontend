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
      const categoryObj = categories.find(c => c.name === activeCategory);
      matchesCategory = categoryObj && item.category_id === categoryObj.id;
    }
    
    return matchesSearch && matchesCategory;
  });

  const availableCount = items.filter(i => i.is_available).length;

  return (
    <div style={{ padding: '24px 40px', fontFamily: "'Inter', sans-serif" }}>
      {/* Header Area */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: '#111827' }}>Menu Management</h1>
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
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
      <div style={{ marginBottom: '32px' }}>
        <div style={{ position: 'relative', maxWidth: '600px', marginBottom: '20px' }}>
          <Search size={20} color="#9CA3AF" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px 14px 48px',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              fontSize: '15px',
              outline: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#ff5722'}
            onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
          {['All', ...categories.map(c => c.name)].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: activeCategory === cat ? 'none' : '1px solid #E5E7EB',
                background: activeCategory === cat ? '#ff5722' : 'white',
                color: activeCategory === cat ? 'white' : '#4B5563',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {filteredItems.map((item) => (
            <div key={item.id} style={{
              background: 'white',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              border: '1px solid rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Image Area */}
              <div style={{
                height: '180px',
                background: 'linear-gradient(45deg, #f3f4f6, #e5e7eb)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {item.image_url ? (
                  <img 
                    src={`http://localhost:8000${item.image_url}`}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: '500' }}>No Image</span>
                    <button 
                      onClick={() => handleGenerateImage(item.id)}
                      disabled={generatingImageId === item.id}
                      style={{
                        background: 'white', 
                        border: '1px solid #E5E7EB', 
                        borderRadius: '16px', 
                        padding: '6px 12px', 
                        fontSize: '12px', 
                        fontWeight: '600',
                        color: generatingImageId === item.id ? '#9CA3AF' : '#ff5722',
                        cursor: generatingImageId === item.id ? 'not-allowed' : 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => { if (generatingImageId !== item.id) e.currentTarget.style.borderColor = '#ff5722'; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                    >
                      <Star size={14} color={generatingImageId === item.id ? '#9CA3AF' : '#ff5722'} />
                      {generatingImageId === item.id ? 'Generating...' : 'Generate Image'}
                    </button>
                  </div>
                )}
                
                {/* Popular Badge overlay */}
                {item.id % 3 === 0 && ( // Just simulating some popular items
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: '#ff5722',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    <Star fill="white" size={10} /> Popular
                  </div>
                )}

                {/* Rating Overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '12px',
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Star fill="#FBBF24" color="#FBBF24" size={12} /> 4.8
                </div>
                
                {/* Price Overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '700',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}>
                  ₹{item.price}
                </div>
              </div>

              {/* Content Area */}
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>{item.name}</h3>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#ff5722', background: '#fff0ec', padding: '2px 8px', borderRadius: '10px' }}>
                    Qty: {item.quantity || 0}
                  </span>
                </div>
                <p style={{ color: '#6B7280', fontSize: '13px', lineHeight: '1.5', flex: 1, marginBottom: '20px' }}>
                  {item.description || "A delicious addition to our menu."}
                </p>
                
                {/* Actions Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    {/* Toggle Switch */}
                    <div style={{
                      width: '36px',
                      height: '20px',
                      background: item.is_available ? '#0a8035' : '#E5E7EB',
                      borderRadius: '10px',
                      position: 'relative',
                      transition: 'background 0.2s'
                    }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        background: 'white',
                        borderRadius: '50%',
                        position: 'absolute',
                        top: '2px',
                        left: item.is_available ? '18px' : '2px',
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }} />
                    </div>
                    {/* Hidden actual checkbox to trigger the change visually and logic */}
                    <input 
                      type="checkbox" 
                      style={{ display: 'none' }} 
                      checked={item.is_available} 
                      onChange={() => handleToggleAvailable(item)}
                    />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: item.is_available ? '#0a8035' : '#9CA3AF' }}>
                      {item.is_available ? 'Available' : 'Sold Out'}
                    </span>
                  </label>
                  
                  <div style={{ display: 'flex', gap: '12px', color: '#9CA3AF' }}>
                    <button onClick={() => openEditModal(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} aria-label="Edit">
                      <Edit2 size={16} color="#9CA3AF" />
                    </button>
                    <button onClick={() => handleDeleteItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} aria-label="Delete">
                      <Trash2 size={16} color="#ef4444" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Item Modal Overlay */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          {/* Modal Container */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '480px',
            padding: '32px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
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
