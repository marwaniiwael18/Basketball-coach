#!/bin/bash

echo "🏀 CourtIQ Restart Script"
echo "=========================="

# Find and kill any Python processes running on port 5000
echo "Checking for processes using port 5000..."
PORT_5000_PID=$(lsof -i:5000 -t)
if [ ! -z "$PORT_5000_PID" ]; then
    echo "Killing process using port 5000 (PID: $PORT_5000_PID)"
    kill -9 $PORT_5000_PID
else
    echo "✅ No process found using port 5000"
fi

# Find and kill any Python processes running on port 5001 (if any)
echo "Checking for processes using port 5001..."
PORT_5001_PID=$(lsof -i:5001 -t)
if [ ! -z "$PORT_5001_PID" ]; then
    echo "Killing process using port 5001 (PID: $PORT_5001_PID)"
    kill -9 $PORT_5001_PID
else
    echo "✅ No process found using port 5001"
fi

# Start the full application using run.sh
echo "Starting CourtIQ application..."
./run.sh

echo "=========================="
echo "✅ Restart completed"
