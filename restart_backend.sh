#!/bin/bash

echo "🏀 CourtIQ Backend Restart Script"
echo "=================================="

# Find and kill any Flask server processes on port 5000
echo "Checking for processes using port 5000..."
PORT_5000_PID=$(lsof -i:5000 -t)
if [ ! -z "$PORT_5000_PID" ]; then
    echo "Killing process using port 5000 (PID: $PORT_5000_PID)"
    kill -9 $PORT_5000_PID
else
    echo "✅ No process found using port 5000"
fi

# Find and kill any Flask server processes on port 5001
echo "Checking for processes using port 5001..."
PORT_5001_PID=$(lsof -i:5001 -t)
if [ ! -z "$PORT_5001_PID" ]; then
    echo "Killing process using port 5001 (PID: $PORT_5001_PID)"
    kill -9 $PORT_5001_PID
else
    echo "✅ No process found using port 5001"
fi

# Find and kill any Celery worker processes
echo "Checking for Celery worker processes..."
CELERY_PIDS=$(pgrep -f "celery -A tasks.celery worker")
if [ ! -z "$CELERY_PIDS" ]; then
    echo "Killing Celery worker processes (PIDs: $CELERY_PIDS)"
    kill -9 $CELERY_PIDS
else
    echo "✅ No Celery worker processes found"
fi

# Navigate to the backend directory
cd backend

# Activate the virtual environment
if [ -d "venv310" ]; then
    echo "Activating virtual environment..."
    source venv310/bin/activate
else
    echo "⚠️ Virtual environment not found, creating it..."
    python3 -m venv venv310
    source venv310/bin/activate
fi

# Install dependencies if needed
echo "Checking dependencies..."
pip install -r requirements.txt

# Create directories if they don't exist
mkdir -p static/uploads
mkdir -p static/processed_images

# Start Celery worker in background
echo "Starting Celery worker..."
celery -A tasks.celery worker --loglevel=info &
CELERY_PID=$!

# Start Flask server
echo "Starting Flask server on port 5001..."
FLASK_APP=app.py FLASK_DEBUG=1 flask run --host=0.0.0.0 --port=5001 &
FLASK_PID=$!

echo "Backend server started!"
echo "=================================="
echo "✅ Backend restart completed"
echo "Backend running on http://localhost:5001"
echo "Celery worker running in background"
