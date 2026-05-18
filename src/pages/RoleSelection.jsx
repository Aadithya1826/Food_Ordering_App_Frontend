import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronRight, LogOut } from 'lucide-react';
import RestaurantBG from '../assets/restaurant_bg.png';
import UdupiBanner from '../assets/udupi-banner.png';
import DataudipiTitle from '../assets/Dataudupi-Title.png';
import ChefMascot from '../assets/chef_mascot.png';

const RoleSelection = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);

  const roles = [
    {
      id: 'super_admin',
      label: 'Super Admin',
      abbreviation: 'SA',
      description: 'Manage hotels, venues & managers',
      color: 'gray',
      path: '/admin-dashboard',
    },
    {
      id: 'hotel_manager',
      label: 'Hotel Manager',
      abbreviation: 'HM',
      description: 'Manage daily restaurant operations',
      color: 'gray',
      path: '/hotel-dashboard',
    },
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role.id);
    // Navigate to the role-specific dashboard
    setTimeout(() => {
      navigate(role.path, { state: { role: role.label, user } });
    }, 300);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div
      className="role-selection-container"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.06) 100%), url(${RestaurantBG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'screen',
      }}
    >
      <div className="page-top-banner">
        <img src={UdupiBanner} alt="Data Udipi signboard" />
      </div>
      <div className="role-selection-content">
        <div className="hero-title-block">
          <img src={DataudipiTitle} alt="DATA UDIPI" className="hero-title-image" />
          <div className="hero-subtitle">Restaurant Management System</div>
        </div>

        <div className="role-selection-header">
          <div className="role-selection-title">Choose Your Role</div>
          {user && (
            <div style={{ marginTop: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Welcome, <strong>{user.name}</strong>
            </div>
          )}
        </div>

        {/* Role Options */}
        <div className="role-options">
          {roles.map((role) => (
            <button
              key={role.id}
              className={`btn-role ${role.color === 'gray' ? 'hotel-manager' : ''} ${
                selectedRole === role.id ? 'active' : ''
              }`}
              onClick={() => handleRoleSelect(role)}
            >
              <div className="btn-role-icon">{role.abbreviation}</div>
              <div className="btn-role-content">
                <h3>{role.label}</h3>
                <p>{role.description}</p>
              </div>
              <ChevronRight className="btn-role-arrow" size={24} />
            </button>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            marginTop: '40px',
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            margin: '40px auto 0',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = 'var(--primary)';
            e.target.style.color = 'var(--primary)';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = 'var(--border-color)';
            e.target.style.color = 'var(--text-secondary)';
          }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
      <div className="page-footer-banner">
        <img src={ChefMascot} alt="Chef mascot" className="mascot-image" />
      </div>
    </div>
  );
};

export default RoleSelection;
