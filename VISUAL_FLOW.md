# 🎯 Exact Flow - Visual Guide

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                         START APP                                   │
│                    http://localhost:3000                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────────┐
│              📱 SCREEN 1: ROLE SELECTION PAGE                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                      🍃 D DATA UDIPI 🍃                             │
│                 RESTAURANT MANAGEMENT SYSTEM                        │
│                                                                     │
│                   Choose Your Role                                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  [SA] Super Admin                                       →    │  │
│  │       Manage hotels, venues & managers                      │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  [HM] Hotel Manager                                    →    │  │
│  │       Manage daily restaurant operations                    │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│             🧑‍🍳  [Deliciously Vegetarian]  👍                      │
│                                                                     │
└────────────────────────┬───────────────────────────────────────────┘
                         │
              User Selects Role (e.g., Super Admin)
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────────┐
│            📱 SCREEN 2: LOGIN/SIGNUP PAGE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                      🍃 D DATA UDIPI 🍃                             │
│                 RESTAURANT MANAGEMENT SYSTEM                        │
│                                                                     │
│             ┌────────────────────────────────────────────┐          │
│             │ 👤 Super Admin Account                    │          │
│             └────────────────────────────────────────────┘          │
│                                                                     │
│  ┌───────────────────────┬──────────────────────┐                 │
│  │  ✓ Sign In           │  Sign Up             │                 │
│  └───────────────────────┴──────────────────────┘                 │
│                                                                     │
│  Email Address                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Enter your email                               [user icon]  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Password                                                         │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Enter your password                    [eye] [eye-off icon] │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │             ✏️  SIGN IN                                       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │           ← BACK TO ROLE SELECTION                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
└────────────────────────┬───────────────────────────────────────────┘
                         │
                  User Enters Credentials
                  User Clicks "Sign In"
                         │
                         ↓
                  Verify with Backend:
                  POST /api/v1/auth/login
                         │
                 ┌───────┴────────┐
                 ↓                ↓
            ✅ SUCCESS         ❌ FAILURE
                 │                │
                 │        Show Error Message
                 │        User can retry
                 │
                 ↓
    ┌─────────────────────────────────────────────┐
    │ Determine User Role from JWT Token         │
    └────────────┬────────────────────────────────┘
                 │
        ┌────────┴──────────┐
        │                   │
        ↓                   ↓
   Super Admin        Hotel Manager
        │                   │
        ↓                   ↓
┌──────────────────┐  ┌──────────────────────┐
│ ADMIN DASHBOARD  │  │ MANAGER DASHBOARD    │
└──────────────────┘  └──────────────────────┘
```

---

## 📱 Admin Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌──────────┐ ┌──────────────────────────────────────────────────┐ │
│  │ ═══════ │ │ ☰ Super Admin Dashboard                  ✓ All OK │ │
│  │  D      │ │    Platform-wide overview and management          │ │
│  │ DATA    │ │                                                   │ │
│  │ UDIPI   │ └──────────┬───────────────────────────────────────┘ │
│  │         │            │                                        │
│  │ ───── │ │  STATS CARDS (4 columns):                           │
│  │ 🏠 Dash │ │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ 🏨 Hotel│ │  │24 Hotels │ │38 Manager│ │₹Revenue  │ │31 Venues ││
│  │ 👥 Mgr  │ │  │ +3 month │ │ +5 month │ │ +18%     │ │ +96% up  ││
│  │ 📊 Report│ │  └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│  │ ⚙️ Settings│ │                                                   │
│  │         │ │  TOP PERFORMING HOTELS TABLE:                    │
│  │ ───── │ │  ┌─────────────────────────────────────────────────┐ │
│  │ Powered │ │  │ # │ Hotel      │ City   │ Revenue│ Orders│ Grth│ │
│  │ by Data │ │  ├─────────────────────────────────────────────────┤ │
│  │ Logout  │ │  │ 1 │ Grand Udpi │ Mumbai │ ₹3.2M  │ 1245  │+18%│ │
│  │         │ │  │ 2 │ Sagar Deli │ Blore  │ ₹2.8M  │ 1102  │+14%│ │
│  │         │ │  │ 3 │ Coastal Ki │ Chennai│ ₹2.4M  │ 987   │+21%│ │
│  │         │ │  └─────────────────────────────────────────────────┘ │
│  │         │ │                                                   │
│  │         │ │  RECENT ACTIVITY:                               │
│  │         │ │  🏨 New hotel added • Heritage Kitchen • 2h ago   │
│  │         │ │  👤 Manager assigned • Rajesh K. • 4h ago         │
│  │         │ │  🏢 Venue activated • Coastal Kitchen • 6h ago    │
│  │         │ │                                                   │
│  │         │ │                                                   │
│  └─────────┘ └──────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

[Sidebar is Collapsible] ← | [Click to Hide]
```

