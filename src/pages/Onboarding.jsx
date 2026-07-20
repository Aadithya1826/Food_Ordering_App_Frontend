import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { restaurantService } from '../services/api';
import { ChevronRight, LogOut, AlertCircle, Loader, Eye, EyeOff } from 'lucide-react';
import RestaurantBG from '../assets/restaurant_bg.png';
import UdupiBanner from '../assets/udupi-banner.png';
import DataudipiTitle from '../assets/Dataudupi-Title.png';
import ChefMascot from '../assets/chef_mascot.png';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, login, signup } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'SUPER_ADMIN') {
        navigate('/admin-dashboard');
      } else if (user.role === 'CASHIER') {
        navigate('/cashier-dashboard');
      } else {
        navigate('/manager-dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  // States
  const [step, setStep] = useState('role'); // 'role', 'auth'
  const [selectedRole, setSelectedRole] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login', 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    restaurant_id: '',
  });
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantLoading, setRestaurantLoading] = useState(false);

  const roles = [
    {
      id: 'super_admin',
      label: 'Super Admin',
      abbreviation: 'SA',
      description: 'Manage hotels, venues & managers',
      color: 'orange',
    },
    {
      id: 'hotel_manager',
      label: 'Hotel Manager',
      abbreviation: 'HM',
      description: 'Manage daily restaurant operations',
      color: 'gray',
    },
    {
      id: 'cashier',
      label: 'Cashier',
      abbreviation: 'CA',
      description: 'Manage cash payments and bill generation',
      color: 'blue',
    },
  ];

  // Handle role selection
  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setError('');
    setSuccessMessage('');
    setFormData({ name: '', email: '', password: '', confirmPassword: '', restaurant_id: '' });
    setAuthMode('login');
    setStep('auth');
  };

  useEffect(() => {
    const fetchRestaurants = async () => {
      if ((selectedRole !== 'hotel_manager' && selectedRole !== 'cashier') || step !== 'auth') {
        return;
      }

      setRestaurantLoading(true);
      try {
        const data = await restaurantService.getPublicRestaurants();
        setRestaurants(data);
      } catch (err) {
        console.error('Failed to load restaurants', err);
        setError('Unable to load restaurant list. Please try again later.');
      } finally {
        setRestaurantLoading(false);
      }
    };

    fetchRestaurants();
  }, [selectedRole, step]);

  // Handle form changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = name === 'restaurant_id' ? (value ? parseInt(value, 10) : '') : value;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
    setError('');
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (!selectedRole) {
      setError('Please select a role before logging in.');
      setLoading(false);
      return;
    }

    let roleParam = 'HOTEL_ADMIN';
    if (selectedRole === 'super_admin') roleParam = 'SUPER_ADMIN';
    else if (selectedRole === 'cashier') roleParam = 'CASHIER';
    setLoading(true);
    try {
      await login(formData.email, formData.password, roleParam);
      // Navigate to respective dashboard directly
      if (selectedRole === 'super_admin') {
        navigate('/admin-dashboard');
      } else if (selectedRole === 'cashier') {
        navigate('/cashier-dashboard');
      } else {
        navigate('/manager-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!selectedRole) {
      setError('Please select a role before signing up.');
      return;
    }

    let roleParam = 'HOTEL_ADMIN';
    if (selectedRole === 'super_admin') roleParam = 'SUPER_ADMIN';
    else if (selectedRole === 'cashier') roleParam = 'CASHIER';

    if ((roleParam === 'HOTEL_ADMIN' || roleParam === 'CASHIER') && !formData.restaurant_id) {
      setError(`Please select a restaurant for the ${selectedRole.replace('_', ' ')} account.`);
      return;
    }

    setLoading(true);
    try {
      await signup(
        formData.name,
        formData.email,
        formData.password,
        roleParam,
        (roleParam === 'HOTEL_ADMIN' || roleParam === 'CASHIER') ? formData.restaurant_id : null
      );
      setSuccessMessage('Signup done successfully. Please sign in to login.');
      setError('');
      setAuthMode('login');
      setFormData((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
    } catch (err) {
      setSuccessMessage('');
      setError(err.response?.data?.detail || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle back to role selection
  const handleBack = () => {
    setStep('role');
    setSelectedRole(null);
    setError('');
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
  };

  // ========== ROLE SELECTION STEP ==========
  if (step === 'role') {
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
          </div>

          {/* Role Options */}
          <div className="role-options">
            {roles.map((role) => (
              <button
                key={role.id}
                className={`btn-role ${role.color === 'gray' ? 'hotel-manager' : ''} ${role.color === 'blue' ? 'cashier' : ''} ${
                  selectedRole === role.id ? 'active' : ''
                }`}
                onClick={() => handleRoleSelect(role.id)}
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
        </div>

        <div className="page-footer-banner">
          <img src={ChefMascot} alt="Chef mascot" className="mascot-image" />
        </div>
      </div>
    );
  }

  // ========== AUTHENTICATION STEP ==========
  return (
    <div
      className="login-container"
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
      <div className="login-content">
        <div className="hero-title-block">
          <img src={DataudipiTitle} alt="DATA UDIPI" className="hero-title-image" />
          <div className="hero-subtitle">Restaurant Management System</div>
        </div>

        {/* Role Info */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '30px',
            padding: '16px',
            background: 'rgba(255, 140, 66, 0.1)',
            border: '1px solid rgba(255, 140, 66, 0.3)',
            borderRadius: '8px',
            color: '#ff8c42',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          {selectedRole === 'super_admin' ? '👤 Super Admin Account' : selectedRole === 'cashier' ? '💵 Cashier Account' : '🍽️ Hotel Manager Account'}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="success-message">
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Tabs for Login/Signup */}
        {selectedRole !== 'hotel_manager' && (
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '30px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '16px',
          }}
        >
          <button
            onClick={() => {
              setAuthMode('login');
              setError('');
              setSuccessMessage('');
            }}
            style={{
              flex: 1,
              padding: '12px',
              background: authMode === 'login' ? 'rgba(255, 140, 66, 0.2)' : 'transparent',
              border: 'none',
              borderBottom: authMode === 'login' ? '2px solid var(--primary)' : 'none',
              color: authMode === 'login' ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setAuthMode('signup');
              setError('');
              setSuccessMessage('');
            }}
            style={{
              flex: 1,
              padding: '12px',
              background: authMode === 'signup' ? 'rgba(255, 140, 66, 0.2)' : 'transparent',
              border: 'none',
              borderBottom: authMode === 'signup' ? '2px solid var(--primary)' : 'none',
              color: authMode === 'signup' ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
            }}
          >
            Sign Up
          </button>
        </div>
        )}

        {/* Auth Form */}
        <form className="auth-form" onSubmit={authMode === 'login' ? handleLogin : handleSignup}>
          {/* Name Field - Only for Signup */}
          {authMode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleFormChange}
                disabled={loading}
              />
            </div>
          )}

          {/* Email Field */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleFormChange}
              disabled={loading}
            />
          </div>

          {/* Restaurant Selection - Only for hotel manager and cashier signup */}
          {authMode === 'signup' && (selectedRole === 'hotel_manager' || selectedRole === 'cashier') && (
            <div className="form-group">
              <label className="form-label">Restaurant</label>
              <select
                name="restaurant_id"
                className="form-input"
                value={formData.restaurant_id}
                onChange={handleFormChange}
                disabled={loading || restaurantLoading}
              >
                <option value="">Select a restaurant</option>
                {restaurants.map((restaurant) => (
                  <option key={restaurant.id} value={restaurant.id}>
                    {restaurant.name}
                  </option>
                ))}
              </select>
              {restaurantLoading && <div className="input-note">Loading restaurants…</div>}
              {!restaurantLoading && (selectedRole === 'hotel_manager' || selectedRole === 'cashier') && restaurants.length === 0 && (
                <div className="input-note">No restaurants available. Please contact your admin.</div>
              )}
            </div>
          )}

          {/* Password Field */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleFormChange}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password - Only for Signup */}
          {authMode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                className="form-input"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleFormChange}
                disabled={loading}
              />
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <>
                <Loader size={18} className="spinner" />
                <span>{authMode === 'login' ? 'Signing in...' : 'Creating account...'}</span>
              </>
            ) : (
              <span>{authMode === 'login' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

        {/* Back Button */}
        <button
          onClick={handleBack}
          style={{
            width: '100%',
            marginTop: '16px',
            padding: '12px',
            background: 'transparent',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
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
          ← Back to Role Selection
        </button>

      </div>
      <div className="page-footer-banner">
        <img src={ChefMascot} alt="Chef mascot" className="mascot-image" />
      </div>
    </div>
  );
};

export default Onboarding;
