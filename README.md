# CourtIQ - Basketball Video Analysis App

CourtIQ is a web application that analyzes basketball videos using pose detection technology. It identifies player poses, tracks movements, and detects specific basketball actions like jumping, shooting, and dribbling.

## Features

- **Video Upload & Analysis**: Upload basketball videos for detailed pose analysis
- **Action Detection**: Automatically identify jumping, shooting, and dribbling actions
- **Visual Results**: View sample frames with pose detection overlays
- **Analytics Dashboard**: See comprehensive statistics about the video and detected actions
- **Asynchronous Processing**: Backend processes videos efficiently without blocking the UI
- **Downloadable Results**: Export analysis results in JSON format

## Tech Stack

### Frontend
- React
- Axios for API communication
- Responsive design with custom CSS

### Backend
- Flask with Flask-CORS
- MediaPipe for pose detection
- OpenCV for video processing
- Celery for asynchronous task processing
- Redis as the message broker
- MongoDB for data storage

## Getting Started

### Prerequisites
- Node.js and npm
- Python 3.10+
- MongoDB
- Redis

### Installation

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment and activate it:
```bash
python -m venv venv310
source venv310/bin/activate  # On Windows: venv310\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Make sure MongoDB and Redis are running on your machine

5. Start the backend:
```bash
./start.sh  # On Windows, you may need to manually start the services
```

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm start
```

4. Open your browser and go to `http://localhost:3000`

### Using Docker (Alternative)

You can also use Docker Compose to run the entire stack:

```bash
docker-compose up
```

This will start the frontend, backend, MongoDB, Redis, and Celery worker services.

## Deployment

### Frontend Deployment (Netlify)

1. Build the React app:
```bash
cd frontend
npm run build
```

2. Deploy to Netlify using the Netlify CLI or connect your GitHub repository.

### Backend Deployment (Heroku)

1. Create a new Heroku app:
```bash
heroku create your-app-name
```

2. Add MongoDB and Redis add-ons:
```bash
heroku addons:create mongolab
heroku addons:create heroku-redis
```

3. Push the backend code:
```bash
git subtree push --prefix backend heroku main
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
