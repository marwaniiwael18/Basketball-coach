import numpy as np
import math

class PoseAnalyzer:
    """
    A class to analyze basketball poses and detect specific actions
    """
    
    @staticmethod
    def calculate_angle(a, b, c):
        """Calculate the angle between three points"""
        a = np.array(a)
        b = np.array(b)
        c = np.array(c)
        
        radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
        angle = np.abs(radians * 180.0 / np.pi)
        
        if angle > 180.0:
            angle = 360.0 - angle
            
        return angle
    
    @staticmethod
    def is_jumping(landmarks):
        """
        Detect if the person is jumping based on pose landmarks
        
        The following logic is used:
        1. Ankles are higher than the knees
        2. Knees are slightly bent
        3. Arms are raised
        """
        if not landmarks:
            return False
            
        # Get relevant landmarks
        left_shoulder = (landmarks[11].x, landmarks[11].y)
        right_shoulder = (landmarks[12].x, landmarks[12].y)
        left_hip = (landmarks[23].x, landmarks[23].y)
        right_hip = (landmarks[24].x, landmarks[24].y)
        left_knee = (landmarks[25].x, landmarks[25].y)
        right_knee = (landmarks[26].x, landmarks[26].y)
        left_ankle = (landmarks[27].x, landmarks[27].y)
        right_ankle = (landmarks[29].x, landmarks[29].y)
        left_elbow = (landmarks[13].x, landmarks[13].y)
        right_elbow = (landmarks[14].x, landmarks[14].y)
        left_wrist = (landmarks[15].x, landmarks[15].y)
        right_wrist = (landmarks[16].x, landmarks[16].y)
        
        # Check if ankles are higher than knees (jumping indicator)
        ankles_higher_than_knees = (left_ankle[1] < left_knee[1]) and (right_ankle[1] < right_knee[1])
        
        # Check if knees are bent
        left_knee_angle = PoseAnalyzer.calculate_angle(left_hip, left_knee, left_ankle)
        right_knee_angle = PoseAnalyzer.calculate_angle(right_hip, right_knee, right_ankle)
        knees_bent = (left_knee_angle < 170) and (right_knee_angle < 170)
        
        # Check if arms are raised (common in jump shots)
        left_arm_raised = left_wrist[1] < left_elbow[1] < left_shoulder[1]
        right_arm_raised = right_wrist[1] < right_elbow[1] < right_shoulder[1]
        arms_raised = left_arm_raised or right_arm_raised
        
        return ankles_higher_than_knees and knees_bent and arms_raised
    
    @staticmethod
    def is_shooting(landmarks):
        """
        Detect if the person is shooting the basketball
        
        The following logic is used:
        1. One arm is extended upward
        2. The wrist is above the elbow and shoulder
        3. The arm is relatively straight
        """
        if not landmarks:
            return False
            
        # Get relevant landmarks
        left_shoulder = (landmarks[11].x, landmarks[11].y)
        right_shoulder = (landmarks[12].x, landmarks[12].y)
        left_elbow = (landmarks[13].x, landmarks[13].y)
        right_elbow = (landmarks[14].x, landmarks[14].y)
        left_wrist = (landmarks[15].x, landmarks[15].y)
        right_wrist = (landmarks[16].x, landmarks[16].y)
        
        # Check for right arm shooting motion
        right_shooting = (right_wrist[1] < right_elbow[1] < right_shoulder[1])
        left_shooting = (left_wrist[1] < left_elbow[1] < left_shoulder[1])
        
        # Check if the arm is relatively straight
        right_arm_angle = PoseAnalyzer.calculate_angle(right_shoulder, right_elbow, right_wrist)
        left_arm_angle = PoseAnalyzer.calculate_angle(left_shoulder, left_elbow, left_wrist)
        
        right_arm_straight = right_arm_angle > 160
        left_arm_straight = left_arm_angle > 160
        
        return (right_shooting and right_arm_straight) or (left_shooting and left_arm_straight)
    
    @staticmethod
    def is_dribbling(landmarks_history, min_frames=3):
        """
        Detect if the person is dribbling the basketball
        
        This requires looking at multiple frames to detect the up and down
        motion of the hand that indicates dribbling
        """
        if len(landmarks_history) < min_frames:
            return False
            
        # Extract wrist positions from the last few frames
        wrist_y_positions = []
        
        for landmarks in landmarks_history[-min_frames:]:
            if not landmarks:
                continue
                
            # Take the lower of the two wrists as the dribbling hand
            left_wrist_y = landmarks[15].y
            right_wrist_y = landmarks[16].y
            wrist_y = max(left_wrist_y, right_wrist_y)  # Lower hand has higher y value
            wrist_y_positions.append(wrist_y)
        
        if len(wrist_y_positions) < min_frames:
            return False
            
        # Check for up and down motion
        # Calculate if the hand is moving up and down (alternating direction)
        direction_changes = 0
        
        for i in range(1, len(wrist_y_positions) - 1):
            prev_diff = wrist_y_positions[i] - wrist_y_positions[i-1]
            next_diff = wrist_y_positions[i+1] - wrist_y_positions[i]
            
            if (prev_diff * next_diff) < 0:  # Direction change detected
                direction_changes += 1
                
        # If we have at least one direction change in the hand movement, consider it dribbling
        return direction_changes >= 1