---

## 📱 Manager Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌──────────┐ ┌──────────────────────────────────────────────────┐ │
│  │ ═══════ │ │ ☰ Good Morning! Anand Sharma        ✓ All OK      │ │
│  │  D      │ │    Here's what's happening at your restaurant    │ │
│  │ DATA    │ │                                                   │ │
│  │ UDIPI   │ └──────────┬───────────────────────────────────────┘ │
│  │         │            │                                        │
│  │ ───── │ │  STATS CARDS (4 columns):                           │
│  │ 🏠 Dash │ │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ 📋 Menu │ │  │142 Orders│ │₹24,580RT │ │7 Pending │ │12/20 Tbls││
│  │ 🛒 Orders│ │  │ +12%     │ │ +8%      │ │ -3       │ │ 60%      ││
│  │ 🪑 Tables│ │  └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│  │ 📦 Inv   │ │                                                   │
│  │ 📊 Report│ │  BEST SELLERS │ IMPORTANT ALERTS                 │
│  │ ⚙️ Setting│ │  ┌──────────────┬─────────────────────────────┐   │
│  │         │ │  │🥘 Masala Dosa│ ⚠️ Low Stock Alert         │   │
│  │ ───── │ │  │  150 orders   │ • Rice Flour              │   │
│  │ Powered │ │  │               │ • Coconut Oil             │   │
│  │ by Data │ │  │☕ Filter Coff │ • Coffee Beans            │   │
│  │ Logout  │ │  │  134 orders   │                          │   │
│  │         │ │  │               │ [View All →]             │   │
│  │         │ │  │🍲 Idli Samber├─────────────────────────────┤   │
│  │         │ │  │  98 orders    │                          │   │
│  │         │ │  └──────────────┘                          │   │
│  │         │ │                                                   │
│  │         │ │  RECENT ORDERS (LIVE):                          │
│  │         │ │  ┌─────────────────────────────────────────────┐ │
│  │         │ │  │ #1042 : Masala Dosa x2, Coffee x2           │ │
│  │         │ │  │        Table T-05 • 2m ago • Preparing ₹340 │ │
│  │         │ │  │ #1041 : Idli Sambhar x3, Vada x1            │ │
│  │         │ │  │        Takeaway • 8m ago • Ready ₹280       │ │
│  │         │ │  │ #1040 : Thali x1, Buttermilk x1             │ │
│  │         │ │  │        Takeaway • 8m ago • Served ₹280      │ │
│  │         │ │  │ #1039 : Raya Dosa x1, Coffee x1             │ │
│  │         │ │  │        Table T-02 • 15m ago • Completed ₹280│ │
│  │         │ │  └─────────────────────────────────────────────┘ │
│  │         │ │                                                   │
│  └─────────┘ └──────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

