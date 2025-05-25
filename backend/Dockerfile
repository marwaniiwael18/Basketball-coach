FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Create required directories
RUN mkdir -p static/uploads static/processed_images

# Expose the Flask port
EXPOSE 5000

# Command to run the application
CMD gunicorn --bind 0.0.0.0:5000 app:app
