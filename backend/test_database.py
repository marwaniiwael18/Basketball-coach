#!/usr/bin/env python3
"""
MongoDB connection test script for CourtIQ.
This script verifies the connection to MongoDB and initializes the courtiq database.
"""

import sys
sys.path.append('.')  # Add current directory to path

from database import Database
from config import Config
import time

def main():
    """Test MongoDB connection and initialize database"""
    print("🔍 Testing MongoDB connection...")
    
    # Check if MongoDB is available
    if not Database.is_connected():
        print("❌ Failed to connect to MongoDB at:", Config.MONGO_URI)
        print("\nPossible issues:")
        print(" - MongoDB may not be running")
        print(" - Connection URI might be incorrect")
        print(" - Network or firewall issues")
        print("\nTry these solutions:")
        print(" - Start MongoDB using: brew services start mongodb-community")
        print(" - Check MongoDB Compass to verify it's running")
        print(" - Verify MONGO_URI in .env file or config.py")
        return 1
    
    print("✅ Successfully connected to MongoDB!")
    
    # Initialize database
    print("\n🏗️  Initializing database structure...")
    if Database.init_db():
        print(f"✅ Database '{Config.MONGO_DB_NAME}' initialized!")
    else:
        print("❌ Failed to initialize database")
        return 1
    
    # Test inserting and retrieving data
    print("\n🧪 Testing data operations...")
    
    # Insert test record
    test_id = Database.save_analysis_result(
        video_name="test_video.mp4", 
        total_frames=100, 
        frames_with_pose=80,
        jumping_frames=10,
        shooting_frames=15,
        dribbling_frames=20,
        duration=10.5
    )
    
    if test_id:
        print(f"✅ Test record inserted with ID: {test_id}")
        
        # Retrieve the record
        result = Database.get_analysis_result(test_id)
        if result:
            print("✅ Successfully retrieved test record")
            
            # Delete the test record
            if Database.delete_analysis_result(test_id):
                print("✅ Successfully deleted test record")
            else:
                print("❌ Failed to delete test record")
                
        else:
            print("❌ Failed to retrieve test record")
            return 1
    else:
        print("❌ Failed to insert test record")
        return 1
    
    print("\n🎉 All database tests passed! MongoDB is properly configured for CourtIQ.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
