import unittest
import os
import sys
import json
from app import app

class CourtIQTestCase(unittest.TestCase):
    def setUp(self):
        """Set up test client and other test variables."""
        self.app = app.test_client()
        self.app.testing = True
        
    def test_home_status_code(self):
        """Test if home endpoint is accessible."""
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'CourtIQ backend is running', response.data)
    
    def test_analyze_missing_video(self):
        """Test API response when no video is uploaded."""
        response = self.app.post('/analyze')
        data = json.loads(response.data.decode('utf-8'))
        self.assertEqual(response.status_code, 400)
        self.assertEqual(data['error'], 'No video file provided')
    
    def test_analyze_invalid_file_type(self):
        """Test API response when invalid file type is uploaded."""
        data = {}
        data['video'] = (open('app.py', 'rb'), 'app.py')
        response = self.app.post('/analyze', data=data, content_type='multipart/form-data')
        data = json.loads(response.data.decode('utf-8'))
        self.assertEqual(response.status_code, 400)
        self.assertEqual(data['error'], 'Invalid file type. Allowed formats: mp4, mov, avi')

if __name__ == '__main__':
    unittest.main()
