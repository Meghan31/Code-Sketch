#!/bin/bash

# CodeSketch Authentication Setup Script
# This script helps verify that all environment variables are configured

echo "🔍 CodeSketch Authentication Setup Checker"
echo "==========================================="
echo ""

# Check Frontend .env
echo "📱 Checking Frontend Configuration..."
if [ -f "frontend/.env" ]; then
    echo "✅ frontend/.env exists"
    
    if grep -q "VITE_SUPABASE_URL=" frontend/.env; then
        echo "✅ VITE_SUPABASE_URL is set"
    else
        echo "❌ VITE_SUPABASE_URL is missing"
    fi
    
    if grep -q "VITE_SUPABASE_ANON_KEY=" frontend/.env; then
        echo "✅ VITE_SUPABASE_ANON_KEY is set"
    else
        echo "❌ VITE_SUPABASE_ANON_KEY is missing"
    fi
    
    if grep -q "VITE_SOCKET_URL=" frontend/.env; then
        echo "✅ VITE_SOCKET_URL is set"
    else
        echo "❌ VITE_SOCKET_URL is missing"
    fi
else
    echo "❌ frontend/.env does not exist"
    echo "   Please create it from frontend/.env.example"
fi

echo ""

# Check Backend .env
echo "🖥️  Checking Backend Configuration..."
if [ -f "backend/.env" ]; then
    echo "✅ backend/.env exists"
    
    if grep -q "SUPABASE_URL=" backend/.env; then
        echo "✅ SUPABASE_URL is set"
    else
        echo "❌ SUPABASE_URL is missing"
    fi
    
    if grep -q "SUPABASE_SERVICE_KEY=" backend/.env; then
        echo "✅ SUPABASE_SERVICE_KEY is set"
    else
        echo "❌ SUPABASE_SERVICE_KEY is missing"
    fi
    
    if grep -q "PORT=" backend/.env; then
        echo "✅ PORT is set"
    else
        echo "❌ PORT is missing"
    fi
else
    echo "❌ backend/.env does not exist"
    echo "   Please create it from backend/.env.example"
fi

echo ""

# Check node_modules
echo "📦 Checking Dependencies..."
if [ -d "frontend/node_modules" ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Frontend dependencies not installed"
    echo "   Run: cd frontend && npm install"
fi

if [ -d "backend/node_modules" ]; then
    echo "✅ Backend dependencies installed"
else
    echo "❌ Backend dependencies not installed"
    echo "   Run: cd backend && npm install"
fi

echo ""
echo "==========================================="
echo "📋 Next Steps:"
echo "1. Create frontend/.env and backend/.env files (see .env.example)"
echo "2. Add your Supabase credentials"
echo "3. Run the SQL script in Supabase to create user_profiles table"
echo "4. Start backend: cd backend && npm run dev"
echo "5. Start frontend: cd frontend && npm run dev"
echo ""
echo "📖 For detailed setup instructions, see AUTHENTICATION_SETUP.md"
