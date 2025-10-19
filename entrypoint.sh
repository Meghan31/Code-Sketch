#!/bin/sh

# Create logs directories
mkdir -p backend/logs
mkdir -p frontend/logs

# Start the backend server in the background
cd backend
nohup npm run dev > logs/backend.log 2>&1 &
echo $! > backend.pid
cd ..

# Start the frontend server in the foreground
cd frontend
npm run dev