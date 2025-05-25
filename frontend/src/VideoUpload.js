import React, { useState } from 'react';
import axios from 'axios';
import EnhancedVideoPlayer from './EnhancedVideoPlayer';

function VideoUpload({ onAnalysisComplete }) {
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleVideoChange = (e) => {
    const selectedFile = e.target.files[0];
    setError(null);
    
    if (!selectedFile) {
      return;
    }

    // Reset states
    setVideo(selectedFile);
    setResult(null);
    
    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please select an MP4, MOV, or AVI file.');
      return;
    }
    
    // Create video preview URL
    const previewUrl = URL.createObjectURL(selectedFile);
    setVideoPreview(previewUrl);
  };

  const [taskId, setTaskId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [pollInterval, setPollInterval] = useState(null);
  
  // Function to check task status
  const checkTaskStatus = async (taskId) => {
    try {
      const response = await axios.get(`${API_URL}/status/${taskId}`);
      const { status, result, error } = response.data;
      
      setProcessingStatus(status);
      
      if (status === 'SUCCESS') {
        setResult(result);
        clearInterval(pollInterval);
        setLoading(false);
        setProgress(100);
        
        // If onAnalysisComplete is provided, call it after a short delay 
        // to allow user to see the result first
        if (onAnalysisComplete && typeof onAnalysisComplete === 'function') {
          setTimeout(() => {
            onAnalysisComplete();
          }, 3000);
        }
      } else if (status === 'FAILURE') {
        setError(`Processing failed: ${error || 'Unknown error'}`);
        clearInterval(pollInterval);
        setLoading(false);
      } else {
        // Still processing, update progress to show activity
        setProgress((prevProgress) => {
          // Slowly increment progress to show activity, but cap at 90% until complete
          const newProgress = Math.min(prevProgress + 1, 90);
          return newProgress;
        });
      }
    } catch (err) {
      console.error('Error checking status:', err);
      setError('Error checking processing status');
      clearInterval(pollInterval);
      setLoading(false);
    }
  };

  // Clean up polling on unmount
  React.useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  // Get API URL from environment variables with fallback
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous states
    setError(null);
    setProgress(0);
    setProcessingStatus(null);
    setTaskId(null);
    
    if (!video) {
      setError("Please select a video file");
      return;
    }

    const formData = new FormData();
    formData.append('video', video);

    try {
      setLoading(true);
      
      // Upload the video
      const response = await axios.post(`${API_URL}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(Math.min(percentCompleted, 50));  // Cap at 50% for upload phase
        },
      });
      
      // If successful, get the task ID and poll for results
      if (response.data && response.data.task_id) {
        setTaskId(response.data.task_id);
        setProcessingStatus('PROCESSING');
        
        // Start polling for task status
        const interval = setInterval(() => {
          checkTaskStatus(response.data.task_id);
        }, 2000); // Check every 2 seconds
        
        setPollInterval(interval);
      } else {
        throw new Error('No task ID received from server');
      }
    } catch (error) {
      console.error(error);
      if (error.response) {
        // The server returned an error
        setError(error.response.data.error || "Server error. Please try again.");
      } else if (error.request) {
        // The request was made but no response was received
        setError("No response from server. Please check your connection or CORS settings.");
        console.error("Network error - possible CORS issue:", error);
      } else {
        // Something else happened while setting up the request
        setError("Error preparing request. Please try again.");
      }
      setLoading(false);
    }
  };

  // Function to handle downloading results
  const handleDownloadResults = () => {
    if (!result) return;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "court-iq-results.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="card max-w-4xl mx-auto overflow-visible">
      <div className="bg-blue-800 text-white p-6 flex items-center">
        <div className="bg-white rounded-full p-2 mr-3">
          <span className="text-xl text-blue-800" role="img" aria-label="Basketball">🏀</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Basketball Video Analysis</h2>
          <p className="text-sm text-blue-100">Upload your basketball videos for AI-powered pose detection</p>
        </div>
      </div>
      
      <div className="p-8">
        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded-md fade-in">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <p className="font-semibold">Error</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* File upload form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col">
            <label htmlFor="video-upload" className="text-lg font-medium text-gray-700 mb-2">
              Select Basketball Video
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 p-8 hover:border-blue-500 hover:bg-blue-50 transition duration-300 flex flex-col items-center justify-center cursor-pointer">
              <input
                type="file"
                accept="video/mp4, video/quicktime, video/x-msvideo"
                onChange={handleVideoChange}
                className="hidden"
                id="video-upload"
              />
              <div className="text-center">
                <span className="text-4xl mb-4 block">📹</span>
                <p className="text-lg font-medium mb-2">Drag and drop your video here</p>
                <p className="text-sm text-gray-500">or</p>
                <button type="button" onClick={() => document.getElementById('video-upload').click()} className="mt-3 btn btn-primary">
                  Browse Files
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-4">Supported formats: MP4, MOV, AVI (Max 50MB)</p>
            </div>
          </div>
        
        {/* Video Preview */}
        {videoPreview && (
          <div className="mt-2">
            <h3 className="text-lg font-semibold mb-2">👁️ Video Preview</h3>
            <video 
              src={videoPreview} 
              className="w-full rounded-md" 
              controls 
              height="240"
            />
          </div>
        )}
        
        {/* Upload Button */}
        <button
          type="submit"
          disabled={loading || !video}
          className={`btn ${
            loading || !video 
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
              : 'btn-primary'
          } py-3 px-6 w-full sm:w-auto flex items-center justify-center`}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing Video...
            </>
          ) : (
            <>
              <span className="mr-2">🔍</span> Upload and Analyze
            </>
          )}
        </button>
        
        {/* Progress Bar */}
        {loading && (
          <div className="mt-4 fade-in">
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
              <span>{progress < 100 ? 'Uploading video' : 'Processing frames'}</span>
              <span className="font-medium">{progress}%</span>
            </div>
          </div>
        )}
      </form>

      {/* Processing Status */}
      {processingStatus && !result && (
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl shadow-sm fade-in-delay-1">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <svg className="w-6 h-6 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Processing Your Video</h3>
              <p className="text-blue-600 font-medium">Status: {processingStatus}</p>
              <p className="text-sm text-gray-600 mt-1">
                {processingStatus === 'PENDING' && "Your video is in the queue for processing..."}
                {processingStatus === 'STARTED' && "Processing has begun on your video..."}
                {processingStatus === 'PROCESSING' && "Analyzing player movements and detecting basketball actions..."}
              </p>
            </div>
          </div>
        </div>
      )}          {/* Results Display */}
      {result && (
        <div className="mt-8 p-6 border rounded-lg bg-blue-50 border-blue-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h3 className="text-xl font-bold text-blue-800">📊 Analysis Results</h3>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={handleDownloadResults}
                className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition flex items-center"
              >
                <span className="mr-1">💾</span> Download Results
              </button>
              {result.result_id && (
                <button 
                  onClick={() => window.open(`${API_URL}/results/${result.result_id}`, '_blank')}
                  className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition flex items-center"
                >
                  <span className="mr-1">🔗</span> View API
                </button>
              )}
              {onAnalysisComplete && (
                <button 
                  onClick={onAnalysisComplete}
                  className="text-sm bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 transition flex items-center"
                >
                  <span className="mr-1">📋</span> View All Analyses
                </button>
              )}
            </div>
          </div>
          
          {/* Video Information */}
          <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 text-sm">Video Duration</p>
                <p className="text-lg font-bold text-blue-900">
                  {result.duration ? `${result.duration.toFixed(1)} seconds` : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Frame Rate</p>
                <p className="text-lg font-bold text-blue-900">
                  {result.total_frames && result.duration 
                    ? `${(result.total_frames / result.duration).toFixed(1)} FPS` 
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Basic Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
              <p className="text-gray-500 text-sm">Total Frames</p>
              <p className="text-3xl font-bold text-blue-900">{result.total_frames.toLocaleString()}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
              <p className="text-gray-500 text-sm">Frames with Pose</p>
              <p className="text-3xl font-bold text-blue-900">{result.frames_with_pose.toLocaleString()}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm col-span-2">
              <p className="text-gray-500 text-sm">Pose Detection Rate</p>
              <p className="text-3xl font-bold text-blue-900">
                {result.pose_percentage ? `${result.pose_percentage}%` : 
                  (result.total_frames > 0 
                    ? `${Math.round((result.frames_with_pose / result.total_frames) * 100)}%` 
                    : '0%')}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ width: `${result.pose_percentage || (result.frames_with_pose / result.total_frames) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Advanced Stats and Actions */}
          {(result.jumping_frames || result.shooting_frames || result.dribbling_frames) && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3 text-blue-800">🏀 Basketball Actions Detected</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Jumping Stat */}
                {result.jumping_frames > 0 && (
                  <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">Jumping</p>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {result.jumping_frames} frames
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${result.jumping_percentage || (result.jumping_frames / result.frames_with_pose) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-right mt-1 text-gray-500">
                        {result.jumping_percentage ? `${result.jumping_percentage}%` : 
                          `${Math.round((result.jumping_frames / result.frames_with_pose) * 100)}%`}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Shooting Stat */}
                {result.shooting_frames > 0 && (
                  <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">Shooting</p>
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                        {result.shooting_frames} frames
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full" 
                          style={{ width: `${result.shooting_percentage || (result.shooting_frames / result.frames_with_pose) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-right mt-1 text-gray-500">
                        {result.shooting_percentage ? `${result.shooting_percentage}%` : 
                          `${Math.round((result.shooting_frames / result.frames_with_pose) * 100)}%`}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Dribbling Stat */}
                {result.dribbling_frames > 0 && (
                  <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                    <div className="flex justify-between items-center">
                      <p className="font-medium">Dribbling</p>
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                        {result.dribbling_frames} frames
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${result.dribbling_percentage || (result.dribbling_frames / result.frames_with_pose) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-right mt-1 text-gray-500">
                        {result.dribbling_percentage ? `${result.dribbling_percentage}%` : 
                          `${Math.round((result.dribbling_frames / result.frames_with_pose) * 100)}%`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Sample Frames Display */}
          {result.sample_frames && result.sample_frames.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-lg mb-3 text-blue-800">📸 Detected Poses & Actions</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.sample_frames.map((frame, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden shadow-sm bg-white">
                    <img 
                      src={`${API_URL}${frame}`} 
                      alt={`Frame ${index + 1}`}
                      className="w-full h-auto"
                    />
                    <div className="p-2 text-center">
                      <p className="text-sm text-gray-600">Frame Sample {index + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VideoUpload;
