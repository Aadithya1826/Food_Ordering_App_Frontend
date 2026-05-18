import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import DataudipiTitle from '../assets/Dataudupi-Title.png';
import { orderService, inventoryService, menuService, tableService } from '../services/api';
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');

  // Data states
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [inventory, setInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ordersData, inventoryData, menuData, tablesData] = await Promise.all([
          orderService.getLiveOrders().catch(() => []),
          inventoryService.getInventory().catch(() => []),
          menuService.getItems().catch(() => []),
          tableService.getTables().catch(() => []),
        ]);

        setOrders(ordersData);
        setInventory(inventoryData);
        setMenuItems(menuData);
        setTables(tablesData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setOrdersLoading(false);
        setInventoryLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
    { label: 'Total Orders', value: orders.length.toString(), change: '+12%', icon: ShoppingCart, color: '#ff8c42' },
    { label: 'Revenue Today', value: '₹' + (orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)).toLocaleString(), change: '+8%', icon: TrendingUp, color: '#2d7a4a' },
    { label: 'Pending Orders', value: orders.filter(o => o.status !== 'COMPLETED').length.toString(), change: '-3', icon: Clock, color: '#ff8c42' },
    { label: 'Active Tables', value: `${tables.length}/20`, change: `${tables.length > 0 ? Math.round((tables.length / 20) * 100) : 0}%`, icon: Table2, color: '#2d7a4a' },
  ];

  // Get best sellers from fetched menu items
  const bestSellersList = menuItems.length > 0
    ? menuItems.slice(0, 3).map(item => ({
      name: item.name,
      orders: Math.floor(Math.random() * 200),
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
          <div className="logo-symbol-manager">MANAGER</div>

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
              <h1>Good Morning! {user?.name?.split(' ')[0]}</h1>
              <p>Here's what's happening at your restaurant today</p>
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

              {/* Best Sellers Section */}
              <div className="admin-activity-card">
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Best Sellers Today</h2>
                {bestSellersList.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No menu items available.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {bestSellersList.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
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
                            fontSize: '18px',
                            flexShrink: 0,
                          }}
                        >
                          {item.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{item.name}</p>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.orders} orders</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Staff Notifications */}
              {staffNotifications.length > 0 && (
                <div className="admin-activity-card">
                  <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Notifications</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {staffNotifications.map((notification, idx) => {
                      const Icon = notification.icon;
                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            gap: '16px',
                            padding: '12px',
                            background: 'rgba(255, 140, 66, 0.1)',
                            border: '1px solid rgba(255, 140, 66, 0.2)',
                            borderRadius: '8px',
                          }}
                        >
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              background: 'rgba(255, 140, 66, 0.2)',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--primary)',
                              flexShrink: 0,
                            }}
                          >
                            <Icon size={20} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{notification.message}</p>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{notification.detail}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Orders Section */}
              <div className="admin-activity-card">
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Recent Orders</h2>
                {ordersLoading ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading orders...</p>
                ) : orders.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No live orders at the moment.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {orders.slice(0, 5).map((order, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: '8px',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: '12px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--primary)' }}>#{order.order_id}</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                              {order.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <span>🪑 {order.table_number}</span>
                            <span>⏱️ {new Date(order.created_at).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span
                            style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600',
                              background:
                                order.status === 'PREPARING'
                                  ? 'rgba(255, 140, 66, 0.2)'
                                  : order.status === 'READY'
                                    ? 'rgba(45, 122, 74, 0.2)'
                                    : 'rgba(100, 100, 100, 0.2)',
                              color:
                                order.status === 'PREPARING'
                                  ? 'var(--primary)'
                                  : order.status === 'READY'
                                    ? '#2d7a4a'
                                    : '#666',
                            }}
                          >
                            {order.status}
                          </span>
                          <span style={{ fontWeight: '600', fontSize: '13px' }}>₹{order.total_amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
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
      <VoiceWidget onNavigate={setActivePage} />
    </div>
  );
};

export default HotelManagerDashboard;
