#!/bin/bash

echo "🏀 CourtIQ Frontend Restart Script"
echo "=================================="

# Find and kill any React development server processes (usually on port 3000)
echo "Checking for React development server processes..."
REACT_PIDS=$(lsof -i:3000 -t)
if [ ! -z "$REACT_PIDS" ]; then
    echo "Killing React development server processes (PIDs: $REACT_PIDS)"
    kill -9 $REACT_PIDS
else
    echo "✅ No React development server processes found"
fi

# Rebuild node modules if needed
cd frontend
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/react-scripts" ]; then
    echo "Installing or updating frontend dependencies..."
    npm install
fi

# Start the React development server
echo "Starting React development server..."
npm start &
FRONTEND_PID=$!

echo "=================================="
echo "✅ Frontend restart completed"
echo "React server running on http://localhost:3000"
echo "Backend should be running on http://localhost:5001"