[Sidebar is Collapsible] ← | [Click to Hide]
```

---

## 🔄 Component Hierarchy

```
App
├── AuthProvider
│   └── Routes
│       ├── Route: "/" (Onboarding)
│       │   └── Onboarding
│       │       ├── Step 1: Role Selection
│       │       └── Step 2: Login/Signup
│       ├── Route: "/admin-dashboard" (Protected)
│       │   └── ProtectedRoute
│       │       └── AdminDashboard
│       │           ├── Sidebar (Collapsible)
│       │           ├── Header
│       │           └── Content
│       │               ├── Dashboard (Stats + Tables + Activity)
│       │               ├── Hotels
│       │               ├── Managers
│       │               ├── Reports
│       │               └── Settings
│       └── Route: "/manager-dashboard" (Protected)
│           └── ProtectedRoute
│               └── HotelManagerDashboard
│                   ├── Sidebar (Collapsible)
│                   ├── Header
│                   └── Content
│                       ├── Dashboard (Stats + Orders + Alerts)
│                       ├── Menu
│                       ├── Orders
│                       ├── Tables & QR
│                       ├── Inventory
│                       ├── Reports
│                       └── Settings
```

---

## 🔐 Authentication Flow

```
User Opens App
    ↓
Check localStorage for token
    ↓
    ├─ Token exists?
    │  ├─ YES: Redirect to last page
    │  └─ NO: Show Onboarding
    ↓
User Selects Role (Super Admin / Hotel Manager)
    ↓
Show Login/Signup Form
    ↓
User Enters Credentials
    ↓
POST /api/v1/auth/login or /api/v1/auth/signup
    ↓
    ├─ Success: 
    │  ├─ Save access_token to localStorage
    │  ├─ Save user data to localStorage
    │  └─ Redirect to role-specific dashboard
    │
    └─ Failure:
       └─ Show error message
          └─ User can retry or change role
```

---

## 🎭 Role-Based Routing

```
After Login:
    ↓
Check user.role
    ↓
    ├─ "super_admin"
    │  └─ Redirect to /admin-dashboard
    │
    └─ "hotel_manager" 
       └─ Redirect to /manager-dashboard
```

---

## 📊 Data Flow

```
User Input (Login Form)
    ↓
Axios API Call with JWT
    ↓
Backend Verification
    ↓
    ├─ Valid: Return JWT + User Data
    │  └─ Store in localStorage
    │  └─ Update Auth Context
    │  └─ Redirect to Dashboard
    │
    └─ Invalid: Return Error
       └─ Show error message
```

---

## ✨ Features by Component

### Onboarding.jsx
- ✅ Two-step flow (Role Selection → Login/Signup)
- ✅ Role selection with interactive cards
- ✅ Login form with email/password
- ✅ Signup form with name/email/password confirmation
- ✅ Tab switching between signin/signup
- ✅ Error handling
- ✅ Loading states
- ✅ Back button to change role

### AdminDashboard.jsx
- ✅ Collapsible sidebar
- ✅ Multiple pages (Dashboard, Hotels, Managers, Reports, Settings)
- ✅ Stats cards with icons
- ✅ Data table with sorting
- ✅ Activity feed
- ✅ Header with status indicator
- ✅ Logout functionality
- ✅ Responsive layout

### HotelManagerDashboard.jsx
- ✅ Collapsible sidebar
- ✅ Multiple pages (Dashboard, Menu, Orders, Tables, Inventory, Reports)
- ✅ Welcome greeting with name
- ✅ Real-time stats
- ✅ Best sellers section
- ✅ Alerts section
- ✅ Recent orders display
- ✅ Header with status indicator
- ✅ Logout functionality
- ✅ Responsive layout

---

## 🎯 Key Differences from Original

| Feature | Before | After |
|---------|--------|-------|
| First Screen | Login directly | Role Selection |
| Flow | Login → Role Selection → Dashboard | Role Selection → Login/Signup → Dashboard |
| Signup | Not available | Available (needs backend) |
| Dashboards | Basic placeholder | Full featured with sidebar |
| Navigation | None | Sidebar menu with collapsible state |
| Role info | Shown after login | Shown during login |
| Data Display | Minimal | Rich (stats, tables, activity) |

---

## ✅ Status: COMPLETE & READY

All components are implemented and working. Just run:

```bash
cd frontend
npm run dev
```

**Then visit http://localhost:3000 and follow the flow!** 🚀
