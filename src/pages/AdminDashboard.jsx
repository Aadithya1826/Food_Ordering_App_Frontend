import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  Settings,
  AlertCircle,
  TrendingUp,
  Users2,
  DollarSign,
  MapPin,
  Pencil,
  Trash2,
  Globe,
  Bell,
  Shield,
  Database,
  Save,
} from 'lucide-react';
import VoiceWidget from '../components/VoiceWidget';
import DataudipiTitle from '../assets/Dataudupi-Title.png';
import { restaurantService, tableService, managerService, reportsService } from '../services/api';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [tables, setTables] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tablesError, setTablesError] = useState(null);

  const [hotels, setHotels] = useState([]);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [hotelsError, setHotelsError] = useState(null);
  const [hotelSearch, setHotelSearch] = useState('');
  const [showAddHotel, setShowAddHotel] = useState(false);
  const [newHotel, setNewHotel] = useState({ name: '', address: '', phone: '' });
  const [createError, setCreateError] = useState(null);
  const [creatingHotel, setCreatingHotel] = useState(false);

  const [managers, setManagers] = useState([]);
  const [managersLoading, setManagersLoading] = useState(true);
  const [managersError, setManagersError] = useState(null);
  const [managerSearch, setManagerSearch] = useState('');
  const [showAddManager, setShowAddManager] = useState(false);
  const [newManager, setNewManager] = useState({ name: '', email: '', password: '', restaurant_id: '' });
  const [managerCreateError, setManagerCreateError] = useState(null);
  const [isCreatingManager, setIsCreatingManager] = useState(false);

  const [reports, setReports] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(true);

  const [adminSettings, setAdminSettings] = useState({
    darkMode: false,
    pushNotifications: true,
    autoAssignManagers: false,
    twoFactorAuth: false,
    sessionTimeout: '30 mins',
    dailyBackups: true,
    backupFrequency: 'Daily at Midnight'
  });

  const handleSettingToggle = (key) => {
    setAdminSettings(prev => {
      const newValue = !prev[key];
      if (key === 'darkMode') {
        if (newValue) {
          document.body.classList.add('dark-theme');
        } else {
          document.body.classList.remove('dark-theme');
        }
      }
      return { ...prev, [key]: newValue };
    });
  };

  const handleSettingChange = (key, value) => {
    setAdminSettings(prev => ({ ...prev, [key]: value }));
  };

  // Editing states
  const [showEditHotel, setShowEditHotel] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [isSavingHotel, setIsSavingHotel] = useState(false);

  const [showEditManager, setShowEditManager] = useState(false);
  const [editingManager, setEditingManager] = useState(null);
  const [isSavingManager, setIsSavingManager] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'hotels', label: 'Hotels', icon: Building2 },
    { id: 'managers', label: 'Managers', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  useEffect(() => {
    const fetchTables = async () => {
      try {
        setTablesLoading(true);
        const response = await tableService.getTables();
        setTables(response);
      } catch (error) {
        console.error('Error fetching tables:', error);
        setTablesError('Unable to load table details.');
      } finally {
        setTablesLoading(false);
      }
    };

    const fetchHotels = async () => {
      try {
        setHotelsLoading(true);
        const response = await restaurantService.getAdminRestaurants();
        setHotels(response);
      } catch (error) {
        console.error('Error fetching hotels:', error);
        setHotelsError('Unable to load hotels.');
      } finally {
        setHotelsLoading(false);
      }
    };

    const fetchManagers = async () => {
      try {
        setManagersLoading(true);
        const response = await managerService.getManagers();
        setManagers(response);
      } catch (error) {
        console.error('Error fetching managers:', error);
        setManagersError('Unable to load managers.');
      } finally {
        setManagersLoading(false);
      }
    };

    fetchTables();
    fetchHotels();
    fetchManagers();

    const fetchReports = async () => {
      try {
        setReportsLoading(true);
        const response = await reportsService.getReports();
        setReports(response);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setReportsLoading(false);
      }
    };

    if (['dashboard', 'reports'].includes(activePage)) {
      fetchReports();
    }
  }, [activePage]);

  // Scroll to top when tab changes
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const mainBody = document.querySelector('.admin-main-body');
      if (mainBody) {
        mainBody.scrollTo(0, 0);
        mainBody.scrollTop = 0;
      }
      const adminMain = document.querySelector('.admin-main');
      if (adminMain) {
        adminMain.scrollTop = 0;
      }
    };

    scrollToTop();
    setTimeout(scrollToTop, 50);
  }, [activePage]);

  // Dynamic stats
  const stats = [
    {
      label: 'Total Hotels',
      value: hotels.length.toString(),
      change: 'Active on platform',
      icon: Building2,
      color: '#ff8c42',
    },
    {
      label: 'Active Managers',
      value: managers.length.toString(),
      change: 'Assigned managers',
      icon: Users2,
      color: '#2d7a4a',
    },
    {
      label: 'Platform Revenue (Today)',
      value: '₹' + (reports?.summary?.today_revenue?.value || 0).toLocaleString(),
      change: reports?.summary?.today_revenue?.change || '0%',
      icon: DollarSign,
      color: '#ff8c42',
    },
    {
      label: 'Active Tables',
      value: tables.filter(t => t.is_active).length.toString(),
      change: `Out of ${tables.length} total`,
      icon: MapPin,
      color: '#2d7a4a',
    },
  ];

  const reportCards = [
    {
      label: 'Today\'s Platform Revenue',
      value: '₹' + (reports?.summary?.today_revenue?.value || 0).toLocaleString(),
      change: reports?.summary?.today_revenue?.change || '0%',
      color: '#ff8c42',
      icon: '₹',
    },
    {
      label: 'Today\'s Orders',
      value: (reports?.summary?.today_orders?.value || 0).toLocaleString(),
      change: reports?.summary?.today_orders?.change || '0%',
      color: '#2d7a4a',
      icon: '🧾',
    },
    {
      label: 'Avg. Order Value',
      value: '₹' + Math.round(reports?.summary?.avg_order_value?.value || 0).toLocaleString(),
      change: reports?.summary?.avg_order_value?.change || '0%',
      color: '#ff8c42',
      icon: '💳',
    },
    {
      label: 'Customer Satisfaction',
      value: '4.8/5',
      change: 'Consistent',
      color: '#f82b60',
      icon: '⭐',
    },
  ];

  const paymentTotal = (reports?.payment_methods || []).reduce((sum, pm) => sum + (pm.value || 0), 0) || 1;
  const paymentMethods = reports?.payment_methods?.map((pm, idx) => ({
    name: pm.name,
    value: pm.value,
    percentage: ((pm.value || 0) / paymentTotal) * 100,
    color: ['#ff8c42', '#2d7a4a', '#ff6b6b', '#6b7280'][idx % 4]
  })) || [];

  const topHotels = (reports?.top_hotels || []).map((hotel) => ({
    id: hotel.id,
    name: hotel.name,
    hotel: hotel.name, // Added for performanceRows compatibility
    city: hotel.city,
    revenue: '₹' + (hotel.revenue || 0).toLocaleString(),
    orders: hotel.orders,
    growth: hotel.growth || '0%'
  }));

  const performanceRows = topHotels;

  const recentActivity = React.useMemo(() => {
    const activities = [];

    // Add hotels to activity
    hotels.forEach(hotel => {
      if (hotel.created_at) {
        activities.push({
          type: 'hotel_added',
          message: 'New hotel added',
          details: `${hotel.name} - ${hotel.address || 'Unknown'}`,
          timeDate: new Date(hotel.created_at)
        });
      }
    });

    // Add managers to activity
    managers.forEach(manager => {
      if (manager.created_at) {
        activities.push({
          type: 'manager_assigned',
          message: 'Manager assigned',
          details: `${manager.name} → ${manager.restaurant_name || 'Unassigned'}`,
          timeDate: new Date(manager.created_at)
        });
      }
    });

    // Sort by newest first
    activities.sort((a, b) => b.timeDate - a.timeDate);

    // Format time for display
    const timeAgo = (date) => {
      const seconds = Math.floor((new Date() - date) / 1000);
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + " years ago";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + " months ago";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + " days ago";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + " hours ago";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + " minutes ago";
      return "Just now";
    };

    if (activities.length === 0) {
      return [{ type: 'hotel_added', message: 'No recent activity', details: 'Waiting for new updates', time: 'Just now' }];
    }

    return activities.slice(0, 4).map(act => ({
      ...act,
      time: timeAgo(act.timeDate)
    }));
  }, [hotels, managers]);

  const filteredHotels = hotels.filter((hotel) => {
    const query = hotelSearch.toLowerCase();
    return (
      hotel.name.toLowerCase().includes(query) ||
      (hotel.address || '').toLowerCase().includes(query) ||
      (hotel.phone || '').toLowerCase().includes(query)
    );
  });

  const filteredManagers = managers.filter((manager) => {
    const query = managerSearch.toLowerCase();
    return (
      manager.name.toLowerCase().includes(query) ||
      manager.email.toLowerCase().includes(query) ||
      (manager.restaurant_name || '').toLowerCase().includes(query)
    );
  });

  const handleNewHotelChange = (e) => {
    const { name, value } = e.target;
    setNewHotel((prev) => ({ ...prev, [name]: value }));
    setCreateError(null);
  };

  const handleCreateHotel = async (e) => {
    e.preventDefault();
    setCreateError(null);

    if (!newHotel.name.trim()) {
      setCreateError('Hotel name is required');
      return;
    }

    try {
      setCreatingHotel(true);
      await restaurantService.createRestaurant(newHotel);
      const response = await restaurantService.getAdminRestaurants();
      setHotels(response);
      setShowAddHotel(false);
      setNewHotel({ name: '', address: '', phone: '' });
    } catch (error) {
      console.error('Error creating hotel:', error);
      setCreateError(error.response?.data?.detail || 'Unable to create hotel.');
    } finally {
      setCreatingHotel(false);
    }
  };

  const handleUpdateHotel = async (e) => {
    e.preventDefault();
    if (!editingHotel?.name?.trim()) return;

    try {
      setIsSavingHotel(true);
      await restaurantService.updateRestaurant(editingHotel.id, editingHotel);
      const response = await restaurantService.getAdminRestaurants();
      setHotels(response);
      setShowEditHotel(false);
      setEditingHotel(null);
    } catch (error) {
      console.error('Error updating hotel:', error);
      alert(error.response?.data?.detail || 'Unable to update hotel.');
    } finally {
      setIsSavingHotel(false);
    }
  };

  const handleDeleteHotel = async (hotelId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this hotel? This action cannot be undone.')) return;

    try {
      await restaurantService.deleteRestaurant(hotelId);
      setHotels(hotels.filter(h => h.id !== hotelId));
    } catch (error) {
      console.error('Error deleting hotel:', error);
      alert(error.response?.data?.detail || 'Unable to delete hotel.');
    }
  };

  const handleCreateManager = async (e) => {
    e.preventDefault();
    setManagerCreateError(null);

    if (!newManager.name.trim() || !newManager.email.trim() || !newManager.password.trim() || !newManager.restaurant_id) {
      setManagerCreateError('All fields including restaurant assignment are required.');
      return;
    }

    try {
      setIsCreatingManager(true);
      await managerService.createManager({
        name: newManager.name,
        email: newManager.email,
        password: newManager.password,
        role: "HOTEL_ADMIN",
        restaurant_id: parseInt(newManager.restaurant_id)
      });
      const response = await managerService.getManagers();
      setManagers(response);
      setShowAddManager(false);
      setNewManager({ name: '', email: '', password: '', restaurant_id: '' });
    } catch (error) {
      console.error('Error creating manager:', error);
      setManagerCreateError(error.response?.data?.detail || 'Unable to create manager.');
    } finally {
      setIsCreatingManager(false);
    }
  };

  const handleUpdateManager = async (e) => {
    e.preventDefault();
    if (!editingManager?.name?.trim() || !editingManager?.email?.trim()) return;

    const updatePayload = { ...editingManager };
    if (!updatePayload.password) {
      delete updatePayload.password;
    }

    try {
      setIsSavingManager(true);
      await managerService.updateManager(editingManager.id, updatePayload);
      const response = await managerService.getManagers();
      setManagers(response);
      setShowEditManager(false);
      setEditingManager(null);
    } catch (error) {
      console.error('Error updating manager:', error);
      alert(error.response?.data?.detail || 'Unable to update manager.');
    } finally {
      setIsSavingManager(false);
    }
  };

  const handleDeleteManager = async (managerId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this manager? This action cannot be undone.')) return;

    try {
      await managerService.deleteManager(managerId);
      setManagers(managers.filter(m => m.id !== managerId));
    } catch (error) {
      console.error('Error deleting manager:', error);
      alert(error.response?.data?.detail || 'Unable to delete manager.');
    }
  };

  return (
    <div className={`admin-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      {/* Sidebar */}
      <div
        className={`admin-sidebar ${sidebarOpen ? 'expanded' : 'collapsed'}`}
        style={{
          width: sidebarOpen ? '250px' : '70px',
        }}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          {sidebarOpen && (
            <img src={DataudipiTitle} alt="Data Udipi" className="logo-title-image" />
          )}
          <div className="logo-symbol">ADMIN</div>

        </div>

        {/* Menu Items */}
        <div className="admin-sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`sidebar-menu-button ${activePage === item.id ? 'active' : ''}`}
              >
                <span className="sidebar-menu-icon">
                  <Icon size={18} />
                </span>
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <p>
            Powered by Data Udipi
          </p>
          <button
            onClick={handleLogout}
            className="sidebar-logout-button"
          >
            <LogOut size={16} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`admin-main ${sidebarOpen ? 'main-expanded' : 'main-collapsed'}`}>

        {/* Mobile Header (Visible only on small screens via CSS) */}
        <div className="admin-header-mobile">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '24px' }}>
            <img src={DataudipiTitle} alt="Data Udipi" style={{ height: '24px' }} />
            <div className="admin-header-badge" style={{ position: 'static' }}>ADMIN</div>
          </div>
          <h1>{activePage === 'dashboard' ? 'Dashboard' :
            activePage === 'hotels' ? 'Hotels & Venues' :
              activePage === 'managers' ? 'Managers' :
                activePage === 'reports' ? 'Reports' : 'Settings'}</h1>
          <p>{activePage === 'dashboard' ? 'Platform-wide overview' :
            activePage === 'hotels' ? `${hotels.length} Hotels Registered` :
              activePage === 'managers' ? 'Hotel managers & assignments' :
                activePage === 'reports' ? 'Performance insights' : 'Accounts & preferences'}</p>
        </div>

        {/* Desktop Header */}
        <div className="admin-header">
          <div className="admin-header-left">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="sidebar-toggle-button"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="admin-header-title">
              <h1>Super Admin Dashboard</h1>
              <p>Platform-wide overview and management</p>
            </div>
          </div>
          <div className="status-pill">
            ✓ All systems operational
          </div>
        </div>

        {/* Content Area */}
        <div className="admin-main-body">
          {activePage === 'dashboard' && (
            <div className="admin-page-mobile-wrapper">
              {/* Stats Cards */}
              <div className="admin-stats-grid">
                {stats.map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className="admin-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            background: `${stat.color}20`,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: stat.color,
                          }}
                        >
                          <Icon size={24} />
                        </div>
                        <span style={{ fontSize: '12px', color: '#2d7a4a', fontWeight: '600' }}>{stat.change}</span>
                      </div>
                      <h3 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>{stat.value}</h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{stat.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Top Hotels Section */}
              <div className="admin-table-card">
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Top Performing Hotels</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Header Row for Desktop (Hidden on mobile via CSS if needed, but flex handles it) */}
                  <div className="top-hotels-header" style={{ display: 'flex', padding: '0 12px 12px', borderBottom: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    <div style={{ flex: 2 }}>Hotel</div>
                    <div style={{ flex: 1, textAlign: 'right' }}>Revenue</div>
                    <div style={{ flex: 1, textAlign: 'right', display: 'none', '@media (minWidth: 768px)': { display: 'block' } }} className="desktop-only">Orders</div>
                    <div style={{ flex: '0 0 60px', textAlign: 'right' }}>Growth</div>
                  </div>

                  {topHotels.map((hotel, idx) => (
                    <div
                      key={idx}
                      onClick={() => navigate(`/manager-dashboard/${hotel.id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                    >
                      <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ff6b35', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', flexShrink: 0 }}>
                          {idx + 1}
                        </div>
                        <div>
                          <p style={{ fontWeight: '600', fontSize: '14px', margin: 0, color: 'black' }}>{hotel.name}</p>
                          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>📍 {hotel.city}</p>
                        </div>
                      </div>

                      <div style={{ flex: 1, textAlign: 'right' }}>
                        <p style={{ fontWeight: '600', fontSize: '14px', margin: 0, color: 'var(--text-primary)' }}>{hotel.revenue}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }} className="mobile-only-orders">{hotel.orders} orders</p>
                      </div>

                      <div style={{ flex: 1, textAlign: 'right' }} className="desktop-only">
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>{hotel.orders}</p>
                      </div>

                      <div style={{ flex: '0 0 60px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}>
                        <span style={{ background: 'rgba(45, 122, 74, 0.1)', color: '#2d7a4a', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                          {hotel.growth}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>



              {/* Recent Activity Section */}
              <div className="admin-activity-card">
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Recent Activity</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {recentActivity.map((activity, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        gap: '16px',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '8px',
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          background: 'var(--primary)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          flexShrink: 0,
                        }}
                      >
                        {activity.type === 'hotel_added' && <Building2 size={20} />}
                        {activity.type === 'manager_assigned' && <Users size={20} />}
                        {activity.type === 'venue_activated' && <AlertCircle size={20} />}
                        {activity.type === 'hotel_deactivated' && <X size={20} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{activity.message}</p>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{activity.details}</p>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{activity.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activePage === 'hotels' && (
            <div className="hotels-page-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <style>{`
                @media (max-width: 1024px) {
                  .hotels-page-container {
                    padding: 0 16px;
                  }
                  .hotels-search-bar {
                    flex-direction: column !important;
                    align-items: stretch !important;
                  }
                  .hotels-search-bar input {
                    max-width: none !important;
                  }
                  .hotels-search-bar span {
                    white-space: normal !important;
                    text-align: center;
                  }
                  .admin-mobile-card {
                    margin-left: 0 !important;
                    margin-right: 0 !important;
                  }
                }
              `}</style>
              {/* Header */}
              <div className="desktop-only">
                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Hotels & Venues</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Manage hotel records from the restaurant table. Add new hotels, search existing venues, and review address and contact details.
                </p>
              </div>

              {/* Add Hotel Button - Full Width */}
              <button
                onClick={() => setShowAddHotel(true)}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '15px',
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                <Building2 size={18} />
                Add Hotel
              </button>

              {/* Search Bar */}
              <div className="hotels-search-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <input
                  type="text"
                  value={hotelSearch}
                  onChange={(e) => setHotelSearch(e.target.value)}
                  placeholder="Search hotels..."
                  style={{
                    flex: 1,
                    maxWidth: '300px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--surface)',
                    color: 'black',
                    fontSize: '14px',
                  }}
                />
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                  {filteredHotels.length} hotels registered on the platform
                </span>
              </div>

              {/* Hotels Grid */}
              {hotelsLoading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Loading hotels...
                </div>
              ) : hotelsError ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#c0392b' }}>{hotelsError}</div>
              ) : filteredHotels.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No hotels match your search.
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {filteredHotels.map((hotel) => (
                    <div
                      key={hotel.id}
                      onClick={() => navigate(`/manager-dashboard/${hotel.id}`)}
                      className="admin-mobile-card"
                      style={{
                        padding: '0',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid rgba(0,0,0,0.05)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
                      }}
                    >
                      <div style={{ padding: '20px' }}>
                        {/* Top row: Icon, Actions, Active Pill */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div style={{ width: '40px', height: '40px', background: '#ff8c42', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <Building2 size={20} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button onClick={(e) => { e.stopPropagation(); setEditingHotel(hotel); setShowEditHotel(true); }} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer' }}><Pencil size={16} /></button>
                            <button onClick={(e) => handleDeleteHotel(hotel.id, e)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                            <span style={{ background: '#d4edda', color: '#155724', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px' }}>ACTIVE</span>
                          </div>
                        </div>

                        {/* Title & Location */}
                        <h4 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>{hotel.name}</h4>
                        <p style={{ margin: 0, fontSize: '13px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={14} /> {hotel.address || 'No address provided'}
                        </p>

                        {/* 3-Column Stats Footer */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '24px', paddingBottom: '16px', borderBottom: '1px solid #f0f0f0' }}>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>{hotel.venues ?? 1}</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>Venues</p>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>{hotel.orders ?? 0}</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>Orders</p>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700', color: '#ff6b35' }}>₹{(hotel.revenue || 0).toLocaleString()}</p>
                            <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>Revenue</p>
                          </div>
                        </div>

                        {/* Manager Footer */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '12px' }}>
                          <Users2 size={14} color="#888" />
                          <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>
                            {hotel.manager_name || 'No manager assigned'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showAddHotel && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50,
                    padding: '24px',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '520px',
                      background: 'var(--surface)',
                      borderRadius: '24px',
                      padding: '28px',
                      boxShadow: '0 24px 80px rgba(0,0,0,0.14)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '20px' }}>Add Hotel</h3>
                        <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                          Create a new hotel record in the restaurant table.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowAddHotel(false);
                          setCreateError(null);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '20px',
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <form onSubmit={handleCreateHotel} style={{ display: 'grid', gap: '16px' }}>
                      <label style={{ display: 'grid', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Hotel Name
                        <input
                          type="text"
                          name="name"
                          value={newHotel.name}
                          onChange={handleNewHotelChange}
                          placeholder="Enter hotel name"
                          style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'black' }}
                        />
                      </label>
                      <label style={{ display: 'grid', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Address
                        <input
                          type="text"
                          name="address"
                          value={newHotel.address}
                          onChange={handleNewHotelChange}
                          placeholder="Enter hotel address"
                          style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'black' }}
                        />
                      </label>
                      <label style={{ display: 'grid', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Phone
                        <input
                          type="text"
                          name="phone"
                          value={newHotel.phone}
                          onChange={handleNewHotelChange}
                          placeholder="Enter contact phone"
                          style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'black' }}
                        />
                      </label>
                      {createError && <p style={{ color: '#c0392b', fontSize: '13px' }}>{createError}</p>}
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddHotel(false);
                            setCreateError(null);
                          }}
                          className="btn btn-secondary"
                          style={{ minWidth: '120px' }}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={creatingHotel} style={{ minWidth: '120px' }}>
                          {creatingHotel ? 'Creating...' : 'Create Hotel'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {showEditHotel && editingHotel && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50,
                    padding: '24px',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '520px',
                      background: 'var(--surface)',
                      borderRadius: '24px',
                      padding: '28px',
                      boxShadow: '0 24px 80px rgba(0,0,0,0.14)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '20px' }}>Edit Hotel</h3>
                        <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                          Update details for {editingHotel.name}.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowEditHotel(false);
                          setEditingHotel(null);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '20px',
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <form onSubmit={handleUpdateHotel} style={{ display: 'grid', gap: '16px' }}>
                      <label style={{ display: 'grid', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Hotel Name
                        <input
                          type="text"
                          value={editingHotel.name || ''}
                          onChange={(e) => setEditingHotel({ ...editingHotel, name: e.target.value })}
                          placeholder="Enter hotel name"
                          style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'black' }}
                        />
                      </label>
                      <label style={{ display: 'grid', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Address
                        <input
                          type="text"
                          value={editingHotel.address || ''}
                          onChange={(e) => setEditingHotel({ ...editingHotel, address: e.target.value })}
                          placeholder="Enter hotel address"
                          style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'black' }}
                        />
                      </label>
                      <label style={{ display: 'grid', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Phone
                        <input
                          type="text"
                          value={editingHotel.phone || ''}
                          onChange={(e) => setEditingHotel({ ...editingHotel, phone: e.target.value })}
                          placeholder="Enter contact phone"
                          style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'black' }}
                        />
                      </label>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowEditHotel(false);
                            setEditingHotel(null);
                          }}
                          className="btn btn-secondary"
                          style={{ minWidth: '120px' }}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSavingHotel} style={{ minWidth: '120px' }}>
                          {isSavingHotel ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activePage === 'managers' && (
            <div className="admin-page-mobile-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Header */}
              <div className="desktop-only">
                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Managers</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Manage hotel managers and their assignments
                </p>
              </div>

              {/* Add Manager Button */}
              <button
                onClick={() => setShowAddManager(true)}
                className="btn btn-primary"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: '15px',
                  fontWeight: '600',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                <Users size={18} />
                Add Manager
              </button>

              {/* Search Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <input
                  type="text"
                  value={managerSearch}
                  onChange={(e) => setManagerSearch(e.target.value)}
                  placeholder="Search managers or hotels..."
                  style={{
                    flex: 1,
                    maxWidth: '400px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--surface)',
                    color: 'black',
                    fontSize: '14px',
                  }}
                />
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                  {filteredManagers.length} managers on platform
                </span>
              </div>

              {/* Managers Grid */}
              {managersLoading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Loading managers...
                </div>
              ) : managersError ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#c0392b' }}>{managersError}</div>
              ) : filteredManagers.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No managers match your search.
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {filteredManagers.map((manager) => {
                    const initials = manager.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);

                    const colors = ['#ff8c42', '#2d7a4a', '#0066cc', '#9933cc', '#ff6b6b', '#4ecdc4'];
                    const colorIndex = manager.id % colors.length;
                    const bgColor = colors[colorIndex];

                    return (
                      <div
                        key={manager.id}
                        className="admin-mobile-card"
                        style={{
                          padding: '20px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          background: '#ffffff',
                          borderRadius: '16px',
                          border: '1px solid rgba(0,0,0,0.05)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
                        }}
                      >
                        {/* Top Row: Initials, Name, Pill, Actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: bgColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: '700',
                                fontSize: '18px',
                              }}
                            >
                              {initials}
                            </div>
                            <div>
                              <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: '#1a1a1a' }}>
                                {manager.name}
                              </h4>
                              <span
                                style={{
                                  background: manager.is_active ? '#d4edda' : '#f8d7da',
                                  color: manager.is_active ? '#155724' : '#856404',
                                  borderRadius: '20px',
                                  padding: '2px 8px',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                }}
                              >
                                {manager.is_active ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingManager(manager); setShowEditManager(true); }}
                              style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', padding: '4px' }}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteManager(manager.id, e)}
                              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Assigned Hotel Card Block */}
                        <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                          <Building2 size={18} color="#ff8c42" />
                          <p style={{ margin: 0, color: '#333', fontSize: '13px', fontWeight: '600' }}>
                            {manager.restaurant_name || 'No Hotel Assigned'}
                          </p>
                        </div>

                        {/* Data Rows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: '#666' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span style={{ color: '#aaa' }}>✉️</span>
                            <span style={{ wordBreak: 'break-all' }}>{manager.email}</span>
                          </div>
                          {manager.restaurant_phone && (
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <span style={{ color: '#aaa' }}>📞</span>
                              <span>{manager.restaurant_phone}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span style={{ color: '#aaa' }}>👤</span>
                            <span>Manager - {manager.created_at ? `Joined ${new Date(manager.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {showEditManager && editingManager && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50,
                    padding: '24px',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '520px',
                      background: 'var(--surface)',
                      borderRadius: '24px',
                      padding: '28px',
                      boxShadow: '0 24px 80px rgba(0,0,0,0.14)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '20px' }}>Edit Manager</h3>
                        <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                          Update details for {editingManager.name}.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowEditManager(false);
                          setEditingManager(null);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '20px',
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <form onSubmit={handleUpdateManager} style={{ display: 'grid', gap: '16px' }}>
                      <label style={{ display: 'grid', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Manager Name
                        <input
                          type="text"
                          value={editingManager.name || ''}
                          onChange={(e) => setEditingManager({ ...editingManager, name: e.target.value })}
                          placeholder="Enter manager name"
                          style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'black' }}
                        />
                      </label>
                      <label style={{ display: 'grid', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Email
                        <input
                          type="email"
                          value={editingManager.email || ''}
                          onChange={(e) => setEditingManager({ ...editingManager, email: e.target.value })}
                          placeholder="Enter manager email"
                          style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'black' }}
                        />
                      </label>
                      <label style={{ display: 'grid', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Password
                        <input
                          type="password"
                          value={editingManager.password || ''}
                          onChange={(e) => setEditingManager({ ...editingManager, password: e.target.value })}
                          placeholder="Enter new password (leave blank to keep current)"
                          style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'black' }}
                        />
                      </label>
                      <label style={{ display: 'grid', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Hotel Assignment
                        <select
                          value={editingManager.restaurant_id || ''}
                          onChange={(e) => setEditingManager({ ...editingManager, restaurant_id: parseInt(e.target.value) || null })}
                          style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'black' }}
                        >
                          <option value="">No Assignment</option>
                          {hotels.map(hotel => (
                            <option key={hotel.id} value={hotel.id}>
                              {hotel.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <input
                          type="checkbox"
                          checked={editingManager.is_active || false}
                          onChange={(e) => setEditingManager({ ...editingManager, is_active: e.target.checked })}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                        Active Status
                      </label>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowEditManager(false);
                            setEditingManager(null);
                          }}
                          className="btn btn-secondary"
                          style={{ minWidth: '120px' }}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isSavingManager} style={{ minWidth: '120px' }}>
                          {isSavingManager ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {showAddManager && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50,
                    padding: '24px',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      maxWidth: '520px',
                      background: 'var(--surface)',
                      borderRadius: '24px',
                      padding: '28px',
                      boxShadow: '0 24px 80px rgba(0,0,0,0.14)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '20px' }}>Add Manager</h3>
                        <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                          Create a new hotel manager account.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowAddManager(false);
                          setManagerCreateError(null);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '20px',
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <form onSubmit={handleCreateManager} style={{ display: 'grid', gap: '16px' }}>
                      <label style={{ display: 'grid', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Full Name
                        <input
                          type="text"
                          value={newManager.name}
                          onChange={(e) => setNewManager({ ...newManager, name: e.target.value })}
                          placeholder="Enter full name"
                          style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'black' }}
                        />
                      </label>
                      <label style={{ display: 'grid', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Email Address
                        <input
                          type="email"
                          value={newManager.email}
                          onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                          placeholder="Enter email address"
                          style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'black' }}
                        />
                      </label>
                      <label style={{ display: 'grid', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Password
                        <input
                          type="password"
                          value={newManager.password}
                          onChange={(e) => setNewManager({ ...newManager, password: e.target.value })}
                          placeholder="Enter secure password"
                          style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'black' }}
                        />
                      </label>
                      <label style={{ display: 'grid', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Assign to Hotel
                        <select
                          value={newManager.restaurant_id}
                          onChange={(e) => setNewManager({ ...newManager, restaurant_id: e.target.value })}
                          style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'black' }}
                        >
                          <option value="">Select a hotel...</option>
                          {hotels.map(hotel => (
                            <option key={hotel.id} value={hotel.id}>
                              {hotel.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      {managerCreateError && <p style={{ color: '#c0392b', fontSize: '13px' }}>{managerCreateError}</p>}
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddManager(false);
                            setManagerCreateError(null);
                          }}
                          className="btn btn-secondary"
                          style={{ minWidth: '120px' }}
                        >
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={isCreatingManager} style={{ minWidth: '120px' }}>
                          {isCreatingManager ? 'Creating...' : 'Create Manager'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {activePage === 'reports' && (
            <div className="admin-page-mobile-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div className="desktop-only">
                <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>Reports & Analytics</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Platform-wide performance insights
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
                {reportCards.map((card, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '24px',
                      padding: '24px',
                      border: '1px solid rgba(15, 23, 42, 0.08)',
                      boxShadow: '0 20px 40px rgba(15, 23, 42, 0.04)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      minHeight: '140px',
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        {card.label}
                      </p>
                      <h3 style={{ margin: '14px 0 0', fontSize: '32px', fontWeight: '700', color: '#111111' }}>{card.value}</h3>
                    </div>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '18px',
                        background: `${card.color}1f`,
                        display: 'grid',
                        placeItems: 'center',
                        color: card.color,
                        fontSize: '20px',
                        fontWeight: '700',
                      }}
                    >
                      {card.icon}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  alignItems: 'stretch',
                }}
                className="reports-flex-grid"
              >
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '24px',
                    padding: '24px',
                    border: '1px solid rgba(15, 23, 42, 0.08)',
                    boxShadow: '0 20px 40px rgba(15, 23, 42, 0.04)',
                    minHeight: '360px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '18px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>Monthly Revenue Trend</p>
                    </div>
                    <button
                      style={{
                        border: '1px solid rgba(15, 23, 42, 0.12)',
                        background: 'transparent',
                        borderRadius: '999px',
                        padding: '10px 16px',
                        color: '#111111',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Last 6 months
                    </button>
                  </div>
                  <div style={{ flex: 1, position: 'relative', minHeight: '220px', overflow: 'hidden' }}>
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '20px',
                        background: 'linear-gradient(180deg, rgba(255, 140, 66, 0.12), rgba(255, 255, 255, 0.00))',
                      }}
                    />
                    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '20px 0' }}>
                      {['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map((month, idx) => {
                        const heights = [32, 42, 56, 72, 68, 80];
                        return (
                          <div key={month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flex: 1 }}>
                            <div style={{ width: '100%', height: `${heights[idx]}%`, minHeight: '32px', background: 'linear-gradient(180deg, #ff8c42, rgba(255, 140, 66, 0.35))', borderRadius: '20px 20px 0 0' }} />
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{month}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '24px',
                    padding: '24px',
                    border: '1px solid rgba(15, 23, 42, 0.08)',
                    boxShadow: '0 20px 40px rgba(15, 23, 42, 0.04)',
                    minHeight: '360px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111111' }}>Payment Methods</p>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Share</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {paymentMethods.map((method, idx) => (
                      <div key={`${method.name}-${idx}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111111' }}>{method.name}</span>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{method.percentage.toFixed(1)}%</span>
                        </div>
                        <div style={{ height: '10px', width: '100%', borderRadius: '999px', background: '#f4f4f6' }}>
                          <div style={{ width: `${method.percentage}%`, height: '100%', borderRadius: '999px', background: method.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '24px',
                  padding: '24px',
                  border: '1px solid rgba(15, 23, 42, 0.08)',
                  boxShadow: '0 20px 40px rgba(15, 23, 42, 0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111111' }}>Hotel Performance</h3>
                    <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      Performance summary across the top venues
                    </p>
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Updated just now</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.08)' }}>
                      <th style={{ textAlign: 'left', padding: '16px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700' }}>Hotel</th>
                      <th className="desktop-only" style={{ textAlign: 'right', padding: '16px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700' }}>Revenue</th>
                      <th className="desktop-only" style={{ textAlign: 'right', padding: '16px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700' }}>Orders</th>
                      <th className="desktop-only" style={{ textAlign: 'right', padding: '16px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700' }}>Growth</th>
                      <th style={{ textAlign: 'right', padding: '16px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700' }}>Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceRows.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: idx !== performanceRows.length - 1 ? '1px solid rgba(15, 23, 42, 0.08)' : 'none' }}>
                        <td style={{ padding: '18px 0', fontSize: '14px', color: '#111111', fontWeight: '600' }}>{row.hotel}</td>
                        <td className="desktop-only" style={{ padding: '18px 0', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>{row.revenue}</td>
                        <td className="desktop-only" style={{ padding: '18px 0', textAlign: 'right', fontSize: '14px', color: 'var(--text-secondary)' }}>{row.orders.toLocaleString()}</td>
                        <td className="desktop-only" style={{ padding: '18px 0', textAlign: 'right', fontSize: '14px', color: '#2d7a4a', fontWeight: '700' }}>{row.growth}</td>
                        <td style={{ padding: '18px 0', textAlign: 'right' }}>
                          <div style={{ width: '100px', height: '10px', borderRadius: '999px', background: '#f4f4f6', marginLeft: 'auto' }}>
                            <div style={{ width: `${Math.min(Math.max(parseInt(row.growth.replace('+', '').replace('%', '')), 0), 100)}%`, height: '100%', borderRadius: '999px', background: '#ff8c42' }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activePage === 'settings' && (
            <div className="admin-page-mobile-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div className="desktop-only">
                  <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px', color: '#111827', margin: 0 }}>
                    System Settings
                  </h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                    Configure platform-wide preferences
                  </p>
                </div>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: '#ff6b35',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '24px',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(255, 107, 53, 0.2)'
                  }}
                >
                  <Save size={18} />
                  Save Changes
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Profile Card */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(15, 23, 42, 0.08)', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ff6b35', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                      SA
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: '#111827' }}>{user?.name || 'Super Admin'}</h3>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Platform Administrator</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{ background: '#fff0ec', color: '#ff6b35', border: 'none', padding: '8px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Sign out
                  </button>
                </div>

                {/* General Section */}
                <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid rgba(15, 23, 42, 0.08)', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#ff6b35', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Globe size={20} />
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>General</h2>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Dark Mode */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', margin: 0, color: '#111827' }}>Dark Mode</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Enable dark theme across the platform</p>
                      </div>
                      <div onClick={() => handleSettingToggle('darkMode')} style={{ width: '44px', height: '24px', background: adminSettings.darkMode ? '#F97316' : '#E2E8F0', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
                        <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: adminSettings.darkMode ? '22px' : '2px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                      </div>
                    </div>
                    {/* Push Notifications */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', margin: 0, color: '#111827' }}>Push Notifications</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Receive alerts for critical updates</p>
                      </div>
                      <div onClick={() => handleSettingToggle('pushNotifications')} style={{ width: '44px', height: '24px', background: adminSettings.pushNotifications ? '#F97316' : '#E2E8F0', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
                        <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: adminSettings.pushNotifications ? '22px' : '2px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                      </div>
                    </div>
                    {/* Auto-assign Managers */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', margin: 0, color: '#111827' }}>Auto-assign Managers</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Automatically link new venues</p>
                      </div>
                      <div onClick={() => handleSettingToggle('autoAssignManagers')} style={{ width: '44px', height: '24px', background: adminSettings.autoAssignManagers ? '#F97316' : '#E2E8F0', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
                        <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: adminSettings.autoAssignManagers ? '22px' : '2px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Section */}
                <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid rgba(15, 23, 42, 0.08)', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F97316', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Shield size={20} />
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Security</h2>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', margin: 0, color: '#111827' }}>Two-Factor Authentication</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Require 2FA for all admin logins</p>
                      </div>
                      <div onClick={() => handleSettingToggle('twoFactorAuth')} style={{ width: '44px', height: '24px', background: adminSettings.twoFactorAuth ? '#F97316' : '#E2E8F0', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: 'background 0.3s' }}>
                        <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: adminSettings.twoFactorAuth ? '22px' : '2px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                      </div>
                    </div>
                    <div style={{ paddingTop: '24px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Session Timeout</label>
                      <select value={adminSettings.sessionTimeout} onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#FAFAFA', fontSize: '14px', color: '#111827', outline: 'none' }}>
                        <option>15 mins</option>
                        <option>30 mins</option>
                        <option>1 hour</option>
                        <option>Never</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Data & Backup Section */}
                <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid rgba(15, 23, 42, 0.08)', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#64748B', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Database size={20} />
                    </div>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Data & Backup</h2>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', margin: 0, color: '#111827' }}>Daily Backups</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Schedule automatic database backups</p>
                      </div>
                      <div style={{ width: '44px', height: '24px', background: '#ff6b35', borderRadius: '12px', position: 'relative', cursor: 'pointer' }}>
                        <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: '22px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                      </div>
                    </div>
                    <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Backup Frequency</label>
                      <select style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#FAFAFA', fontSize: '14px', color: '#111827', outline: 'none' }}>
                        <option>Daily at Midnight</option>
                        <option>Weekly</option>
                      </select>
                    </div>
                    <div style={{ paddingTop: '16px' }}>
                      <button style={{ background: 'transparent', border: 'none', color: '#ef4444', fontWeight: '600', fontSize: '14px', padding: '0', cursor: 'pointer' }}>
                        Export System Data
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={activePage === item.id ? 'active' : ''}
              onClick={() => setActivePage(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <VoiceWidget onNavigate={setActivePage} />
    </div>
  );
};

export default AdminDashboard;
