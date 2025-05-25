#!/bin/bash

echo "🏀 CourtIQ Backend Setup"
echo "======================="

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Create virtual environment if it doesn't exist
if [ ! -d "venv310" ]; then
    echo "🔄 Creating virtual environment..."
    python3 -m venv venv310
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create virtual environment"
        exit 1
    fi
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate the virtual environment
echo "🔄 Activating virtual environment..."
source venv310/bin/activate

# Install dependencies
echo "🔄 Installing dependencies..."
pip install --upgrade pip

# Install dependencies one by one to better handle errors
echo "🔄 Installing Flask and core dependencies..."
pip install Flask==3.1.0 Flask-Cors==5.0.1 python-dotenv==1.0.1

echo "🔄 Installing database dependencies..."
pip install pymongo==4.6.1 redis==5.0.0 

echo "🔄 Installing Celery..."
pip install celery==5.4.0

echo "🔄 Installing computer vision dependencies..."
pip install numpy==1.26.4 opencv-python==4.11.0.86 mediapipe==0.10.5

echo "🔄 Installing testing and utility dependencies..."
pip install pytest==8.0.2 pytest-flask==1.3.0 gunicorn==22.0.0 pytz==2024.1

# Check for MongoDB database server
echo "🔍 Checking if MongoDB is installed..."
if ! command -v mongod &> /dev/null; then
    echo "⚠️ MongoDB not found in system PATH. Let's check if it's running anyway..."
else
    echo "✅ MongoDB found in system PATH"
fi

# Check if MongoDB is running
echo "🔍 Checking if MongoDB server is running..."
if pgrep -x "mongod" > /dev/null; then
    echo "✅ MongoDB server is running"
else
    echo "⚠️ MongoDB server doesn't seem to be running"
    
    # Try to start MongoDB if using brew
    if command -v brew &> /dev/null && brew list | grep -q mongodb-community; then
        echo "🔄 Attempting to start MongoDB using Homebrew..."
        brew services start mongodb-community
        sleep 3  # Wait for MongoDB to start
        
        if pgrep -x "mongod" > /dev/null; then
            echo "✅ MongoDB server started successfully"
        else
            echo "❌ Failed to start MongoDB"
            echo "Please start MongoDB manually with: brew services start mongodb-community"
            echo "Then run this script again"
        fi
    else
        echo "ℹ️ To install MongoDB with Homebrew:"
        echo "   brew tap mongodb/brew"
        echo "   brew install mongodb-community"
        echo "   brew services start mongodb-community"
    fi
fi

# Check MongoDB connection using our test script
echo "🔍 Testing MongoDB connection..."
python test_database.py
connection_status=$?

if [ $connection_status -ne 0 ]; then
    echo "⚠️ Database connection test failed. Please check if MongoDB is running."
    echo "   You can try: brew services start mongodb-community"
else
    echo "✅ Database connection successful!"
fi

echo "======================="
echo "✅ Setup complete!"
echo "To start the backend server, run:"
echo "./start.sh"
