import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VideoUpload from './VideoUpload';
import axios from 'axios';

// Mock axios
jest.mock('axios');

describe('VideoUpload Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
  });
  
  test('renders video upload form', () => {
    render(<VideoUpload />);
    
    // Check if the main elements are rendered
    expect(screen.getByText(/CourtIQ Analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/Supported formats/i)).toBeInTheDocument();
    
    // Check if the upload button is disabled initially (no file selected)
    const uploadButton = screen.getByText(/Upload and Analyze/i);
    expect(uploadButton).toBeDisabled();
  });
  
  test('handles file selection', () => {
    render(<VideoUpload />);
    
    // Create a mock file
    const file = new File(['dummy content'], 'basketball.mp4', { type: 'video/mp4' });
    
    // Get the file input and simulate file selection
    const input = screen.getByLabelText(/video-upload/i) || document.getElementById('video-upload');
    fireEvent.change(input, { target: { files: [file] } });
    
    // Check if the upload button is enabled after file selection
    const uploadButton = screen.getByText(/Upload and Analyze/i);
    expect(uploadButton).not.toBeDisabled();
  });
  
  test('shows error for invalid file type', () => {
    render(<VideoUpload />);
    
    // Create an invalid file type
    const file = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' });
    
    // Get the file input and simulate file selection
    const input = screen.getByLabelText(/video-upload/i) || document.getElementById('video-upload');
    fireEvent.change(input, { target: { files: [file] } });
    
    // Check if error message is displayed
    expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument();
  });
  
  test('handles form submission and displays results', async () => {
    // Mock successful API response
    axios.post.mockResolvedValue({
      data: {
        task_id: 'mock-task-id',
        status: 'processing'
      }
    });
    
    // Mock status check response
    axios.get.mockResolvedValue({
      data: {
        status: 'SUCCESS',
        result: {
          total_frames: 100,
          frames_with_pose: 75,
          pose_percentage: 75,
          jumping_frames: 20,
          shooting_frames: 15,
          dribbling_frames: 30,
          sample_frames: ['/path/to/frame1.jpg', '/path/to/frame2.jpg']
        }
      }
    });
    
    render(<VideoUpload />);
    
    // Create a mock file
    const file = new File(['dummy content'], 'basketball.mp4', { type: 'video/mp4' });
    
    // Get the file input and simulate file selection
    const input = screen.getByLabelText(/video-upload/i) || document.getElementById('video-upload');
    fireEvent.change(input, { target: { files: [file] } });
    
    // Submit the form
    const uploadButton = screen.getByText(/Upload and Analyze/i);
    fireEvent.click(uploadButton);
    
    // Check if loading state is shown
    expect(screen.getByText(/Processing Video/i)).toBeInTheDocument();
    
    // Wait for results to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Analysis Results/i)).toBeInTheDocument();
    });
    
    // Check if the results are displayed correctly
    expect(screen.getByText(/75/)).toBeInTheDocument(); // frames_with_pose
    expect(screen.getByText(/100/)).toBeInTheDocument(); // total_frames
  });
  
  test('handles API errors', async () => {
    // Mock failed API response
    axios.post.mockRejectedValue({
      response: {
        data: {
          error: 'Server error'
        }
      }
    });
    
    render(<VideoUpload />);
    
    // Create a mock file
    const file = new File(['dummy content'], 'basketball.mp4', { type: 'video/mp4' });
    
    // Get the file input and simulate file selection
    const input = screen.getByLabelText(/video-upload/i) || document.getElementById('video-upload');
    fireEvent.change(input, { target: { files: [file] } });
    
    // Submit the form
    const uploadButton = screen.getByText(/Upload and Analyze/i);
    fireEvent.click(uploadButton);
    
    // Wait for error message to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Server error/i)).toBeInTheDocument();
    });
  });
});
