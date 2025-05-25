from pymongo import MongoClient
import os
from datetime import datetime
from bson import ObjectId
from config import Config

# Connect to MongoDB
client = MongoClient(Config.MONGO_URI)
db = client.get_database(Config.MONGO_DB_NAME)

class Database:
    @staticmethod
    def init_db():
        """Initialize database collections if they don't exist"""
        try:
            # Check if MongoDB is available
            if not Database.is_connected():
                print("Warning: Could not connect to MongoDB")
                return False
                
            # Create indexes for better query performance
            db.analysis_results.create_index("created_at")
            db.analysis_results.create_index("video_name")
            db.analysis_results.create_index("user_id")  # Index for user_id
            
            # Create user collection indexes
            db.users.create_index("email", unique=True)
            
            print(f"Database '{Config.MONGO_DB_NAME}' initialized successfully")
            return True
        except Exception as e:
            print(f"Error initializing database: {str(e)}")
            return False
            
    @staticmethod
    def is_connected():
        """Check if MongoDB is available"""
        try:
            # The ismaster command is cheap and does not require auth
            client.admin.command('ismaster')
            return True
        except Exception as e:
            print(f"MongoDB connection failed: {str(e)}")
            return False

    @staticmethod
    def save_analysis_result(video_name, total_frames, frames_with_pose, 
                            jumping_frames=0, shooting_frames=0, dribbling_frames=0, 
                            duration=0, actions_file=""):
        """Save analysis result to database with enhanced action detection"""
        result = {
            'video_name': video_name,
            'total_frames': total_frames,
            'frames_with_pose': frames_with_pose,
            'detection_rate': frames_with_pose / total_frames if total_frames > 0 else 0,
            'jumping_frames': jumping_frames,
            'shooting_frames': shooting_frames,
            'dribbling_frames': dribbling_frames,
            'jumping_percentage': jumping_frames / frames_with_pose if frames_with_pose > 0 else 0,
            'shooting_percentage': shooting_frames / frames_with_pose if frames_with_pose > 0 else 0,
            'dribbling_percentage': dribbling_frames / frames_with_pose if frames_with_pose > 0 else 0,
            'duration': duration,
            'actions_file': actions_file,
            'created_at': datetime.utcnow()
        }
        
        return db.analysis_results.insert_one(result).inserted_id
    
    @staticmethod
    def get_analysis_result(result_id):
        """Get analysis result by ID"""
        if not ObjectId.is_valid(result_id):
            return None
        
        return db.analysis_results.find_one({'_id': ObjectId(result_id)})
    
    @staticmethod
    def list_analysis_results(limit=10):
        """List recent analysis results"""
        return list(db.analysis_results.find().sort('created_at', -1).limit(limit))
        
    @staticmethod
    def delete_analysis_result(result_id):
        """Delete analysis result by ID"""
        if not ObjectId.is_valid(result_id):
            return False
            
        return db.analysis_results.delete_one({'_id': ObjectId(result_id)}).deleted_count > 0
        
    @staticmethod
    def search_analysis_results(query):
        """Search analysis results by video name"""
        if not query:
            return []
            
        return list(db.analysis_results.find({
            'video_name': {'$regex': query, '$options': 'i'}
        }).sort('created_at', -1))
        
    @staticmethod
    def get_analysis_stats():
        """Get summary statistics of all analyses"""
        try:
            # Get total count of analyses
            total_count = db.analysis_results.count_documents({})
            
            if total_count == 0:
                return {
                    "total_analyses": 0,
                    "total_frames_analyzed": 0,
                    "avg_pose_detection_rate": 0,
                    "avg_duration": 0
                }
            
            # Calculate aggregate statistics
            pipeline = [
                {
                    "$group": {
                        "_id": None,
                        "total_frames": {"$sum": "$total_frames"},
                        "total_pose_frames": {"$sum": "$frames_with_pose"},
                        "total_jumping_frames": {"$sum": "$jumping_frames"},
                        "total_shooting_frames": {"$sum": "$shooting_frames"},
                        "total_dribbling_frames": {"$sum": "$dribbling_frames"},
                        "avg_detection_rate": {"$avg": "$detection_rate"},
                        "avg_duration": {"$avg": "$duration"}
                    }
                }
            ]
            
            stats = list(db.analysis_results.aggregate(pipeline))
            
            if not stats:
                return {
                    "total_analyses": total_count,
                    "total_frames_analyzed": 0,
                    "avg_pose_detection_rate": 0,
                    "avg_duration": 0
                }
                
            result = stats[0]
            
            # Remove the _id field
            if "_id" in result:
                del result["_id"]
                
            # Add total analyses count
            result["total_analyses"] = total_count
            
            # Round floating point values
            for key in result:
                if isinstance(result[key], float):
                    result[key] = round(result[key], 2)
            
            return result
            
        except Exception as e:
            print(f"Error getting analysis stats: {str(e)}")
            return {
                "error": str(e)
            }
