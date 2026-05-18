import React, { useState, useEffect } from 'react';
import {
  Store,
  Clock,
  Bell,
  Receipt,
  Save,
  Activity
} from 'lucide-react';
import { restaurantService, authService } from '../services/api';

const SettingsManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    name: '',
    phone: '',
    address: '',
    gst_number: '',
    opening_time: '',
    closing_time: '',
    order_notifications: 1,
    low_stock_alerts: 1,
    daily_email_reports: 1,
    auto_print_bills: 1,
    print_kot: 0,
    tax_rate: 5.0,
    service_charge: 0.0,
    packaging_charge: 10.0
  });

  const [restaurantId, setRestaurantId] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const user = authService.getCurrentUser();
        if (user && user.restaurant_id) {
          setRestaurantId(user.restaurant_id);
          const data = await restaurantService.getRestaurant(user.restaurant_id);

          setSettings({
            name: data.name || '',
            phone: data.phone || '',
            address: data.address || '',
            gst_number: data.gst_number || '',
            opening_time: data.opening_time || '07:00',
            closing_time: data.closing_time || '22:00',
            order_notifications: data.order_notifications !== undefined ? data.order_notifications : 1,
            low_stock_alerts: data.low_stock_alerts !== undefined ? data.low_stock_alerts : 1,
            daily_email_reports: data.daily_email_reports !== undefined ? data.daily_email_reports : 1,
            auto_print_bills: data.auto_print_bills !== undefined ? data.auto_print_bills : 1,
            print_kot: data.print_kot !== undefined ? data.print_kot : 0,
            tax_rate: data.tax_rate !== undefined ? data.tax_rate : 5.0,
            service_charge: data.service_charge !== undefined ? data.service_charge : 0.0,
            packaging_charge: data.packaging_charge !== undefined ? data.packaging_charge : 10.0
          });
        }
      } catch (err) {
        console.error("Failed to load restaurant settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!restaurantId) return;

    setSaving(true);
    try {
      await restaurantService.updateRestaurant(restaurantId, settings);
      alert("Settings saved successfully!");
    } catch (err) {
      console.error("Failed to save settings", err);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Check if the input is a toggle/checkbox (which we simulate using numeric 1/0 in our DB)
    if (type === 'checkbox') {
      setSettings(prev => ({ ...prev, [name]: checked ? 1 : 0 }));
    } else if (type === 'number') {
      setSettings(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleToggle = (name) => {
    setSettings(prev => ({ ...prev, [name]: prev[name] === 1 ? 0 : 1 }));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Activity size={48} style={{ margin: '0 auto 20px', color: 'var(--primary)' }} className="spin-animation" />
        <p style={{ color: 'var(--text-secondary)' }}>Loading settings...</p>
      </div>
    );
  }

  // Helper component for toggle switches
  const ToggleSwitch = ({ label, description, name, checked }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{label}</h4>
        {description && <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{description}</p>}
      </div>
      <div
        onClick={() => handleToggle(name)}
        style={{
          width: '44px',
          height: '24px',
          background: checked ? 'var(--primary)' : 'var(--border)',
          borderRadius: '12px',
          position: 'relative',
          cursor: 'pointer',
          transition: 'background 0.3s'
        }}
      >
        <div style={{
          width: '20px',
          height: '20px',
          background: 'white',
          borderRadius: '50%',
          position: 'absolute',
          top: '2px',
          left: checked ? '22px' : '2px',
          transition: 'left 0.3s',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }} />
      </div>
    </div>
  );

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'transparent',
    fontSize: '14px',
    color: '#0c0b0bff',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-secondary)',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', paddingBottom: '80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>
            System Settings
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Configure your restaurant preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f8561cff',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            border: 'none'
          }}
        >
          {saving ? <Activity size={18} className="spin-animation" /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Restaurant Information Card */}
        <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ff6b35', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={20} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Restaurant Information</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Restaurant Name</label>
              <input type="text" name="name" value={settings.name} onChange={handleChange} style={inputStyle} placeholder="Data Udipi" />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input type="text" name="phone" value={settings.phone} onChange={handleChange} style={inputStyle} placeholder="support@dataudipi.com" />
            </div>
            <div>
              <label style={labelStyle}>GST Number</label>
              <input type="text" name="gst_number" value={settings.gst_number} onChange={handleChange} style={inputStyle} placeholder="GSTIN" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Address</label>
              <input type="text" name="address" value={settings.address} onChange={handleChange} style={inputStyle} placeholder="Asia/Kolkata (IST)" />
            </div>
          </div>
        </div>

        {/* Opening Hours Card */}
        <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#8e9eab', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Opening Hours</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Opening</label>
              <input type="time" name="opening_time" value={settings.opening_time} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Closing</label>
              <input type="time" name="closing_time" value={settings.closing_time} onChange={handleChange} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Notifications Card */}
        <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#2d7a4a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={20} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Notifications</h2>
          </div>

          <div>
            <ToggleSwitch
              label="Order Notifications"
              description="Receive platform updates via email"
              name="order_notifications"
              checked={settings.order_notifications === 1}
            />
            <ToggleSwitch
              label="Low stock alerts"
              description="Browser push notifications for critical alerts"
              name="low_stock_alerts"
              checked={settings.low_stock_alerts === 1}
            />
            <ToggleSwitch
              label="Daily email reports"
              description="Get notified for new orders across hotels"
              name="daily_email_reports"
              checked={settings.daily_email_reports === 1}
            />
          </div>
        </div>

        {/* Billing & Printing Card */}
        <div style={{ background: 'var(--surface)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ffaa71', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={20} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Billing & Printing</h2>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <ToggleSwitch
              label="Auto-Print Bills"
              description="Automatically print bill after payment"
              name="auto_print_bills"
              checked={settings.auto_print_bills === 1}
            />
            <ToggleSwitch
              label="Print KOT"
              description="Print Kitchen Order Ticket for each order"
              name="print_kot"
              checked={settings.print_kot === 1}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Tax Rate (%)</label>
              <input type="number" name="tax_rate" value={settings.tax_rate} onChange={handleChange} style={inputStyle} min="0" step="0.1" />
            </div>
            <div>
              <label style={labelStyle}>Service Charge (%)</label>
              <input type="number" name="service_charge" value={settings.service_charge} onChange={handleChange} style={inputStyle} min="0" step="0.1" />
            </div>
            <div>
              <label style={labelStyle}>Packaging Charge (₹)</label>
              <input type="number" name="packaging_charge" value={settings.packaging_charge} onChange={handleChange} style={inputStyle} min="0" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsManagement;
