import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Inject admin_selected_restaurant for super admin cross-hotel actions
  const adminSelectedRestaurant = localStorage.getItem('admin_selected_restaurant');
  if (adminSelectedRestaurant) {
    if (config.method === 'get' || config.method === 'delete') {
      config.params = { ...config.params, restaurant_id: adminSelectedRestaurant };
    } else if (config.method === 'post' || config.method === 'patch' || config.method === 'put') {
      if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
        config.data.restaurant_id = parseInt(adminSelectedRestaurant);
      } else if (config.data instanceof FormData) {
        config.data.append('restaurant_id', adminSelectedRestaurant);
      }
    }
  }

  return config;
});

export const authService = {
  login: async (email, password, role = undefined) => {
    const response = await api.post('/api/v1/auth/login', { email, password, role });
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  signup: async (name, email, password, role = null, restaurantId = null) => {
    try {
      const response = await api.post('/api/v1/auth/signup', { name, email, password, role, restaurant_id: restaurantId });
      return response.data;
    } catch (error) {
      // If signup endpoint doesn't exist, throw error to user
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken: () => localStorage.getItem('access_token'),

  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },
};

export const restaurantService = {
  getPublicRestaurants: async () => {
    const response = await api.get('/api/v1/public/restaurants');
    return response.data;
  },

  getAdminRestaurants: async () => {
    const response = await api.get('/api/v1/restaurants');
    return response.data;
  },

  createRestaurant: async (restaurantData) => {
    const response = await api.post('/api/v1/restaurants', restaurantData);
    return response.data;
  },

  getRestaurant: async (restaurantId) => {
    const response = await api.get(`/api/v1/restaurants/${restaurantId}`);
    return response.data;
  },

  updateRestaurant: async (restaurantId, updateData) => {
    const response = await api.patch(`/api/v1/restaurants/${restaurantId}`, updateData);
    return response.data;
  },

  deleteRestaurant: async (restaurantId) => {
    const response = await api.delete(`/api/v1/restaurants/${restaurantId}`);
    return response.data;
  },
};

export const tableService = {
  getTables: async (params = {}) => {
    const response = await api.get('/api/v1/tables', { params });
    return response.data;
  },
  
  updateTable: async (tableId, tableData) => {
    const response = await api.patch(`/api/v1/tables/${tableId}`, tableData);
    return response.data;
  },

  createTable: async (tableData) => {
    const response = await api.post('/api/v1/tables', tableData);
    return response.data;
  },

  deleteTable: async (tableId) => {
    const response = await api.delete(`/api/v1/tables/${tableId}`);
    return response.data;
  },
};

export const menuService = {
  getItems: async (params = {}) => {
    const response = await api.get('/api/v1/menu/items', { params });
    return response.data;
  },

  getCategories: async (params = {}) => {
    const response = await api.get('/api/v1/menu/categories', { params });
    return response.data;
  },

  createItem: async (itemData) => {
    const response = await api.post('/api/v1/menu/items', itemData);
    return response.data;
  },

  updateItem: async (itemId, itemData) => {
    const response = await api.patch(`/api/v1/menu/items/${itemId}`, itemData);
    return response.data;
  },

  generateImage: async (itemId) => {
    const response = await api.post(`/api/v1/menu/items/${itemId}/generate-image`);
    return response.data;
  },

  deleteItem: async (itemId) => {
    const response = await api.delete(`/api/v1/menu/items/${itemId}`);
    return response.data;
  },
};

export const orderService = {
  getLiveOrders: async (params = {}) => {
    const response = await api.get('/api/v1/orders/live', { params });
    return response.data;
  },

  getAllOrders: async (params = {}) => {
    const response = await api.get('/api/v1/orders', { params });
    return response.data;
  },

  updateOrderStatus: async (orderId, status) => {
    const response = await api.patch(`/api/v1/orders/${orderId}/status`, { status });
    return response.data;
  },
};

export const inventoryService = {
  getInventory: async (params = {}) => {
    const response = await api.get('/api/v1/inventory', { params });
    return response.data;
  },

  updateInventory: async (inventoryId, data) => {
    const response = await api.patch(`/api/v1/inventory/${inventoryId}`, data);
    return response.data;
  },

  createItem: async (itemData) => {
    const response = await api.post('/api/v1/inventory', itemData);
    return response.data;
  },

  scanInventory: async (formData) => {
    const response = await api.post('/api/v1/inventory/scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  bulkUpdateInventory: async (items) => {
    const response = await api.post('/api/v1/inventory/bulk', items);
    return response.data;
  },

  deleteItem: async (inventoryId) => {
    const response = await api.delete(`/api/v1/inventory/${inventoryId}`);
    return response.data;
  },
};

export const managerService = {
  getManagers: async () => {
    const response = await api.get('/api/v1/managers');
    return response.data;
  },

  updateManager: async (managerId, updateData) => {
    const response = await api.patch(`/api/v1/managers/${managerId}`, updateData);
    return response.data;
  },

  deleteManager: async (managerId) => {
    const response = await api.delete(`/api/v1/managers/${managerId}`);
    return response.data;
  },
};

export const reportsService = {
  getReports: async (params = {}) => {
    const response = await api.get('/api/v1/reports', { params });
    return response.data;
  },
};

export default api;

