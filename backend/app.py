from flask import Flask, request, jsonify, send_from_directory, url_for
from flask_cors import CORS
import cv2
import os
import tempfile
import uuid
import time
from datetime import datetime
from werkzeug.utils import secure_filename
from config import Config
from tasks import analyze_video_task, make_celery
from database import Database
import json

# Initialize Flask app
app = Flask(__name__, static_folder='static')
app.config.from_object(Config)
Config.init_app(app)

# Enable CORS with more comprehensive configuration
CORS(app)

# Add CORS headers to all responses
@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin in ['http://localhost:3000', 'http://127.0.0.1:3000']:
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Handle OPTIONS preflight requests explicitly
@app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    return '', 200

# Initialize Celery
celery = make_celery(app)

# Initialize database
from database import Database
Database.init_db()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route("/")
def home():
    """Serve a styled homepage for the API"""
    html = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CourtIQ API</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@500;600;700&display=swap" rel="stylesheet">
        <style>
            body {
                font-family: 'Inter', sans-serif;
                background-color: #f9fafb;
                color: #1f2937;
                line-height: 1.5;
                margin: 0;
                padding: 0;
            }
            .header {
                background: linear-gradient(to right, #1e40af, #3b82f6);
                color: white;
                padding: 2rem 1rem;
                text-align: center;
            }
            .header h1 {
                font-family: 'Poppins', sans-serif;
                font-size: 2.5rem;
                margin-bottom: 0.5rem;
            }
            .logo {
                display: inline-block;
                background-color: white;
                color: #1e40af;
                width: 50px;
                height: 50px;
                line-height: 50px;
                text-align: center;
                border-radius: 50%;
                font-size: 1.5rem;
                margin-bottom: 1rem;
            }
            .container {
                max-width: 800px;
                margin: 2rem auto;
                padding: 0 1rem;
            }
            .card {
                background-color: white;
                border-radius: 0.75rem;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                padding: 1.5rem;
                margin-bottom: 1.5rem;
            }
            .card h2 {
                color: #1e40af;
                margin-top: 0;
                font-family: 'Poppins', sans-serif;
            }
            .endpoints {
                background-color: #f8fafc;
                border-radius: 0.5rem;
                padding: 1rem;
                border: 1px solid #e2e8f0;
            }
            .endpoint {
                padding: 0.75rem;
                border-bottom: 1px solid #e2e8f0;
            }
            .endpoint:last-child {
                border-bottom: none;
            }
            .method {
                display: inline-block;
                padding: 0.25rem 0.5rem;
                border-radius: 0.25rem;
                font-size: 0.75rem;
                font-weight: bold;
                margin-right: 0.5rem;
            }
            .get {
                background-color: #dbeafe;
                color: #1e40af;
            }
            .post {
                background-color: #dcfce7;
                color: #166534;
            }
            .delete {
                background-color: #fee2e2;
                color: #b91c1c;
            }
            .options {
                background-color: #f3e8ff;
                color: #7e22ce;
            }
            .btn {
                display: inline-block;
                padding: 0.5rem 1rem;
                background-color: #2563eb;
                color: white;
                text-decoration: none;
                border-radius: 0.375rem;
                font-weight: 500;
                text-align: center;
            }
            .btn:hover {
                background-color: #1d4ed8;
            }
            .footer {
                text-align: center;
                padding: 1.5rem 1rem;
                color: #6b7280;
                font-size: 0.875rem;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">🏀</div>
            <h1>CourtIQ API</h1>
            <p>Basketball Video Analysis Backend</p>
        </div>
        <div class="container">
            <div class="card">
                <h2>API Status</h2>
                <p>The CourtIQ backend API is running and ready to accept requests.</p>
                <a href="/health" class="btn">Check Health Status</a>
                <a href="/api-docs" class="btn">View API Documentation</a>
            </div>
            <div class="card">
                <h2>Available Endpoints</h2>
                <div class="endpoints">
                    <div class="endpoint">
                        <span class="method get">GET</span> <code>/health</code>
                        <p>Health check endpoint to verify database connection</p>
                    </div>
                    <div class="endpoint">
                        <span class="method post">POST</span> <code>/analyze</code>
                        <p>Upload and analyze basketball videos</p>
                    </div>
                    <div class="endpoint">
                        <span class="method get">GET</span> <code>/status/:task_id</code>
                        <p>Check status of an analysis task</p>
                    </div>
                    <div class="endpoint">
                        <span class="method get">GET</span> <code>/results</code>
                        <p>List recent analysis results</p>
                    </div>
                    <div class="endpoint">
                        <span class="method get">GET</span> <code>/results/:result_id</code>
                        <p>Get a specific analysis result by ID</p>
                    </div>
                    <div class="endpoint">
                        <span class="method delete">DELETE</span> <code>/api/results/:result_id/delete</code>
                        <p>Delete an analysis result</p>
                    </div>
                    <div class="endpoint">
                        <span class="method get">GET</span> <code>/api/stats</code>
                        <p>Get summary statistics of all analyses</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="footer">
            &copy; """ + str(datetime.now().year) + """ CourtIQ. All rights reserved.
            <p>Powered by Flask, MongoDB, Celery, MediaPipe and OpenCV</p>
        </div>
    </body>
    </html>
    """
    return html

@app.route("/api-docs")
def api_docs():
    """Serve API documentation"""
    return send_from_directory('static', 'api-docs.html')

@app.route("/health")
def health_check():
    """Health check endpoint to verify database connection"""
    mongodb_connected = Database.is_connected()
    
    # Calculate uptime
    startup_time = getattr(app, 'startup_time', datetime.now())
    if not hasattr(app, 'startup_time'):
        app.startup_time = startup_time
    
    uptime_seconds = (datetime.now() - app.startup_time).total_seconds()
    days, remainder = divmod(uptime_seconds, 86400)
    hours, remainder = divmod(remainder, 3600)
    minutes, seconds = divmod(remainder, 60)
    uptime = f"{int(days)}d {int(hours)}h {int(minutes)}m {int(seconds)}s"
    
    health = {
        "status": "ok" if mongodb_connected else "degraded",
        "timestamp": datetime.now().isoformat(),
        "uptime": uptime,
        "services": {
            "api": {
                "status": "ok",
                "version": "1.0.0"
            },
            "mongodb": {
                "status": "ok" if mongodb_connected else "down",
                "connected": mongodb_connected
            },
            "celery": {
                "status": "ok",  # We could add more comprehensive celery health checks here
                "active": True
            }
        },
        "environment": os.getenv('FLASK_ENV', 'production')
    }
    
    if request.headers.get('Accept') == 'text/html':
        # Return HTML version for browsers
        status_color = "green" if mongodb_connected else "red"
        html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CourtIQ - Health Status</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
            <style>
                body {{ font-family: 'Inter', sans-serif; line-height: 1.5; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; }}
                h1 {{ color: #1e40af; }}
                .status {{ display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 6px; }}
                .green {{ background-color: #22c55e; }}
                .red {{ background-color: #ef4444; }}
                .card {{ background-color: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }}
                table {{ width: 100%; border-collapse: collapse; }}
                th, td {{ text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; }}
                th {{ background-color: #f9fafb; }}
                .status-badge {{ padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }}
                .ok {{ background-color: #dcfce7; color: #166534; }}
                .error {{ background-color: #fee2e2; color: #b91c1c; }}
            </style>
        </head>
        <body>
            <h1>CourtIQ Health Status</h1>
            <div class="card">
                <h2><span class="status {status_color}"></span> System Status: {health['status'].upper()}</h2>
                <p>Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                <p>Uptime: {uptime}</p>
                <p>Environment: {health['environment']}</p>
            </div>
            
            <div class="card">
                <h2>Services</h2>
                <table>
                    <tr>
                        <th>Service</th>
                        <th>Status</th>
                        <th>Details</th>
                    </tr>
                    <tr>
                        <td>API</td>
                        <td><span class="status-badge ok">OK</span></td>
                        <td>Version {health['services']['api']['version']}</td>
                    </tr>
                    <tr>
                        <td>MongoDB</td>
                        <td><span class="status-badge {'ok' if mongodb_connected else 'error'}">{health['services']['mongodb']['status'].upper()}</span></td>
                        <td>{'Connected' if mongodb_connected else 'Not connected'}</td>
                    </tr>
                    <tr>
                        <td>Celery</td>
                        <td><span class="status-badge ok">OK</span></td>
                        <td>Active</td>
                    </tr>
                </table>
            </div>
            
            <p style="text-align: center; color: #6b7280; font-size: 14px;">
                &copy; {datetime.now().year} CourtIQ
            </p>
        </body>
        </html>
        """
        return html
    
    # Return JSON by default
    if not mongodb_connected:
        return jsonify(health), 503
    
    return jsonify(health)

@app.route("/analyze", methods=["POST"])
def analyze_video():
    """Endpoint to analyze uploaded videos asynchronously"""
    try:
        if 'video' not in request.files:
            return jsonify({"error": "No video file provided"}), 400

        video_file = request.files['video']

        if video_file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        if not allowed_file(video_file.filename):
            return jsonify({"error": "Invalid file type. Allowed formats: mp4, mov, avi"}), 400
            
        if video_file.content_length > app.config['MAX_CONTENT_LENGTH']:
            return jsonify({"error": f"File too large. Maximum size is {app.config['MAX_CONTENT_LENGTH'] // (1024 * 1024)}MB"}), 400

        # Secure and save the file temporarily
        filename = secure_filename(video_file.filename)
        unique_filename = f"{str(uuid.uuid4())}_{filename}"
        video_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        # Ensure directory exists
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        
        # Save the file
        video_file.save(video_path)
        
        # Start Celery task for video analysis
        task = analyze_video_task.delay(video_path, filename)
        
        return jsonify({
            "message": "Video uploaded and being processed",
            "task_id": task.id,
            "status": "processing"
        })
    
    except Exception as e:
        app.logger.error(f"Error uploading video: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route("/status/<task_id>", methods=["GET"])
def get_task_status(task_id):
    """Check the status of an analysis task"""
    task = analyze_video_task.AsyncResult(task_id)
    response = {
        "task_id": task_id,
        "status": task.state
    }
    
    if task.state == 'SUCCESS':
        response["result"] = task.result
    elif task.state == 'FAILURE':
        response["error"] = str(task.result)
    
    return jsonify(response)

@app.route("/results/<result_id>", methods=["GET"])
def get_result(result_id):
    """Get analysis result by ID"""
    result = Database.get_analysis_result(result_id)
    if not result:
        return jsonify({"error": "Result not found"}), 404
    
    # Convert ObjectId to string manually
    result['_id'] = str(result['_id'])
    return jsonify(result)

@app.route("/results", methods=["GET"])
def list_results():
    """List recent analysis results with optional filtering"""
    try:
        # Get query parameters
        limit = request.args.get('limit', default=10, type=int)
        search = request.args.get('search', default='', type=str)
        
        if search:
            results = Database.search_analysis_results(search)
        else:
            results = Database.list_analysis_results(limit=limit)
            
        # Convert ObjectId to string manually
        for result in results:
            result['_id'] = str(result['_id'])
            
        return jsonify({
            "status": "success",
            "count": len(results),
            "results": results
        })
    except Exception as e:
        app.logger.error(f"Error listing results: {str(e)}")
        return jsonify({
            "status": "error",
            "error": "Failed to retrieve results",
            "details": str(e)
        }), 500

@app.route('/api/stats', methods=["GET"])
def get_analysis_stats():
    """Get summary statistics of all analyses"""
    try:
        stats = Database.get_analysis_stats()
        return jsonify({
            "status": "success",
            "stats": stats
        })
    except Exception as e:
        app.logger.error(f"Error getting stats: {str(e)}")
        return jsonify({
            "status": "error",
            "error": "Failed to retrieve statistics",
            "details": str(e)
        }), 500

@app.route('/api/results/<result_id>/delete', methods=["DELETE"])
def delete_result(result_id):
    """Delete an analysis result"""
    try:
        if Database.delete_analysis_result(result_id):
            return jsonify({
                "status": "success",
                "message": f"Result {result_id} deleted successfully"
            })
        else:
            return jsonify({
                "status": "error",
                "error": "Result not found or could not be deleted"
            }), 404
    except Exception as e:
        app.logger.error(f"Error deleting result: {str(e)}")
        return jsonify({
            "status": "error",
            "error": "Failed to delete result",
            "details": str(e)
        }), 500

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_from_directory('static', filename)

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5001)
