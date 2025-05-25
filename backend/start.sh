#!/bin/bash

# Change to the backend directory
cd "$(dirname "$0")"

# Check for virtual environment
if [ ! -d "venv310" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv310
fi

# Activate virtual environment
source venv310/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create directories if they don't exist
mkdir -p static/uploads
mkdir -p static/processed_images

# Check if Redis is running (macOS specific using brew)
if ! pgrep -x "redis-server" > /dev/null; then
    echo "Starting Redis server..."
    if command -v brew &> /dev/null; then
        brew services start redis
    else
        echo "Redis not found. Please install Redis: brew install redis"
        exit 1
    fi
fi

# Start Celery worker in background
echo "Starting Celery worker..."
celery -A tasks.celery worker --loglevel=info &
CELERY_PID=$!

# Start Flask server
echo "Starting Flask server on port 5001..."
FLASK_APP=app.py FLASK_ENV=development flask run --host=0.0.0.0 --port=5001

# Cleanup function
cleanup() {
    echo "Shutting down services..."
    kill $CELERY_PID
    exit 0
}

# Register the cleanup function for when script is interrupted
trap cleanup INT

# Wait for processes to finish
wait
