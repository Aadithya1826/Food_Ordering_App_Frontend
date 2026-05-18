# DATA UDIPI Frontend

A modern React-based frontend for the DATA UDIPI Restaurant Management System with user authentication and role-based dashboards.

## Features

- ✅ User Authentication (Email/Password Login)
- ✅ JWT Token Management
- ✅ Role-Based Dashboard Selection (Super Admin / Hotel Manager)
- ✅ Protected Routes with Auth Guards
- ✅ Modern Dark Theme UI
- ✅ Fully Connected to Backend API
- ✅ Responsive Design
- ✅ State Management with React Context

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable React components
│   │   └── ProtectedRoute.jsx
│   ├── context/             # React Context for state management
│   │   └── AuthContext.jsx
│   ├── pages/               # Page components
│   │   ├── Login.jsx
│   │   ├── RoleSelection.jsx
│   │   ├── AdminDashboard.jsx
│   │   └── HotelManagerDashboard.jsx
│   ├── services/            # API services
│   │   └── api.js
│   ├── styles/              # Global CSS
│   │   └── global.css
│   ├── App.jsx              # Main App component with routing
│   └── main.jsx             # React entry point
├── index.html               # HTML template
├── package.json             # Dependencies
├── vite.config.js           # Vite configuration
└── .env                     # Environment variables
```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on `http://localhost:8000`

## Installation

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Configuration

The frontend is configured to connect to the backend API at `http://localhost:8000` by default.

### Environment Variables

Edit `.env` file to change the API URL:

```bash
VITE_API_URL=http://localhost:8000
```

For production, use `.env.production`:

```bash
VITE_API_URL=https://api.dataudipi.com
```

## Running the Application

### Development Mode

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## API Integration

The frontend connects to the following backend endpoints:

### Authentication
- **POST** `/api/v1/auth/login` - User login
  - Request body: `{ email, password }`
  - Response: `{ access_token, token_type, user: { id, name, role, restaurant_id } }`

- **POST** `/api/v1/auth/logout` - User logout

## User Flows

### 1. Login Flow
1. User enters email and password on the login page
2. Frontend sends credentials to `/api/v1/auth/login`
3. Backend returns JWT token and user information
4. Token is stored in localStorage
5. User is redirected to role selection page

### 2. Role Selection Flow
1. After login, user sees role selection screen with two options:
   - **Super Admin**: Manage hotels, venues & managers
   - **Hotel Manager**: Manage daily restaurant operations
2. Selecting a role navigates to the respective dashboard

### 3. Dashboard Flow
1. Each role has a dedicated dashboard
2. Dashboards display user profile information
3. Logout button clears authentication and redirects to login

## Authentication

The application uses JWT (JSON Web Token) for authentication:

- **Token Storage**: Stored in browser localStorage
- **Token Transmission**: Sent as `Authorization: Bearer <token>` header
- **Token Persistence**: Survives page refreshes and maintains user sessions

## Components Overview

### Login Component
- Email and password form
- Error handling and validation
- Loading states with spinner animation
- Connected to backend authentication API

### RoleSelection Component
- Displays available user roles
- Interactive role selection cards
- Smooth transitions to dashboards
- Logout functionality

### Dashboard Components
- AdminDashboard: For Super Admin role
- HotelManagerDashboard: For Hotel Manager role
- Both display user information and role-specific data

### ProtectedRoute Component
- Guards routes that require authentication
- Redirects unauthenticated users to login
- Shows loading state while checking auth status

## Styling

The frontend uses a modern dark theme with:
- **Primary Color**: Orange (#ff8c42)
- **Secondary Color**: Green (#2d7a4a)
- **Dark Background**: #1a1a1a
- **Responsive Design**: Mobile-first approach

All styles are defined in `src/styles/global.css` using CSS variables for easy customization.

## Error Handling

The application handles various error scenarios:

- Invalid credentials
- Network errors
- API errors
- Session expiration
- Missing required fields

All errors are displayed in user-friendly error messages.

## Development

### Adding New Pages

1. Create a new component in `src/pages/`
2. Import it in `src/App.jsx`
3. Add a new route in the Routes section

### Adding Protected Routes

Wrap components with `ProtectedRoute`:

```jsx
<Route
  path="/new-page"
  element={
    <ProtectedRoute>
      <NewPage />
    </ProtectedRoute>
  }
/>
```

### Making API Calls

Use the `api` service from `src/services/api.js`:

```jsx
import api from '../services/api';

// GET request
const response = await api.get('/api/v1/endpoint');

// POST request
const response = await api.post('/api/v1/endpoint', { data });
```

## Troubleshooting

### Backend Connection Issues

If you see "Failed to connect to API":

1. Ensure backend is running on port 8000
2. Check VITE_API_URL in `.env`
3. Check browser console for CORS errors
4. Verify backend allows CORS from localhost:3000

### Login Issues

- Check that backend auth endpoint is working
- Verify credentials are correct
- Check JWT token is being stored in localStorage
- Look for errors in browser console

### Port Already in Use

If port 3000 is already in use:

```bash
npm run dev -- --port 3001
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Proprietary - DATA UDIPI Restaurant Management System

## Support

For issues or questions, contact the development team.
