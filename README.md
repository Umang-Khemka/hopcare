# Shedula - Doctor Appointment Scheduling Platform
 
A modern, responsive doctor appointment scheduling application built with Next.js 15, React 19, and TypeScript. This project implements a complete authentication flow, doctor listing, search functionality, and more.
 
## 📋 Table of Contents
 
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Implementation Details](#implementation-details)
- [Components Overview](#components-overview)
- [API Routes](#api-routes)
- [Authentication Flow](#authentication-flow)
- [Future Enhancements](#future-enhancements)
 
## ✨ Features
 
### Implemented Features
 
- ✅ **User Authentication**
  - Login with Email/Mobile
  - OTP-based verification (4-digit code)
  - Google Sign-In UI (front-end only)
  - Remember Me functionality
  - Protected routes for authenticated users
 
- ✅ **Doctor Management**
  - Browse list of available doctors
  - Search doctors by name or specialization
  - View doctor details (experience, working hours, location)
  - Favorite/Unfavorite doctors
  - Real-time favorite status updates
 
- ✅ **User Dashboard**
  - Personalized greeting with user name
  - Location display
  - Notification badge
  - Bottom navigation bar (Find Doctor, Appointments, Records, Profile)
 
- ✅ **Responsive UI Components**
  - Custom Button component
  - Custom Input component
  - Custom Checkbox component
  - Custom Divider component
  - Doctor Card component
  - Google Sign-In button
 
## 🛠 Tech Stack
 
- **Framework:** Next.js 15.4.3 (App Router)
- **Language:** TypeScript 5
- **UI Library:** React 19.1.0
- **Styling:** CSS Modules
- **Linting:** ESLint 9
- **Package Manager:** npm
 
## 📁 Project Structure
 
```
Team-Name/
├── public/                    # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── google-icon.svg
│   └── ...
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API Routes
│   │   │   └── doctors/      # Doctor-related endpoints
│   │   │       └── route.ts  # GET & PATCH for doctors
│   │   ├── login/            # Login page
│   │   │   ├── page.tsx      # Login & OTP verification UI
│   │   │   └── login.module.css
│   │   ├── layout.tsx        # Root layout with AuthProvider
│   │   ├── page.tsx          # Home page (protected)
│   │   ├── globals.css       # Global styles
│   │   └── favicon.ico
│   │
│   ├── components/           # Reusable UI Components
│   │   ├── Button/          # Primary button component
│   │   ├── Checkbox/        # Custom checkbox
│   │   ├── Divider/         # Divider with text
│   │   ├── DoctorCard/      # Doctor information card
│   │   ├── GoogleButton/    # Google sign-in button
│   │   ├── HomePage/        # Main home page component
│   │   ├── Input/           # Form input component
│   │   └── ProtectedRoute/  # Route protection wrapper
│   │
│   ├── contexts/            # React Context Providers
│   │   └── AuthContext.tsx  # Authentication state management
│   │
│   ├── styles/              # Additional global styles
│   │   ├── globals.css
│   │   └── variables.css
│   │
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   │
│   └── utils/               # Utility functions
│       └── validators.ts    # Email & mobile validators
│
├── eslint.config.mjs        # ESLint configuration
├── next.config.ts           # Next.js configuration
├── tsconfig.json            # TypeScript configuration
├── postcss.config.mjs       # PostCSS configuration
├── package.json             # Dependencies and scripts
└── README.md               # This file
```
 
## 🚀 Getting Started
 
### Prerequisites
 
- Node.js 20.x or higher
- npm or yarn package manager
 
### Installation
 
1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Team-Name
   ```
 
2. **Install dependencies**
   ```bash
   npm install
   ```
 
3. **Run the development server**
   ```bash
   npm run dev
   ```
 
4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)
 
### Available Scripts
 
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```
 
## 📝 Implementation Details
 
### Authentication Flow
 
1. **Login Page** (`/user/login`)
   - User enters email or mobile number
   - Clicks "Login" button
   - System generates OTP (simulated)
 
2. **OTP Verification**
   - User enters 4-digit OTP code
   - 55-second countdown timer with resend option
   - Upon verification, user data is saved to localStorage
   - User is redirected to home page
 
3. **Protected Routes**
   - Home page checks authentication status
   - Unauthenticated users are redirected to `/user/login`
   - User data persists across page refreshes
 
### State Management
 
- **AuthContext** (`src/contexts/AuthContext.tsx`)
  - Manages user authentication state
  - Provides `login()` and `logout()` methods
  - Stores user data in localStorage
  - Syncs state across browser tabs
 
### API Routes
 
#### GET `/api/doctors`
Returns a list of doctors with their details:
```typescript
{
  doctors: Doctor[],
  total: number
}
```
 
#### PATCH `/api/doctors`
Updates doctor favorite status:
```typescript
{
  doctorId: string,
  isFavorited: boolean
}
```
 
### Data Models
 
**User Interface:**
```typescript
{
  name: string;
  email?: string;
  mobile?: string;
  location: string;
}
```
 
**Doctor Interface:**
```typescript
{
  id: string;
  name: string;
  specialization: string;
  availability_status: string;
  experience: string;
  working_hours: string;
  profile_picture_url: string;
  is_favorited: boolean;
  status_icon?: string;
  location: string;
}
```
 
## 🧩 Components Overview
 
### Core Components
 
1. **Button** (`src/components/Button/`)
   - Customizable primary button
   - Supports disabled state
   - Type-safe props with TypeScript
 
2. **Input** (`src/components/Input/`)
   - Form input with consistent styling
   - Supports various input types
   - Built-in validation support
 
3. **Checkbox** (`src/components/Checkbox/`)
   - Custom checkbox component
   - Label support
   - Accessible and type-safe
 
4. **DoctorCard** (`src/components/DoctorCard/`)
   - Displays doctor information
   - Favorite toggle functionality
   - Profile picture display
   - Shows availability status
 
5. **ProtectedRoute** (`src/components/ProtectedRoute/`)
   - Wraps protected content
   - Redirects unauthenticated users
   - Checks localStorage for auth status
 
6. **HomePage** (`src/components/HomePage/`)
   - Main dashboard after login
   - Doctor search functionality
   - User greeting and location
   - Notification bell with badge
   - Bottom navigation
 
### Utility Components
 
- **Divider:** Text divider for separating sections
- **GoogleButton:** Google OAuth sign-in button UI
 
## 🔐 Authentication Flow
 
```
User Flow:
1. Visit site → Redirect to /login (if not authenticated)
2. Enter email/mobile → Click "Login"
3. Enter OTP → Click "Verify"
4. Redirect to home page → View doctors
5. Search/Filter doctors → Mark favorites
```
 
**Storage:**
- Authentication state: `localStorage`
- User data: `localStorage.user`
- Auth flag: `localStorage.isAuthenticated`
 
## 🔮 Future Enhancements
 
### Recommended Next Steps
 
1. **Backend Integration**
   - For Backend use only mockAPI data
   - Implement actual OTP generation and verification
   - Secure API endpoints with authentication
 
2. **Google OAuth**
   - Implement Google OAuth flow
   - Add OAuth callback handling
   - Integrate with backend authentication
 
3. **Doctor Appointments**
   - Create appointment booking flow
   - Add calendar/date picker
   - Implement time slot selection
   - Send appointment confirmations
 
4. **Profile Management**
   - User profile page
   - Edit user information
   - Upload profile picture
   - View appointment history
 
5. **Medical Records**
   - Upload and view medical records
   - Prescription management
   - Lab report storage
 
6. **Enhanced Search**
   - Advanced filters (location, specialization, availability)
   - Sort by rating, experience, distance
   - Doctor ratings and reviews
 
7. **Notifications**
   - Real notification system
   - Appointment reminders
   - Push notifications
 
8. **Responsive Design**
   - Mobile-first optimization
   - Tablet layouts
   - Progressive Web App (PWA) support
 
## 📄 License
 
This project is part of Team development work.
 
## 👥 Contributing
 
1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add some amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request
 
 
---
 
**Happy Coding! 🚀**
