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
} from 'lucide-react';
import VoiceWidget from '../components/VoiceWidget';
import DataudipiTitle from '../assets/Dataudupi-Title.png';
import { restaurantService, tableService, managerService } from '../services/api';

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
  }, []);

  // Sample data
  const stats = [
    {
      label: 'Total Hotels',
      value: '24',
      change: '+3 this month',
      icon: Building2,
      color: '#ff8c42',
    },
    {
      label: 'Active Managers',
      value: '38',
      change: '+5 this month',
      icon: Users2,
      color: '#2d7a4a',
    },
    {
      label: 'Platform Revenue',
      value: '₹12,45,800',
      change: '+18%',
      icon: DollarSign,
      color: '#ff8c42',
    },
    {
      label: 'Active Venues',
      value: '31',
      change: '+96% uptime',
      icon: MapPin,
      color: '#2d7a4a',
    },
  ];

  const reportCards = [
    {
      label: 'Total Platform Revenue',
      value: '₹48,52,300',
      change: '+22%',
      color: '#ff8c42',
      icon: '₹',
    },
    {
      label: 'Total Orders',
      value: '18,456',
      change: '+15%',
      color: '#2d7a4a',
      icon: '🧾',
    },
    {
      label: 'Avg. Order Value',
      value: '₹263',
      change: '+5%',
      color: '#ff8c42',
      icon: '💳',
    },
    {
      label: 'Customer Satisfaction',
      value: '4.6/5',
      change: '-0.1',
      color: '#f82b60',
      icon: '⭐',
    },
  ];

  const paymentMethods = [
    { name: 'UPI', value: 48, color: '#ff8c42' },
    { name: 'Cash', value: 28, color: '#2d7a4a' },
    { name: 'Card', value: 18, color: '#ff6b6b' },
    { name: 'Wallet', value: 6, color: '#6b7280' },
  ];

  const performanceRows = [
    { hotel: 'Grand Udipi Palace', revenue: '₹3,24,500', orders: 1245, growth: '+18%' },
    { hotel: 'Sagar Delights', revenue: '₹2,89,300', orders: 1102, growth: '+14%' },
    { hotel: 'Coastal Kitchen', revenue: '₹2,45,100', orders: 987, growth: '+21%' },
    { hotel: 'Dosa Corner', revenue: '₹1,98,700', orders: 856, growth: '+9%' },
    { hotel: 'Heritage Kitchen', revenue: '₹1,45,800', orders: 632, growth: '+28%' },
  ];

  const topHotels = [
    { id: 1, name: 'Grand Udpi Palace', city: 'Mumbai', revenue: '₹3,24,500', orders: 1245, growth: '+18%' },
    { id: 2, name: 'Sagar Delights', city: 'Bangalore', revenue: '₹2,89,300', orders: 1102, growth: '+14%' },
    { id: 3, name: 'Coastal Kitchen', city: 'Chennai', revenue: '₹2,45,100', orders: 987, growth: '+21%' },
    { id: 4, name: 'Dosa Corner', city: 'Hyderabad', revenue: '₹1,98,700', orders: 856, growth: '+9%' },
    { id: 5, name: 'Café Mysore', city: 'Pune', revenue: '₹1,67,200', orders: 723, growth: '+6%' },
  ];

  const recentActivity = [
    { type: 'hotel_added', message: 'New hotel added', details: 'Heritage Kitchen - Delhi', time: '2 hours ago' },
    { type: 'manager_assigned', message: 'Manager assigned', details: 'Rajesh K. → Grand Udpi Palace', time: '4 hours ago' },
    { type: 'venue_activated', message: 'Venue activated', details: 'Coastal Kitchen - Branch 2', time: '6 hours ago' },
    { type: 'hotel_deactivated', message: 'Hotel deactivated', details: 'Old Mysore Cafe', time: '1 day ago' },
  ];

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
        {/* Header */}
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
            <>
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
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        Hotel
                      </th>
                      <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        City
                      </th>
                      <th style={{ textAlign: 'right', padding: '12px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        Revenue
                      </th>
                      <th style={{ textAlign: 'right', padding: '12px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        Orders
                      </th>
                      <th style={{ textAlign: 'right', padding: '12px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        Growth
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topHotels.map((hotel, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              background: 'var(--primary)',
                              borderRadius: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '16px',
                            }}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <p style={{ fontWeight: '600', fontSize: '14px' }}>{hotel.name}</p>
                          </div>
                        </td>
                        <td style={{ padding: '16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                          📍 {hotel.city}
                        </td>
                        <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: '600', fontSize: '14px' }}>{hotel.revenue}</td>
                        <td style={{ padding: '16px 0', textAlign: 'right', fontSize: '14px', color: 'var(--text-secondary)' }}>
                          {hotel.orders}
                        </td>
                        <td style={{ padding: '16px 0', textAlign: 'right', color: '#2d7a4a', fontWeight: '600', fontSize: '14px' }}>
                          {hotel.growth}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Inventory Section */}
              <div className="admin-table-card" style={{ marginTop: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Table Inventory</h2>
                {tablesLoading ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading table details...</p>
                ) : tablesError ? (
                  <p style={{ color: '#c0392b', fontSize: '14px' }}>{tablesError}</p>
                ) : tables.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No table records available.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                          Table ID
                        </th>
                        <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                          Table Number
                        </th>
                        <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                          Restaurant
                        </th>
                        <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                          QR Code
                        </th>
                        <th style={{ textAlign: 'right', padding: '12px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                          Created At
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tables.map((table) => (
                        <tr key={table.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '16px 0', fontSize: '14px' }}>{table.id}</td>
                          <td style={{ padding: '16px 0', fontSize: '14px', fontWeight: '600' }}>{table.table_number}</td>
                          <td style={{ padding: '16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>{table.restaurant_id ?? '—'}</td>
                          <td style={{ padding: '16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            <a href={table.qr_code} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
                              View QR
                            </a>
                          </td>
                          <td style={{ padding: '16px 0', textAlign: 'right', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {new Date(table.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
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
            </>
          )}

          {activePage === 'hotels' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Header */}
              <div>
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
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
                    color: 'var(--text-primary)',
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
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '12px',
                        padding: '20px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.25s ease',
                        cursor: 'pointer',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.14)';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {/* Hotel Icon at Top Left */}
                      <div style={{ position: 'absolute', top: '16px', left: '16px' }}>
                        <Building2 size={24} color="#ff8c42" />
                      </div>

                      {/* Status Badge */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '12px', paddingTop: '8px' }}>
                        <span
                          style={{
                            background: '#d4edda',
                            color: '#155724',
                            borderRadius: '20px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.3px',
                          }}
                        >
                          Active
                        </span>
                      </div>

                      {/* Hotel Name */}
                      <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' }}>
                        {hotel.name}
                      </h4>

                      {/* Location */}
                      <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '13px' }}>
                        {hotel.address || 'No address provided'}
                      </p>

                      {/* Data Rows */}
                      <div style={{ fontSize: '12px', lineHeight: '1.8', color: '#555', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#888' }}>Phone</span>
                          <span style={{ fontWeight: '500' }}>{hotel.phone || '—'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                          <span style={{ color: '#888' }}>Created</span>
                          <span style={{ fontWeight: '500' }}>
                            {hotel.created_at ? new Date(hotel.created_at).toLocaleDateString() : '—'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                          <span style={{ color: '#888' }}>Hotel ID:</span>
                          <span style={{ fontWeight: '500', color: '#0066cc' }}>{hotel.id}</span>
                        </div>
                      </div>

                      {/* Manager Name at Bottom Corner */}
                      <div style={{ 
                        position: 'absolute', 
                        bottom: '16px', 
                        right: '16px', 
                        fontSize: '11px', 
                        color: '#888', 
                        fontWeight: '500',
                        background: 'rgba(255, 255, 255, 0.9)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #eee'
                      }}>
                        {hotel.manager_name ? `Manager: ${hotel.manager_name}` : 'No manager assigned'}
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
                          style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'var(--text-primary)' }}
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
                          style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'var(--text-primary)' }}
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
                          style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--surface)', color: 'var(--text-primary)' }}
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
            </div>
          )}

          {activePage === 'managers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Header */}
              <div>
                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Managers</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Manage hotel managers and their assignments
                </p>
              </div>

              {/* Add Manager Button */}
              <button
                onClick={() => {}}
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
                    color: 'var(--text-primary)',
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
                        style={{
                          background: '#FFFFFF',
                          borderRadius: '12px',
                          padding: '20px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.25s ease',
                          cursor: 'pointer',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.14)';
                          e.currentTarget.style.transform = 'translateY(-4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {/* Manager Avatar and Status */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <div
                            style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '50%',
                              background: bgColor,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '700',
                              fontSize: '20px',
                            }}
                          >
                            {initials}
                          </div>
                          <span
                            style={{
                              background: manager.is_active ? '#d4edda' : '#f8d7da',
                              color: manager.is_active ? '#155724' : '#856404',
                              borderRadius: '20px',
                              padding: '4px 10px',
                              fontSize: '11px',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              letterSpacing: '0.3px',
                            }}
                          >
                            {manager.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>

                        {/* Manager Name */}
                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1a1a1a', marginBottom: '4px' }}>
                          {manager.name}
                        </h4>

                        {/* Hotel Name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                          <Building2 size={16} color="#ff8c42" />
                          <p style={{ margin: 0, color: '#666', fontSize: '13px', fontWeight: '500' }}>
                            {manager.restaurant_name}
                          </p>
                        </div>

                        {/* Data Rows */}
                        <div style={{ fontSize: '12px', lineHeight: '2', color: '#555', flex: 1, marginBottom: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ color: '#888' }}>📧</span>
                            <span style={{ fontWeight: '500', wordBreak: 'break-all' }}>{manager.email}</span>
                          </div>
                          {manager.restaurant_phone && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ color: '#888' }}>📱</span>
                              <span style={{ fontWeight: '500' }}>{manager.restaurant_phone}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ color: '#888' }}>👤</span>
                            <span style={{ fontWeight: '500' }}>{manager.role}</span>
                          </div>
                          {manager.created_at && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ color: '#888' }}>📅</span>
                              <span style={{ fontWeight: '500', fontSize: '11px' }}>
                                Joined {new Date(manager.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Menu Dots */}
                        <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                          <button
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#999',
                              cursor: 'pointer',
                              fontSize: '20px',
                              padding: '4px 8px',
                            }}
                          >
                            ⋮
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activePage === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div>
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
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr',
                  gap: '20px',
                  alignItems: 'stretch',
                }}
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
                    {paymentMethods.map((method) => (
                      <div key={method.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#111111' }}>{method.name}</span>
                          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{method.value}%</span>
                        </div>
                        <div style={{ height: '10px', width: '100%', borderRadius: '999px', background: '#f4f4f6' }}>
                          <div style={{ width: `${method.value}%`, height: '100%', borderRadius: '999px', background: method.color }} />
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
                      <th style={{ textAlign: 'right', padding: '16px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700' }}>Revenue</th>
                      <th style={{ textAlign: 'right', padding: '16px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700' }}>Orders</th>
                      <th style={{ textAlign: 'right', padding: '16px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700' }}>Growth</th>
                      <th style={{ textAlign: 'right', padding: '16px 0', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '700' }}>Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceRows.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: idx !== performanceRows.length - 1 ? '1px solid rgba(15, 23, 42, 0.08)' : 'none' }}>
                        <td style={{ padding: '18px 0', fontSize: '14px', color: '#111111', fontWeight: '600' }}>{row.hotel}</td>
                        <td style={{ padding: '18px 0', textAlign: 'right', fontSize: '14px', fontWeight: '600' }}>{row.revenue}</td>
                        <td style={{ padding: '18px 0', textAlign: 'right', fontSize: '14px', color: 'var(--text-secondary)' }}>{row.orders.toLocaleString()}</td>
                        <td style={{ padding: '18px 0', textAlign: 'right', fontSize: '14px', color: '#2d7a4a', fontWeight: '700' }}>{row.growth}</td>
                        <td style={{ padding: '18px 0', textAlign: 'right' }}>
                          <div style={{ width: '120px', height: '10px', borderRadius: '999px', background: '#f4f4f6' }}>
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
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Settings size={48} style={{ margin: '0 auto 20px', color: 'var(--text-secondary)', opacity: 0.5 }} />
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>System Settings</h3>
              <p style={{ color: 'var(--text-secondary)' }}>System configuration - coming soon</p>
            </div>
          )}
        </div>
      </div>
      <VoiceWidget onNavigate={setActivePage} />
    </div>
  );
};

export default AdminDashboard;
