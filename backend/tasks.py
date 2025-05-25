from celery import Celery
import os
import cv2
import mediapipe as mp
import tempfile
import json
import numpy as np
from database import Database
import uuid
import shutil
from config import Config
from pose_analyzer import PoseAnalyzer

def make_celery(app):
    celery = Celery(
        app.import_name,
        backend=app.config['CELERY_RESULT_BACKEND'],
        broker=app.config['CELERY_BROKER_URL']
    )
    celery.conf.update(app.config)

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery

# Define Celery tasks
celery = Celery(__name__, broker=Config.CELERY_BROKER_URL, backend=Config.CELERY_RESULT_BACKEND)

@celery.task
def analyze_video_task(video_path, filename):
    """
    Analyze video for pose detection asynchronously with enhanced action detection
    """
    try:
        # Initialize MediaPipe Pose
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(
            min_detection_confidence=0.7,
            min_tracking_confidence=0.5
        )
        
        # Open video file
        cap = cv2.VideoCapture(video_path)
        
        # Get video info
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Initialize counters
        frame_count = 0
        pose_frames = 0
        jumping_frames = 0
        shooting_frames = 0
        dribbling_frames = 0
        
        # Create a folder for this analysis with a unique ID
        analysis_id = str(uuid.uuid4())
        output_folder = os.path.join(Config.PROCESSED_FOLDER, analysis_id)
        os.makedirs(output_folder, exist_ok=True)
        
        # Store frame timestamps with actions
        action_timestamps = []
        sample_frames_paths = []
        
        # Store landmarks history for dribbling detection
        landmarks_history = []
        
        # Process frames
        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break
            
            frame_count += 1
            timestamp = frame_count / fps  # Current timestamp in seconds
            
            # Process the frame with MediaPipe
            image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(image_rgb)
            
            # Initialize frame actions
            frame_actions = {
                "timestamp": timestamp,
                "has_pose": False,
                "is_jumping": False,
                "is_shooting": False,
                "is_dribbling": False
            }
            
            if results.pose_landmarks:
                pose_frames += 1
                frame_actions["has_pose"] = True
                
                # Store landmarks in history (keep last 10 frames for dribbling detection)
                if len(landmarks_history) >= 10:
                    landmarks_history.pop(0)
                landmarks_history.append(results.pose_landmarks.landmark)
                
                # Detect specific actions
                if PoseAnalyzer.is_jumping(results.pose_landmarks.landmark):
                    jumping_frames += 1
                    frame_actions["is_jumping"] = True
                    
                if PoseAnalyzer.is_shooting(results.pose_landmarks.landmark):
                    shooting_frames += 1
                    frame_actions["is_shooting"] = True
                    
                if PoseAnalyzer.is_dribbling(landmarks_history):
                    dribbling_frames += 1
                    frame_actions["is_dribbling"] = True
                
                # Store frame actions
                action_timestamps.append(frame_actions)
                
                # Save key action frames (jumping, shooting, dribbling)
                should_save_frame = frame_actions["is_jumping"] or frame_actions["is_shooting"] or frame_actions["is_dribbling"]
                
                # Also save periodic frames (every 60 frames) for general visualization
                should_save_frame = should_save_frame or (frame_count % 60 == 0)
                
                # Only save up to 10 sample frames
                if should_save_frame and len(sample_frames_paths) < 10:
                    # Draw pose landmarks
                    annotated_frame = frame.copy()
                    mp_drawing = mp.solutions.drawing_utils
                    mp_drawing.draw_landmarks(
                        annotated_frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
                    
                    # Add action labels to the frame
                    actions_text = []
                    if frame_actions["is_jumping"]:
                        actions_text.append("Jumping")
                    if frame_actions["is_shooting"]:
                        actions_text.append("Shooting")
                    if frame_actions["is_dribbling"]:
                        actions_text.append("Dribbling")
                    
                    if actions_text:
                        cv2.putText(
                            annotated_frame, 
                            " & ".join(actions_text), 
                            (10, 30), 
                            cv2.FONT_HERSHEY_SIMPLEX, 
                            0.8, 
                            (0, 255, 0), 
                            2
                        )
                    
                    # Save the frame
                    output_path = os.path.join(output_folder, f"frame_{frame_count}.jpg")
                    cv2.imwrite(output_path, annotated_frame)
                    sample_frames_paths.append(f"/static/processed_images/{analysis_id}/frame_{frame_count}.jpg")
                
        cap.release()
        
        # Save actions data to JSON file
        actions_file_path = os.path.join(output_folder, "actions.json")
        with open(actions_file_path, 'w') as f:
            json.dump(action_timestamps, f)
        
        # Calculate percentages
        pose_percentage = (pose_frames / frame_count) * 100 if frame_count > 0 else 0
        jumping_percentage = (jumping_frames / pose_frames) * 100 if pose_frames > 0 else 0
        shooting_percentage = (shooting_frames / pose_frames) * 100 if pose_frames > 0 else 0
        dribbling_percentage = (dribbling_frames / pose_frames) * 100 if pose_frames > 0 else 0
        
        # Calculate video duration in seconds
        duration = total_frames / fps if fps > 0 else 0
        
        # Store results in database
        result_id = Database.save_analysis_result(
            filename,
            frame_count,
            pose_frames,
            jumping_frames,
            shooting_frames,
            dribbling_frames,
            duration,
            f"/static/processed_images/{analysis_id}/actions.json"
        )
        
        # Return analysis data
        return {
            "total_frames": frame_count,
            "frames_with_pose": pose_frames,
            "jumping_frames": jumping_frames,
            "shooting_frames": shooting_frames,
            "dribbling_frames": dribbling_frames,
            "pose_percentage": round(pose_percentage, 2),
            "jumping_percentage": round(jumping_percentage, 2),
            "shooting_percentage": round(shooting_percentage, 2),
            "dribbling_percentage": round(dribbling_percentage, 2),
            "duration": round(duration, 2),
            "sample_frames": sample_frames_paths,
            "actions_file": f"/static/processed_images/{analysis_id}/actions.json",
            "result_id": str(result_id)
        }
    
    except Exception as e:
        print(f"Error analyzing video: {str(e)}")
        # Clean up
        if os.path.exists(video_path):
            os.remove(video_path)
        raise e
    
    finally:
        # Clean up the temporary file
        if os.path.exists(video_path):
            os.remove(video_path)
