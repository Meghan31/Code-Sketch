# CodeSketch

Real-time collaborative code editor with Google OAuth authentication built with React, Node.js, and Supabase.

## ✨ Features

- � **Google OAuth Authentication** - Secure login with Google accounts via Supabase
- �🚀 **Real-time Code Synchronization** - See changes instantly across all users
- 👥 **Multi-user Collaboration** - Work together in the same room
- 💻 **Multiple Language Support** - C, C++, Java, JavaScript, and Python
- ▶️ **Code Execution** - Run code with stdin support
- 🎨 **Monaco Editor** - VSCode-quality editing experience
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔒 **Authenticated Socket Connections** - Secure WebSocket connections
- 👤 **User Profiles** - Automatic profile creation with avatar and email
- 🏠 **Room Tracking** - Track who created rooms and who joined

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- Supabase account with Google OAuth configured
- Supabase service role key

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Meghan31/Code-Sketch.git
cd Code-Sketch
```

2. **Install dependencies**

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. **Setup Supabase Database**
   - Go to your Supabase SQL Editor
   - Run the SQL script in `supabase-setup.sql`

4. **Configure Environment Variables**

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=https://dhxiixxxxxxxxyoljnpi.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_SOCKET_URL=http://localhost:3000
```

Create `backend/.env`:

```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

SUPABASE_URL=https://dhxiixxxxxxxxyoljnpi.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

5. **Configure Redirect URLs in Supabase**
   - Go to Authentication → URL Configuration
   - Add: `http://localhost:5173/` and `http://localhost:5173/editor/*`

6. **Start the application**

```bash
# Terminal 1 - Start backend
cd backend
npm run dev

# Terminal 2 - Start frontend
cd frontend
npm run dev
```

7. **Open your browser**
   - Navigate to `http://localhost:5173`
   - Sign in with Google
   - Start coding!

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute setup guide
- **[AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md)** - Detailed authentication setup
- **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** - Step-by-step checklist
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Technical implementation details
- **[ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)** - System architecture diagrams

## 🏗️ Project Structure

```
Code-Sketch/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── api/                # API client and constants
│   │   ├── components/         # React components
│   │   │   ├── client-circle/  # User avatar component
│   │   │   ├── editor/         # Code editor component
│   │   │   ├── output/         # Output panel component
│   │   │   └── ProtectedRoute.jsx # Route protection
│   │   ├── config/
│   │   │   └── supabase.js     # Supabase client config
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Authentication context
│   │   ├── pages/
│   │   │   ├── home/           # Landing page
│   │   │   ├── code-editor/    # Editor page
│   │   │   └── login/          # Login page
│   │   ├── socket/             # Socket.IO configuration
│   │   ├── App.jsx             # Root component
│   │   └── main.jsx            # Entry point
│   ├── .env.example            # Environment variables template
│   └── package.json
│
├── backend/                     # Node.js backend server
│   ├── config/
│   │   └── supabase.js         # Supabase server client
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication middleware
│   │   ├── errorHandler.js     # Error handling
│   │   └── validation.js       # Request validation
│   ├── utils/
│   │   ├── logger.js           # Winston logger
│   │   └── roomManager.js      # Room state management
│   ├── index.js                # Server entry point
│   ├── .env.example            # Environment variables template
│   └── package.json
│
├── supabase-setup.sql          # Database setup script
├── setup-check.sh              # Environment verification script
└── Documentation files...
```

## Technologies

### Frontend

- React 18.3
- Vite 6.0
- Monaco Editor
- Socket.IO Client
- React Router DOM
- Supabase JS Client
- Axios
- React Hot Toast
- SASS

### Backend

- Node.js with Express
- Socket.IO Server
- Supabase (Authentication & Database)
- Winston (Logging)
- Rate Limiter
- Joi (Validation)

### Infrastructure

- Supabase PostgreSQL Database
- Google OAuth 2.0
- JWT Authentication
- Row Level Security (RLS)

## 🔒 Security Features

- ✅ JWT token validation on all Socket.io connections
- ✅ Google OAuth authentication via Supabase
- ✅ Row Level Security (RLS) on database tables
- ✅ Service role key secured on backend only
- ✅ CORS protection
- ✅ Rate limiting on socket events
- ✅ Protected routes requiring authentication
- ✅ Secure session management (12-hour expiry)

## 🎯 User Flow

1. User visits Home or Editor page without authentication
2. Automatically redirected to Login page
3. Clicks "Sign in with Google"
4. Completes Google OAuth flow
5. Redirected back to Home page
6. User profile automatically created in database
7. Can create/join rooms with authenticated identity
8. Socket connections authenticated with JWT
9. Real-time collaboration with tracked users
10. Session persists for 12 hours or until logout

## 🐛 Troubleshooting

### Authentication Issues

- Clear browser storage and try logging in again
- Verify environment variables are set correctly
- Check Supabase redirect URLs are configured
- Ensure Google OAuth is enabled in Supabase

### Connection Issues

- Verify backend is running on port 3000
- Check frontend is running on port 5173
- Ensure CORS origins are configured correctly
- Check browser console for detailed errors

### Database Issues

- Verify `supabase-setup.sql` was executed
- Check that RLS policies are enabled
- Ensure user_profiles table exists

For more help, see the documentation files listed above.

## 📝 Development Notes

- Backend runs on port 3000
- Frontend runs on port 5173
- JWT tokens expire after 12 hours
- Sessions auto-refresh before expiry
- Room state stored in memory (not persisted)
- User profiles persisted in Supabase database

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT

## 👨‍💻 Developer

Developed by [Meghan31](https://www.meghan31.me)

---

## 🆘 Need Help?

1. Check the [QUICKSTART.md](./QUICKSTART.md) for quick setup
2. Review [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) for step-by-step guide
3. See [AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md) for detailed docs
4. Run `./setup-check.sh` to verify your configuration
