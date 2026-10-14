import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Search, Check, ChevronDown, Package, 
  Sparkles, Filter, X, AlertCircle, Info, RefreshCw, ArrowRight
} from 'lucide-react';
import { cateringAdminService } from '../services/api';
import { toast } from './Toast';

const CateringMenuManagement = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, south_indian, multi_cuisine, available, drafts
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState('ALL');
  const [selectedCuisine, setSelectedCuisine] = useState('ALL');
  const [selectedPriceRange, setSelectedPriceRange] = useState('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    price: '',
    minimum_order_quantity: 50,
    is_available: true,
    items: []
  });

  // Safe delete confirm modal
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, packageCode: '', packageName: '' });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      let data = [];
      try {
        data = await cateringAdminService.getPackages();
      } catch (adminErr) {
        console.warn('Admin packages fetch failed, falling back to public catering endpoint:', adminErr);
        data = await cateringAdminService.getPublicPackages();
      }
      if (Array.isArray(data)) {
        setPackages(data);
      } else {
        setPackages([]);
      }
    } catch (error) {
      console.error('Failed to fetch catering packages:', error);
      toast.error('Failed to load catering packages');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (pkg, e) => {
    if (e) e.stopPropagation();
    const newStatus = !pkg.is_available;
    try {
      await cateringAdminService.togglePackageAvailability(pkg.code, newStatus);
      setPackages(prev => prev.map(p => p.code === pkg.code ? { ...p, is_available: newStatus } : p));
      toast.success(`Package "${pkg.name}" marked as ${newStatus ? 'Available' : 'Draft'}`);
    } catch (error) {
      console.error('Failed to toggle availability:', error);
      toast.error('Failed to update package availability');
    }
  };

  const openCreateModal = () => {
    setEditingPackage(null);
    setFormData({
      name: '',
      code: `PKG-00${packages.length + 1}`,
      price: '',
      minimum_order_quantity: 50,
      is_available: true,
      items: [
        {
          item_name: 'Idli & Medu Vada',
          category_name: 'Breakfast Items',
          customization_group: 'BREAKFAST',
          is_swappable: true,
          is_removable: true,
          add_price: 30,
          remove_price: -10,
          same_group_replace_price: 0,
          upgrade_group: null,
          upgrade_price: 0,
          display_order: 0
        },
        {
          item_name: 'Sambar & Chutneys',
          category_name: 'Side Dishes',
          customization_group: 'SIDE_DISH',
          is_swappable: false,
          is_removable: false,
          add_price: 20,
          remove_price: 0,
          same_group_replace_price: 0,
          upgrade_group: null,
          upgrade_price: 0,
          display_order: 1
        },
        {
          item_name: 'Kesari Bath & Filter Coffee',
          category_name: 'Beverages & Sweets',
          customization_group: 'BEVERAGE',
          is_swappable: true,
          is_removable: true,
          add_price: 30,
          remove_price: -10,
          same_group_replace_price: 0,
          upgrade_group: null,
          upgrade_price: 0,
          display_order: 2
        }
      ]
    });
    setIsModalOpen(true);
  };

  const openEditModal = async (pkg) => {
    setEditingPackage(pkg);
    let itemsToEdit = (pkg.items && pkg.items.length > 0) ? pkg.items.map(i => ({ ...i })) : [];

    // If items aren't already loaded on the package object, fetch them
    if (itemsToEdit.length === 0 && pkg.code) {
      try {
        const detail = await cateringAdminService.getPackage(pkg.code);
        if (detail && detail.items && detail.items.length > 0) {
          itemsToEdit = detail.items.map(i => ({ ...i }));
        }
      } catch (err) {
        try {
          const pubDetail = await cateringAdminService.getPublicPackageItems(pkg.code);
          if (pubDetail && pubDetail.categories) {
            const flatItems = [];
            pubDetail.categories.forEach(cat => {
              (cat.items || []).forEach(it => {
                flatItems.push({
                  id: it.id,
                  item_name: it.item_name || it.name,
                  category_name: cat.category_name || 'General',
                  customization_group: it.customization_group || null,
                  is_swappable: Boolean(it.is_swappable),
                  is_removable: Boolean(it.is_removable),
                  add_price: Number(it.add_price || 30),
                  remove_price: Number(it.remove_price || -10),
                  same_group_replace_price: Number(it.same_group_replace_price || 0),
                  upgrade_group: it.upgrade_group || null,
                  upgrade_price: Number(it.upgrade_price || 0),
                  display_order: it.display_order || 0
                });
              });
            });
            itemsToEdit = flatItems;
          }
        } catch (err2) {
          console.warn('Could not load package items detail:', err2);
        }
      }
    }

    setFormData({
      name: pkg.name || '',
      code: pkg.code || '',
      price: pkg.price !== undefined ? pkg.price : '',
      minimum_order_quantity: pkg.minimum_order_quantity || 50,
      is_available: pkg.is_available !== undefined ? pkg.is_available : true,
      items: itemsToEdit
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPackage(null);
  };

  const handleAddItemRow = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          item_name: '',
          category_name: 'Mains',
          customization_group: 'MAIN',
          is_swappable: true,
          is_removable: true,
          add_price: 30,
          remove_price: -10,
          same_group_replace_price: 0,
          upgrade_group: null,
          upgrade_price: 0,
          display_order: prev.items.length
        }
      ]
    }));
  };

  const handleRemoveItemRow = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleItemFieldChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim() || !formData.price) {
      toast.error('Please enter package name, code, and price per person');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        price: parseFloat(formData.price),
        minimum_order_quantity: parseInt(formData.minimum_order_quantity) || 50,
        is_available: formData.is_available,
        items: formData.items.filter(i => i.item_name && i.item_name.trim() !== '')
      };

      if (editingPackage) {
        await cateringAdminService.updatePackage(editingPackage.code, payload);
        toast.success(`Package "${payload.name}" updated successfully`);
      } else {
        await cateringAdminService.createPackage(payload);
        toast.success(`Package "${payload.name}" created successfully`);
      }
      closeModal();
      fetchPackages();
    } catch (error) {
      console.error('Failed to save package:', error);
      const detail = error.response?.data?.detail || 'Failed to save package';
      toast.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePackage = async () => {
    if (!deleteModal.packageCode) return;
    try {
      const res = await cateringAdminService.deletePackage(deleteModal.packageCode);
      toast.success(res.message || 'Package removed successfully');
      setDeleteModal({ isOpen: false, packageCode: '', packageName: '' });
      fetchPackages();
    } catch (error) {
      console.error('Failed to delete package:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete package');
    }
  };

  // Derive counts for filter pills
  const totalCount = packages.length;
  const availableCount = packages.filter(p => p.is_available).length;
  const draftsCount = packages.filter(p => !p.is_available).length;
  const southIndianCount = packages.filter(p => 
    p.name.toLowerCase().includes('breakfast') || 
    p.name.toLowerCase().includes('lunch') || 
    p.name.toLowerCase().includes('feast') || 
    p.name.toLowerCase().includes('tiffin')
  ).length;
  const multiCuisineCount = totalCount - southIndianCount;

  // Filter packages based on activeTab, search, dropdowns
  const filteredPackages = packages.filter(pkg => {
    // Tab filter
    if (activeTab === 'available' && !pkg.is_available) return false;
    if (activeTab === 'drafts' && pkg.is_available) return false;
    if (activeTab === 'south_indian') {
      const isSI = pkg.name.toLowerCase().includes('breakfast') || 
                   pkg.name.toLowerCase().includes('lunch') || 
                   pkg.name.toLowerCase().includes('feast') || 
                   pkg.name.toLowerCase().includes('tiffin');
      if (!isSI) return false;
    }
    if (activeTab === 'multi_cuisine') {
      const isSI = pkg.name.toLowerCase().includes('breakfast') || 
                   pkg.name.toLowerCase().includes('lunch') || 
                   pkg.name.toLowerCase().includes('feast') || 
                   pkg.name.toLowerCase().includes('tiffin');
      if (isSI) return false;
    }

    // Occasion dropdown
    if (selectedOccasion !== 'ALL') {
      const text = (pkg.name + ' ' + pkg.code).toLowerCase();
      if (!text.includes(selectedOccasion.toLowerCase())) return false;
    }

    // Price range dropdown
    if (selectedPriceRange === 'UNDER_200' && pkg.price >= 200) return false;
    if (selectedPriceRange === '200_300' && (pkg.price < 200 || pkg.price > 300)) return false;
    if (selectedPriceRange === 'ABOVE_300' && pkg.price <= 300) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const inName = pkg.name.toLowerCase().includes(q);
      const inCode = pkg.code.toLowerCase().includes(q);
      const inSummary = (pkg.items_summary || '').toLowerCase().includes(q);
      const inDishes = (pkg.dishes_sample || []).some(d => d.toLowerCase().includes(q));
      if (!inName && !inCode && !inSummary && !inDishes) return false;
    }

    return true;
  });

  return (
    <div className="catering-packages-page" style={{ padding: '24px 32px', maxWidth: '1440px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Breadcrumb & Header matching wireframe */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px', color: '#EA580C', textTransform: 'uppercase', marginBottom: '6px' }}>
            CATERING / PACKAGES
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111827', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            A menu for every occasion
          </h1>
          <p style={{ fontSize: '14px', color: '#6B7280', margin: 0, maxWidth: '640px' }}>
            Curated vegetarian packages, ready to serve. Customize dishes to suit every celebration.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#EA580C',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#C2410C'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#EA580C'}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Create package</span>
        </button>
      </div>

      {/* Filter Tabs / Pills matching wireframe */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'All packages', count: totalCount },
          { id: 'south_indian', label: 'South Indian', count: southIndianCount },
          { id: 'multi_cuisine', label: 'Multi-cuisine', count: multiCuisineCount },
          { id: 'available', label: 'Available', count: availableCount },
          { id: 'drafts', label: 'Drafts', count: draftsCount },
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '24px',
                fontSize: '13px',
                fontWeight: isActive ? '700' : '500',
                backgroundColor: isActive ? '#FFF7ED' : '#F9FAFB',
                color: isActive ? '#EA580C' : '#4B5563',
                border: isActive ? '1.5px solid #EA580C' : '1px solid #E5E7EB',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{tab.label}</span>
              <span style={{ 
                fontSize: '11px', 
                backgroundColor: isActive ? '#EA580C' : '#E5E7EB', 
                color: isActive ? '#FFFFFF' : '#4B5563', 
                borderRadius: '12px', 
                padding: '1px 6px',
                fontWeight: '700'
              }}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Dropdown Bar matching wireframe */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '28px',
        flexWrap: 'wrap'
      }}>
        {/* Search input with icon */}
        <div style={{
          position: 'relative',
          flex: '1',
          minWidth: '280px',
          maxWidth: '460px'
        }}>
          <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search package name or dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 14px 10px 40px',
              fontSize: '13px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '10px',
              color: '#111827',
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
            }}
          />
        </div>

        {/* Dropdown Filters */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={selectedOccasion}
            onChange={(e) => setSelectedOccasion(e.target.value)}
            style={{
              padding: '9px 14px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#374151',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '10px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="ALL">All occasions</option>
            <option value="BREAKFAST">Breakfast</option>
            <option value="LUNCH">Lunch</option>
            <option value="TIFFIN">Evening Snacks</option>
            <option value="FEAST">Grand Feast</option>
            <option value="SEEMANTHAM">Traditional</option>
          </select>

          <select
            value={selectedPriceRange}
            onChange={(e) => setSelectedPriceRange(e.target.value)}
            style={{
              padding: '9px 14px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#374151',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '10px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="ALL">Price: Any</option>
            <option value="UNDER_200">Under ₹200</option>
            <option value="200_300">₹200 - ₹300</option>
            <option value="ABOVE_300">Above ₹300</option>
          </select>
        </div>
      </div>

      {/* Package Cards Grid matching wireframe */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '240px' }}>
          <RefreshCw className="animate-spin" size={28} color="#EA580C" />
        </div>
      ) : filteredPackages.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px dashed #D1D5DB'
        }}>
          <Package size={42} color="#9CA3AF" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#374151', margin: '0 0 6px 0' }}>No packages found</h3>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 16px 0' }}>Try adjusting your search or filters, or create a new catering package.</p>
          <button
            onClick={openCreateModal}
            style={{
              backgroundColor: '#EA580C',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            + Create package
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '24px',
          marginBottom: '36px'
        }}>
          {filteredPackages.map((pkg) => {
            const isAvailable = pkg.is_available;
            return (
              <div
                key={pkg.code}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'box-shadow 0.2s ease, transform 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  {/* Top Row: Icon + Availability Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: '#FFF7ED',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#EA580C'
                    }}>
                      <Package size={22} strokeWidth={2} />
                    </div>

                    <button
                      onClick={(e) => handleToggleAvailability(pkg, e)}
                      title="Click to toggle availability"
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '11px',
                        fontWeight: '700',
                        backgroundColor: isAvailable ? '#ECFDF5' : '#FEF3C7',
                        color: isAvailable ? '#059669' : '#D97706',
                        border: isAvailable ? '1px solid #A7F3D0' : '1px solid #FDE68A',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: isAvailable ? '#10B981' : '#F59E0B'
                      }} />
                      <span>{isAvailable ? 'Available' : 'Draft'}</span>
                    </button>
                  </div>

                  {/* Package Title & Subtitle */}
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: '0 0 4px 0' }}>
                    {pkg.name}
                  </h3>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '14px' }}>
                    South Indian · PKG {pkg.code}
                  </div>

                  {/* Price & Minimum order quantity */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '18px' }}>
                    <span style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>
                      ₹{Math.round(pkg.price)}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>
                      / person · Minimum {pkg.minimum_order_quantity} guests
                    </span>
                  </div>

                  {/* Included dishes section */}
                  <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '16px', marginBottom: '18px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.8px', color: '#4B5563', textTransform: 'uppercase', marginBottom: '10px' }}>
                      INCLUDED DISHES
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {pkg.items && pkg.items.length > 0 ? (
                        pkg.items.slice(0, 5).map((it, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', marginTop: '2px' }}>
                              <Check size={14} strokeWidth={3} />
                            </span>
                            <span style={{ fontSize: '12px', color: '#374151', lineHeight: '1.4', fontWeight: '500' }}>
                              {it.item_name} {it.category_name && it.category_name !== 'General' ? <span style={{ color: '#9CA3AF', fontSize: '11px' }}>• {it.category_name}</span> : ''}
                            </span>
                          </div>
                        ))
                      ) : (
                        (pkg.dishes_sample && pkg.dishes_sample.length > 0 ? pkg.dishes_sample : [pkg.items_summary || 'Assorted vegetarian items']).map((dishLine, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', marginTop: '2px' }}>
                              <Check size={14} strokeWidth={3} />
                            </span>
                            <span style={{ fontSize: '12px', color: '#374151', lineHeight: '1.4', fontWeight: '500' }}>
                              {dishLine}
                            </span>
                          </div>
                        ))
                      )}
                      {pkg.items && pkg.items.length > 5 && (
                        <div style={{ fontSize: '11px', color: '#6B7280', paddingLeft: '22px', fontWeight: '500' }}>
                          + {pkg.items.length - 5} more items
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer: Tags & Action links */}
                <div style={{
                  borderTop: '1px solid #F3F4F6',
                  paddingTop: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 'auto'
                }}>
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>
                    Vegetarian · Service included
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => openEditModal(pkg)}
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#EA580C',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>Edit package</span>
                      <ArrowRight size={14} strokeWidth={2.5} />
                    </button>

                    <button
                      onClick={() => setDeleteModal({ isOpen: true, packageCode: pkg.code, packageName: pkg.name })}
                      title="Deactivate or Delete Package"
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#9CA3AF',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.color = '#EF4444'}
                      onMouseOut={(e) => e.currentTarget.style.color = '#9CA3AF'}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Wireframe bottom notice */}
      <div style={{
        fontSize: '12px',
        color: '#6B7280',
        padding: '16px 0',
        borderTop: '1px solid #E5E7EB',
        textAlign: 'center'
      }}>
        All prices are per person, excluding GST. Final quotes depend on guest count, location and customizations.
      </div>


      {/* ============================================================ */}
      {/* CREATE / EDIT PACKAGE MODAL WITH CUSTOMIZATION RULES (PHASE 2 & 3) */}
      {/* ============================================================ */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #E5E7EB',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', margin: 0 }}>
                  {editingPackage ? `Edit Package: ${editingPackage.name}` : 'Create Catering Package'}
                </h2>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>
                  Configure package details, included dishes, and item-level customization rules.
                </p>
              </div>

              <button
                onClick={closeModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSavePackage} style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              
              {/* Top Package Details */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
                backgroundColor: '#F9FAFB',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid #E5E7EB'
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                    Package Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Grand Breakfast Feast"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                    Package Code *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingPackage}
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. MENU 5 or PKG-007"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      backgroundColor: editingPackage ? '#F3F4F6' : '#FFFFFF'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                    Price Per Person (₹) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g. 250"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                    Min Guest Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minimum_order_quantity}
                    onChange={(e) => setFormData({ ...formData, minimum_order_quantity: e.target.value })}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '8px 12px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '22px' }}>
                  <input
                    type="checkbox"
                    id="pkg_availability"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    style={{ width: '16px', height: '16px', accentColor: '#EA580C', cursor: 'pointer' }}
                  />
                  <label htmlFor="pkg_availability" style={{ fontSize: '13px', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>
                    Available for Booking
                  </label>
                </div>
              </div>

              {/* Items & Customization Rules Section */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#111827', margin: 0 }}>
                      Menu Items & Customization Rules
                    </h3>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>
                      Source of truth for dish swapping (₹0 default), removal (-₹10 default), additions (+₹30 default), and upgrades (+₹50 default).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    style={{
                      backgroundColor: '#FFF7ED',
                      color: '#EA580C',
                      border: '1px solid #FDBA74',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={14} />
                    <span>Add Item</span>
                  </button>
                </div>

                {formData.items.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#F9FAFB', borderRadius: '8px', color: '#6B7280', fontSize: '13px' }}>
                    No dish items added yet. Click "+ Add Item" to specify dishes for this catering package.
                  </div>
                ) : (
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '10px', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#4B5563' }}>
                          <th style={{ padding: '10px 12px', fontWeight: '700' }}>Dish Name</th>
                          <th style={{ padding: '10px 12px', fontWeight: '700' }}>Category</th>
                          <th style={{ padding: '10px 12px', fontWeight: '700' }}>Group</th>
                          <th style={{ padding: '10px 12px', fontWeight: '700', textAlign: 'center' }}>Swap</th>
                          <th style={{ padding: '10px 12px', fontWeight: '700', textAlign: 'center' }}>Remove</th>
                          <th style={{ padding: '10px 12px', fontWeight: '700' }}>Remove (₹)</th>
                          <th style={{ padding: '10px 12px', fontWeight: '700' }}>Add (₹)</th>
                          <th style={{ padding: '10px 12px', fontWeight: '700' }}>Upgrade (₹)</th>
                          <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '8px 12px' }}>
                              <input
                                type="text"
                                required
                                value={item.item_name}
                                onChange={(e) => handleItemFieldChange(idx, 'item_name', e.target.value)}
                                placeholder="e.g. Masala Dosa"
                                style={{ width: '150px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '12px' }}
                              />
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <input
                                type="text"
                                value={item.category_name || ''}
                                onChange={(e) => handleItemFieldChange(idx, 'category_name', e.target.value)}
                                placeholder="Breakfast"
                                style={{ width: '110px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '12px' }}
                              />
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <input
                                type="text"
                                value={item.customization_group || ''}
                                onChange={(e) => handleItemFieldChange(idx, 'customization_group', e.target.value.toUpperCase())}
                                placeholder="MAIN / SWEET"
                                style={{ width: '90px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '12px' }}
                              />
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={item.is_swappable}
                                onChange={(e) => handleItemFieldChange(idx, 'is_swappable', e.target.checked)}
                                style={{ accentColor: '#EA580C', cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={item.is_removable}
                                onChange={(e) => handleItemFieldChange(idx, 'is_removable', e.target.checked)}
                                style={{ accentColor: '#EA580C', cursor: 'pointer' }}
                              />
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <input
                                type="number"
                                step="1"
                                value={item.remove_price}
                                onChange={(e) => handleItemFieldChange(idx, 'remove_price', parseFloat(e.target.value) || 0)}
                                style={{ width: '65px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '12px' }}
                              />
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <input
                                type="number"
                                step="1"
                                value={item.add_price}
                                onChange={(e) => handleItemFieldChange(idx, 'add_price', parseFloat(e.target.value) || 0)}
                                style={{ width: '65px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '12px' }}
                              />
                            </td>
                            <td style={{ padding: '8px 12px' }}>
                              <input
                                type="number"
                                step="1"
                                value={item.upgrade_price || 0}
                                onChange={(e) => handleItemFieldChange(idx, 'upgrade_price', parseFloat(e.target.value) || 0)}
                                style={{ width: '65px', padding: '6px 8px', borderRadius: '6px', border: '1px solid #D1D5DB', fontSize: '12px' }}
                              />
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleRemoveItemRow(idx)}
                                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                borderTop: '1px solid #E5E7EB',
                paddingTop: '16px'
              }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    backgroundColor: '#FFFFFF',
                    color: '#374151',
                    fontSize: '13px',
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
                    padding: '9px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#EA580C',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 6px rgba(234, 88, 12, 0.25)'
                  }}
                >
                  {submitting ? 'Saving...' : editingPackage ? 'Update Package' : 'Create Package'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SAFE DELETION / DEACTIVATION CONFIRMATION MODAL (PHASE 2 & 10) */}
      {/* ============================================================ */}
      {deleteModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '14px',
            maxWidth: '460px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#111827', margin: 0 }}>
                  Confirm Safe Deactivation
                </h3>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '2px 0 0 0' }}>
                  Package: {deleteModal.packageName} ({deleteModal.packageCode})
                </p>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: '1.5', margin: '0 0 20px 0' }}>
              To protect database integrity, historical catering orders referencing this package will preserve their original booked prices and details. If historical orders exist, this package will be safely deactivated (soft-deleted).
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setDeleteModal({ isOpen: false, packageCode: '', packageName: '' })}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePackage}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Proceed Safe Deactivation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CateringMenuManagement;
