import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import {
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  Table2,
  Package,
  TrendingUp,
  Settings,
  Clock,
  Users,
  AlertTriangle,
  CreditCard,
  Save,
} from 'lucide-react';
import DataudipiTitle from '../assets/Dataudupi-Title.png';
import ChefMascot from '../assets/chef_mascot.png';
import { orderService, inventoryService, menuService, tableService, reportsService } from '../services/api';
import MenuManagement from '../components/MenuManagement';
import OrdersManagement from '../components/OrdersManagement';
import TableManagement from '../components/TableManagement';
import InventoryManagement from '../components/InventoryManagement';
import PaymentManagement from '../components/PaymentManagement';
import ReportsManagement from '../components/ReportsManagement';
import SettingsManagement from '../components/SettingsManagement';
import VoiceWidget from '../components/VoiceWidget';

const HotelManagerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { hotelId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  if (hotelId) {
    localStorage.setItem('admin_selected_restaurant', hotelId);
  } else {
    localStorage.removeItem('admin_selected_restaurant');
  }

  useEffect(() => {
    return () => {
      localStorage.removeItem('admin_selected_restaurant');
    };
  }, []);

  // Data states
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [reports, setReports] = useState(null);

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

  useEffect(() => {
    if (activePage !== 'dashboard') return;

    const fetchDashboardData = async () => {
      try {
        const [ordersData, inventoryData, menuData, tablesData, reportsData] = await Promise.all([
          orderService.getLiveOrders().catch(() => []),
          inventoryService.getInventory().catch(() => []),
          menuService.getItems().catch(() => []),
          tableService.getTables().catch(() => []),
          reportsService.getReports().catch(() => null),
        ]);

        setOrders(ordersData);
        setInventory(inventoryData);
        setMenuItems(menuData);
        setTables(tablesData);
        setReports(reportsData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setOrdersLoading(false);
        setInventoryLoading(false);
      }
    };

    fetchDashboardData();
  }, [activePage]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const menuNavigation = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'tables', label: 'Tables & QR', icon: Table2 },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Calculate stats from live data
  const stats = [
    { label: 'Total Orders Today', value: reports?.summary?.today_orders?.value?.toString() || '0', change: reports?.summary?.today_orders?.change || '0%', icon: ShoppingCart, color: '#ff8c42' },
    { label: 'Revenue Today', value: '₹' + (reports?.summary?.today_revenue?.value || 0).toLocaleString(), change: reports?.summary?.today_revenue?.change || '0%', icon: TrendingUp, color: '#2d7a4a' },
    { label: 'Pending Orders', value: orders.filter(o => o.status !== 'COMPLETED' && o.status !== 'PAID').length.toString(), change: 'Live', icon: Clock, color: '#ff8c42' },
    { label: 'Active Tables', value: `${tables.filter(t => t.is_active && (t.status === 'Occupied' || t.current_order_id)).length}/${tables.length || 20}`, change: `${tables.length > 0 ? Math.round((tables.filter(t => t.is_active && (t.status === 'Occupied' || t.current_order_id)).length / tables.length) * 100) : 0}%`, icon: Table2, color: '#2d7a4a' },
  ];

  // Get best sellers from fetched reports
  const bestSellersList = reports?.top_items?.length > 0
    ? reports.top_items.slice(0, 3).map(item => ({
      name: item.name,
      orders: item.orders,
      icon: '🥘',
    }))
    : [];

  // Low stock notifications
  const lowStockItems = inventory.filter(item => item.quantity < 5);
  const staffNotifications = lowStockItems.length > 0
    ? [
      {
        type: 'alert',
        message: 'Low Stock Alert',
        detail: `${lowStockItems.length} item(s) running low on inventory`,
        icon: AlertTriangle,
      },
    ]
    : [];


  return (
    <div className={`admin-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      {/* Sidebar */}
      <div
        className={`admin-sidebar ${sidebarOpen ? 'expanded' : 'collapsed'}`}
      >
        {/* Logo */}
        <div className="sidebar-logo">
          {sidebarOpen && (
            <img
              src={DataudipiTitle}
              alt="Data Udipi"
              className="logo-title-image"
            />
          )}
          <div className="logo-symbol-manager">{sidebarOpen ? 'MANAGER' : 'MGR'}</div>

        </div>

        {/* Menu Items */}
        <div className="admin-sidebar-menu">
          {menuNavigation.map((item) => {
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
        <div className="manager-header-mobile">
          <style>{`
            @media (min-width: 1025px) {
              .manager-header-mobile { display: none !important; }
              .mobile-only-banner { display: none !important; }
            }
            @media (max-width: 1024px) {
              .manager-header-mobile { display: flex !important; flex-direction: column; box-sizing: border-box; width: 100%; padding: 24px 24px 32px 24px; background: #0A0A0A; border-radius: 0 0 32px 32px; margin-bottom: -16px; position: sticky; top: 0; z-index: 100; }
              .manager-header-mobile-top { display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 24px; }
              .manager-header-mobile img { height: 24px; }
              .manager-header-mobile .badge { background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.2); padding: 4px 12px; border-radius: 16px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
            }
          `}</style>
          <div className="manager-header-mobile-top">
            <img src={DataudipiTitle} alt="Data Udipi" />
            <div className="badge">MANAGER</div>
          </div>

          {/* Header Content based on activePage */}
          {activePage === 'dashboard' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: '800', color: '#fff' }}>
                  Good Morning!
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#999', fontWeight: '500' }}>
                  {user?.name || 'Anand Sharma'} · {reports?.summary?.restaurant_name || 'Grand Udipi Palace'}
                </p>
              </div>
              <span style={{ padding: '6px 12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%' }}></span>
                Open
              </span>
            </div>
          )}

          {activePage === 'orders' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '700', color: '#fff' }}>
                  Live Orders
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>
                  Kitchen Display - Real-time
                </p>
              </div>
              <span style={{ padding: '4px 12px', background: '#ff3b30', color: '#fff', borderRadius: '16px', fontSize: '11px', fontWeight: 'bold' }}>• {orders.filter(o => o.status !== 'SERVED').length} active</span>
            </div>
          )}

          {activePage === 'menu' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '700', color: '#fff' }}>
                  Menu Management
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>
                  {menuItems.length} items • {menuItems.filter(i => i.is_available).length} available
                </p>
              </div>
              <span style={{ padding: '4px 12px', background: '#ff3b30', color: '#fff', borderRadius: '16px', fontSize: '11px', fontWeight: 'bold' }}>• {menuItems.filter(i => i.is_available).length} active</span>
            </div>
          )}

          {activePage === 'tables' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '700', color: '#fff' }}>
                  Table & QR
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>
                  {tables.filter(t => t.is_active && (t.status === 'Occupied' || t.current_order_id)).length} occupied • {tables.filter(t => t.is_active && t.status !== 'Occupied' && t.status !== 'Reserved' && !t.current_order_id).length} vacant • {tables.length} total
                </p>
              </div>
              <button onClick={() => window.dispatchEvent(new CustomEvent('open-add-table-modal'))} style={{ padding: '6px 16px', background: '#ff6b35', color: '#fff', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>+ Table</button>
            </div>
          )}

          {activePage === 'inventory' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '700', color: '#fff' }}>
                  Inventory
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>
                  Manage stock levels and scan invoices
                </p>
              </div>
            </div>
          )}

          {activePage === 'payments' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '700', color: '#fff' }}>
                  Payments
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>
                  Track all payment transactions
                </p>
              </div>
            </div>
          )}

          {activePage === 'reports' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '700', color: '#fff' }}>
                  Reports & Analytics
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>
                  Your restaurant performance insights
                </p>
              </div>
            </div>
          )}

          {activePage === 'settings' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
              <div>
                <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '700', color: '#fff' }}>
                  Account & Settings
                </h2>
                <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>
                  Manage your account preferences
                </p>
              </div>
              <button onClick={() => window.dispatchEvent(new CustomEvent('save-settings'))} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px', background: '#ff6b35', color: '#fff', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                <Save size={14} /> Save
              </button>
            </div>
          )}
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
              <h1>Good Morning! {user?.name?.split(' ')[0]}</h1>
              <p>Here's what's happening at your restaurant today</p>
            </div>
          </div>
          <div className="status-pill">
            ✓ All systems operational
          </div>
        </div>

        <div className="admin-main-body" style={{ padding: '0 24px' }}>
          {activePage === 'dashboard' && (
            <div className="admin-page-mobile-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '80px', paddingTop: '32px' }}>



              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {stats.map((stat, idx) => {
                  const Icon = stat.icon;
                  let iconBg, iconColor, badgeBg, badgeColor, badgeText, outlineBorder;
                  if (idx === 0) {
                    iconBg = '#FF4500'; iconColor = 'white'; badgeBg = '#10B981'; badgeColor = 'white'; badgeText = '↗ ' + stat.change.replace('+', '');
                  } else if (idx === 1) {
                    iconBg = '#10B981'; iconColor = 'white'; badgeBg = '#10B981'; badgeColor = 'white'; badgeText = '↗ ' + stat.change.replace('+', '');
                  } else if (idx === 2) {
                    iconBg = '#fff0ec'; iconColor = '#FF4500'; badgeBg = '#fff0ec'; badgeColor = '#FF4500'; badgeText = '↗ ' + stat.change;
                    outlineBorder = 'none';
                  } else {
                    iconBg = '#e6f4ea'; iconColor = '#10B981'; badgeBg = '#10B981'; badgeColor = 'white'; badgeText = '↗ ' + stat.change;
                    outlineBorder = 'none';
                  }

                  return (
                    <div key={idx} style={{ background: '#fff', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ width: '32px', height: '32px', background: iconBg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, border: outlineBorder || 'none' }}>
                          <Icon size={16} />
                        </div>
                        <span style={{ fontSize: '11px', color: badgeColor, fontWeight: '700', background: badgeBg, padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {badgeText}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px', color: '#111' }}>{stat.value}</h3>
                      <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>{stat.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Best Sellers Section */}
              <div className="best-sellers-container" style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px', margin: '0 -24px', padding: '0 24px 8px 24px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                {bestSellersList.length === 0 ? null : bestSellersList.map((item, idx) => (
                  <div key={idx} className="best-seller-card" style={{ minWidth: '240px', background: 'white', borderRadius: '24px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FF4500', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" /></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#9CA3AF', letterSpacing: '0.5px', marginBottom: '4px', textTransform: 'uppercase' }}>BEST SELLER</div>
                      <div style={{ fontSize: '16px', fontWeight: '700', color: '#111', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{item.name}</div>
                      <div style={{ fontSize: '13px', color: '#9CA3AF' }}>{item.orders} orders today</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Staff Notifications */}
              {staffNotifications.length > 0 && (
                <div style={{ background: '#fff0ec', border: '1px solid #ffd8cd', borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start', position: 'relative' }}>
                  <div style={{ color: '#FF4500', marginTop: '2px' }}>
                    <AlertTriangle size={24} />
                  </div>
                  <div style={{ flex: 1, paddingRight: '60px' }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '700', color: '#111' }}>Low Stock Alert <span style={{ color: '#F59E0B' }}>⚠️</span></h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#666', lineHeight: '1.4' }}>
                      {lowStockItems.length} items running low: <span style={{ color: '#FF4500', fontWeight: '600' }}>{lowStockItems.map(i => i.name).join(', ')}</span>
                    </p>
                  </div>
                  <div style={{ position: 'absolute', top: '24px', right: '16px', fontSize: '12px', fontWeight: '700', color: '#FF4500', cursor: 'pointer' }}>
                    View All →
                  </div>
                </div>
              )}

              {/* Recent Orders Section */}
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: '#111' }}>Recent Orders</h2>
                    <span style={{ background: '#FF4500', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>LIVE</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#4B5563' }}>Updated just now</span>
                </div>
                {ordersLoading ? (
                  <p style={{ color: '#888', fontSize: '13px' }}>Loading orders...</p>
                ) : orders.length === 0 ? (
                  <p style={{ color: '#888', fontSize: '13px' }}>No live orders.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5).map((order, idx) => {
                      const orderItems = order.items?.length > 0 ? order.items.map(i => `${i.name} x${i.quantity}`).join(', ') : 'Various items';

                      let statusBg = '#e5e7eb';
                      let statusColor = '#4b5563';
                      let statusText = 'Pending';

                      if (order.status === 'PREPARING') { statusBg = '#fef3c7'; statusColor = '#d97706'; statusText = 'Preparing'; }
                      else if (order.status === 'READY') { statusBg = '#d1fae5'; statusColor = '#059669'; statusText = 'Ready'; }
                      else if (order.status === 'SERVED') { statusBg = '#e0e7ff'; statusColor = '#4f46e5'; statusText = 'Served'; }

                      return (
                        <div key={idx} style={{ background: 'white', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                          <span style={{ color: '#FF4500', fontWeight: '700', fontSize: '13px', minWidth: '45px' }}>#{order.order_id || '1042'}</span>
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '4px' }}>{orderItems}</div>
                            <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{(!order.table_number || order.table_number === 'N/A' || order.table_number.toString().toLowerCase() === 'takeaway') ? (order.order_type || 'Takeaway') : `Table ${order.table_number}`} · {new Date(order.created_at?.endsWith('Z') ? order.created_at : order.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                          <span style={{ background: statusBg, color: statusColor, padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '700' }}>
                            {statusText}
                          </span>
                          <span style={{ fontWeight: '800', fontSize: '14px', color: '#111' }}>₹{order.total_amount}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>


            </div>
          )}

          {activePage === 'menu' && (
            <MenuManagement />
          )}

          {activePage === 'orders' && (
            <OrdersManagement />
          )}

          {activePage === 'tables' && (
            <TableManagement />
          )}

          {activePage === 'inventory' && (
            <InventoryManagement />
          )}

          {activePage === 'payments' && (
            <PaymentManagement />
          )}

          {activePage === 'reports' && (
            <ReportsManagement />
          )}

          {activePage === 'settings' && (
            <SettingsManagement />
          )}
        </div>
      </div>

      {/* Mobile More Options Menu */}
      {isMoreMenuOpen && (
        <>
          <div
            onClick={() => setIsMoreMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'transparent' }}
            className="mobile-more-menu"
          />
          <div style={{
            position: 'fixed',
            bottom: 'calc(75px + env(safe-area-inset-bottom))',
            right: '16px',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            padding: '8px',
            zIndex: 1002,
            display: 'flex',
            flexDirection: 'column',
            minWidth: '180px',
            border: '1px solid #f0f0f0'
          }} className="mobile-more-menu">
            <style>{`
              @media (min-width: 1025px) { .mobile-more-menu { display: none !important; } }
            `}</style>
            {menuNavigation.slice(4).map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    setIsMoreMenuOpen(false);
                  }}
                  style={{
                    background: activePage === item.id ? '#fff0ec' : 'transparent',
                    border: 'none',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: activePage === item.id ? '#FF4500' : '#4B5563',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Icon size={18} color={activePage === item.id ? '#FF4500' : '#6B7280'} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="manager-mobile-bottom-nav">
        <style>{`
          @media (min-width: 1025px) {
            .manager-mobile-bottom-nav { display: none !important; }
          }
          @media (max-width: 1024px) {
            .manager-mobile-bottom-nav {
              display: flex !important; position: fixed; bottom: 0; left: 0; right: 0;
              background: #111111; padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
              justify-content: space-around;
              z-index: 1000;
              box-shadow: 0 -2px 10px rgba(0,0,0,0.5);
            }
            .manager-mobile-bottom-nav button {
              display: flex; flex-direction: column; align-items: center; gap: 4px;
              background: none; border: none; color: #888888; font-size: 11px; font-weight: 500; cursor: pointer; padding: 4px;
              transition: all 0.2s;
            }
            .manager-mobile-bottom-nav button.active { color: #FF4500; }
            .manager-mobile-bottom-nav button.active svg { stroke: #FF4500; }
          }
        `}</style>
        {menuNavigation.slice(0, 4).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={activePage === item.id ? 'active' : ''}
              onClick={() => {
                setActivePage(item.id);
                setIsMoreMenuOpen(false);
              }}
            >
              <Icon size={22} />
              <span>{item.label === 'Dashboard' ? 'Home' : item.label === 'Tables & QR' ? 'Tables' : item.label}</span>
            </button>
          );
        })}
        <button
          className={['inventory', 'payments', 'reports', 'settings'].includes(activePage) ? 'active' : ''}
          onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
        >
          <Menu size={22} />
          <span>More</span>
        </button>
      </div>

      <VoiceWidget onNavigate={(page, subtab) => {
        if (['dashboard', 'menu', 'orders', 'tables', 'inventory', 'payments', 'reports', 'settings'].includes(page)) {
          setActivePage(page);
        }
        if (subtab) {
          setTimeout(() => {
            if (page === 'orders') {
              window.dispatchEvent(new CustomEvent('navigate-orders-tab', { detail: { tab: subtab } }));
            } else if (page === 'menu') {
              window.dispatchEvent(new CustomEvent('navigate-menu-category', { detail: { category: subtab } }));
            }
          }, 100);
        }
      }} />
    </div>
  );
};

export default HotelManagerDashboard;
