#!/bin/bash

# CourtIQ Development Startup Script

# Check if we're running on macOS
if [[ "$(uname)" != "Darwin" ]]; then
  echo "⚠️ This script is optimized for macOS. Some commands might not work on other platforms."
fi

# Display welcome message
echo "🏀 Starting CourtIQ Development Environment"
echo "==========================================="

# Check if MongoDB is installed and running
echo "Checking MongoDB..."
if ! command -v mongod &> /dev/null; then
    echo "❌ MongoDB not found. Please install MongoDB:"
    echo "   brew install mongodb-community"
    echo "   brew services start mongodb-community"
    exit 1
else
    # Check if MongoDB service is running
    if ! pgrep -x "mongod" > /dev/null; then
        echo "🚀 Starting MongoDB..."
        brew services start mongodb-community
        
        # Wait for MongoDB to fully start
        echo "Waiting for MongoDB to start..."
        sleep 3
    else
        echo "✅ MongoDB is already running"
    fi
fi

# Check if Redis is installed and running
echo "Checking Redis..."
if ! command -v redis-server &> /dev/null; then
    echo "❌ Redis not found. Please install Redis:"
    echo "   brew install redis"
    echo "   brew services start redis"
    exit 1
else
    # Check if Redis service is running
    if ! pgrep -x "redis-server" > /dev/null; then
        echo "🚀 Starting Redis..."
        brew services start redis
        
        # Wait for Redis to fully start
        echo "Waiting for Redis to start..."
        sleep 2
    else
        echo "✅ Redis is already running"
    fi
fi

# Ensure backend dependencies are installed
echo "Checking backend dependencies..."
cd backend
if [ ! -d "venv310/bin" ]; then
    echo "⚠️ Backend virtual environment not set up. Running setup script..."
    chmod +x setup.sh
    ./setup.sh
fi

# Start the backend server and celery worker
echo "Starting backend server and worker..."
chmod +x start.sh
./start.sh &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Ensure frontend dependencies are installed
echo "Checking frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "⚠️ Frontend dependencies not installed. Installing now..."
    npm install
fi

# Start the frontend development server
echo "Starting frontend development server..."
npm start &
FRONTEND_PID=$!
cd ..

# Function to kill all processes when script is interrupted
cleanup() {
    echo "Shutting down services..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    echo "Services stopped."
    exit 0
}

# Register cleanup function for when script is interrupted
trap cleanup INT

echo "==========================================="
echo "🚀 CourtIQ is running!"
echo "📊 Frontend: http://localhost:3000"
echo "🔌 Backend API: http://localhost:5000"
echo "🔍 Health check: http://localhost:5000/health"
echo "Press Ctrl+C to stop all services"

# Wait for processes to finish
wait
