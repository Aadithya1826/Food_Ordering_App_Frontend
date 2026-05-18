# Frontend Setup & Quick Start Guide

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The app will open at `http://localhost:3000`

### 3. Test the Application

**Login Credentials:**
Use any user credentials registered in your backend database.

**Demo Flow:**
1. Enter email and password on login page
2. After successful login, you'll be redirected to role selection
3. Choose "Super Admin" or "Hotel Manager" role
4. View the respective dashboard

---

## What's Included

### ✅ Complete React Frontend with:
- User authentication system
- Role-based dashboard selection
- JWT token management
- Protected routes
- Modern dark theme UI
- Fully responsive design
- Backend API integration

### ✅ Pages Implemented:
- **Login Page**: Email/password authentication
- **Role Selection**: Choose between Super Admin & Hotel Manager
- **Admin Dashboard**: Super Admin interface
- **Hotel Manager Dashboard**: Manager interface

### ✅ Features:
- Automatic session persistence
- Logout functionality
- Error handling
- Loading states
- Form validation

---

## Backend Connection

The frontend expects the backend to be running at:
```
http://localhost:8000
```

Make sure your backend has CORS enabled. Update `backend/app/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## File Structure

```
frontend/
├── src/
│   ├── components/          # ProtectedRoute component
│   ├── context/             # AuthContext for state
│   ├── pages/               # All page components
│   ├── services/            # API service layer
│   ├── styles/              # Global CSS
│   ├── App.jsx              # Main app with routing
│   └── main.jsx             # Entry point
├── index.html               # HTML template
├── package.json             # Dependencies
├── vite.config.js           # Vite config
└── .env                     # Environment variables
```

---

## Available Scripts

```bash
npm run dev       # Start development server (http://localhost:3000)
npm run build     # Build for production
npm run preview   # Preview production build
```

---

## Environment Variables

### Development (.env)
```
VITE_API_URL=http://localhost:8000
```

### Production (.env.production)
```
VITE_API_URL=https://api.dataudipi.com
```

---

## Next Steps

After the frontend is running:

1. **Test Login**: 
   - Use your backend database credentials
   - Verify token is stored in browser localStorage

2. **Extend Dashboards**:
   - Modify AdminDashboard.jsx and HotelManagerDashboard.jsx
   - Add components as needed
   - Make API calls to retrieve data

3. **Add More Routes**:
   - Create new pages in src/pages/
   - Add routes to App.jsx
   - Protect with ProtectedRoute if needed

4. **Customize Styling**:
   - Edit src/styles/global.css
   - Change colors, fonts, spacing
   - Adjust theme through CSS variables

---

## Troubleshooting

### Port 3000 Already in Use
```bash
npm run dev -- --port 3001
```

### Backend Connection Failed
- Check backend is running: `http://localhost:8000`
- Check .env VITE_API_URL is correct
- Check browser console for CORS errors
- Add CORS middleware to backend

### Login Not Working
- Verify credentials in backend database
- Check backend /api/v1/auth/login endpoint
- Look for errors in browser Network tab
- Check backend console for errors

### Token Not Persisting
- Check localStorage is enabled in browser
- Check browser console for storage errors
- Verify JWT token is returned from backend

---

## Production Deployment

### Build Production Version
```bash
npm run build
```

### Deploy to Vercel
```bash
vercel deploy
```

### Deploy to Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

Update `.env.production` with your production API URL before deploying.

---

## Support & Help

- Check README.md for detailed documentation
- Review component files for implementation details
- Check browser console for errors
- Verify backend is running and accessible

Happy coding! 🎉
