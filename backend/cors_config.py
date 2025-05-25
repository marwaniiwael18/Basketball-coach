"""
This module provides comprehensive CORS configuration for the Flask application.
"""

def configure_cors(app):
    """
    Configures CORS settings for the Flask application.
    
    Args:
        app: The Flask application instance
    """
    from flask_cors import CORS
    
    # Define CORS configuration
    cors_config = {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", 
                         "X-HTTP-Method-Override", "Accept", "Origin"],
        "expose_headers": ["Content-Type", "X-Total-Count"],
        "supports_credentials": True,
        "max_age": 86400  # 24 hours
    }
    
    # Apply CORS configuration to all routes
    CORS(app, resources={r"/*": cors_config})
    
    # Add CORS headers to all responses
    @app.after_request
    def add_cors_headers(response):
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
        response.headers.add('Access-Control-Allow-Headers', 
                           'Content-Type,Authorization,X-Requested-With,X-HTTP-Method-Override')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        return response
    
    return app
