from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import uuid
from functools import wraps
from database import Database
from config import Config

auth_bp = Blueprint('auth', __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            # Decode the token
            data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            current_user = Database.get_user(data['user_id'])
            
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        
        # All good, pass the user to the decorated function
        return f(current_user, *args, **kwargs)
    
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'message': 'Missing required fields'}), 400
    
    # Check if user already exists
    if Database.get_user_by_email(data['email']):
        return jsonify({'message': 'User already exists with this email'}), 400
    
    # Create hashed password
    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
    
    # Create user in database
    user_id = Database.create_user(
        name=data['name'],
        email=data['email'],
        password=hashed_password
    )
    
    return jsonify({'message': 'User registered successfully', 'user_id': str(user_id)}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user and return token"""
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing email or password'}), 400
    
    # Find user by email
    user = Database.get_user_by_email(data['email'])
    
    # Check if user exists and password is correct
    if not user or not check_password_hash(user['password'], data['password']):
        return jsonify({'message': 'Invalid email or password'}), 401
    
    # Generate JWT token
    token = jwt.encode({
        'user_id': str(user['_id']),
        'email': user['email'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
    }, Config.SECRET_KEY, algorithm="HS256")
    
    return jsonify({
        'token': token,
        'user': {
            'id': str(user['_id']),
            'name': user['name'],
            'email': user['email']
        }
    })

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Get user profile information"""
    # Remove sensitive information
    user_data = {
        'id': str(current_user['_id']),
        'name': current_user['name'],
        'email': current_user['email'],
        'created_at': current_user['created_at']
    }
    
    return jsonify({'user': user_data})

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """Update user profile information"""
    data = request.get_json()
    
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    # Only allow updating name
    updates = {}
    if 'name' in data:
        updates['name'] = data['name']
    
    if not updates:
        return jsonify({'message': 'No valid fields to update'}), 400
    
    # Update user in database
    success = Database.update_user(str(current_user['_id']), updates)
    
    if not success:
        return jsonify({'message': 'Failed to update user'}), 500
    
    return jsonify({'message': 'Profile updated successfully'})

@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    """Change user password"""
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('current_password') or not data.get('new_password'):
        return jsonify({'message': 'Missing required fields'}), 400
    
    # Verify current password
    if not check_password_hash(current_user['password'], data['current_password']):
        return jsonify({'message': 'Current password is incorrect'}), 401
    
    # Hash new password
    hashed_password = generate_password_hash(data['new_password'], method='pbkdf2:sha256')
    
    # Update password in database
    success = Database.update_user(str(current_user['_id']), {'password': hashed_password})
    
    if not success:
        return jsonify({'message': 'Failed to update password'}), 500
    
    return jsonify({'message': 'Password updated successfully'})
