import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AnalysisHistory() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  
  // Get API URL from environment variables with fallback
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // Fetch analysis results on component mount
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`${API_URL}/results`);
        if (response.data && response.data.results) {
          setResults(response.data.results);
        }
        
        // Get stats
        const statsResponse = await axios.get(`${API_URL}/api/stats`);
        if (statsResponse.data && statsResponse.data.stats) {
          setStats(statsResponse.data.stats);
        }
      } catch (err) {
        console.error('Error fetching analysis history:', err);
        setError('Failed to load analysis history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [API_URL]);
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this analysis?')) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/api/results/${id}/delete`);
      // Remove from state
      setResults(results.filter(result => result._id !== id));
    } catch (err) {
      console.error('Error deleting analysis:', err);
      alert('Failed to delete analysis. Please try again.');
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-blue-800 mb-2">Analysis History</h2>
          <p className="text-gray-600">View and manage your basketball video analyses</p>
        </div>
      </div>
      
      {/* Stats Overview */}
      {stats && (
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-xl p-6 mb-8 text-white shadow-lg">
          <div className="flex items-center mb-4">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <h3 className="text-xl font-bold">Performance Dashboard</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="stat-card bg-white/10 backdrop-blur-sm rounded-lg p-4 border-l-0 border-l-transparent">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 mr-2 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                </svg>
                <p className="font-medium">Total Analyses</p>
              </div>
              <p className="text-3xl font-bold">{stats.total_analyses}</p>
            </div>
            
            <div className="stat-card bg-white/10 backdrop-blur-sm rounded-lg p-4 border-l-0 border-l-transparent">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 mr-2 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                </svg>
                <p className="font-medium">Frames Analyzed</p>
              </div>
              <p className="text-3xl font-bold">{stats.total_frames?.toLocaleString() || 0}</p>
            </div>
            
            <div className="stat-card bg-white/10 backdrop-blur-sm rounded-lg p-4 border-l-0 border-l-transparent">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 mr-2 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                </svg>
                <p className="font-medium">Detection Rate</p>
              </div>
              <p className="text-3xl font-bold">{stats.avg_detection_rate}%</p>
            </div>
            
            <div className="stat-card bg-white/10 backdrop-blur-sm rounded-lg p-4 border-l-0 border-l-transparent">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 mr-2 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="font-medium">Avg. Duration</p>
              </div>
              <p className="text-3xl font-bold">{stats.avg_duration}s</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 fade-in">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="font-medium">Error loading analysis history</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-blue-600 rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
            </div>
            <p className="mt-4 text-gray-600">Loading analysis history...</p>
          </div>
        </div>
      )}
      
      {/* Results Cards */}
      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map(result => (
            <div key={result._id} className="card fade-in">
              <div className="bg-blue-50 p-4 border-b border-blue-100 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800 truncate max-w-xs">{result.video_name}</h3>
                    <p className="text-xs text-gray-500">{formatDate(result.created_at)}</p>
                  </div>
                </div>
                <div className="text-sm bg-blue-600 text-white px-2 py-1 rounded-full">
                  {Math.round(result.detection_rate * 100)}% detected
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Total Frames</p>
                    <p className="font-bold text-gray-800">{result.total_frames?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="font-bold text-gray-800">{result.duration?.toFixed(1) || 0}s</p>
                  </div>
                </div>
                
                <div className="flex justify-between border-t border-gray-100 pt-4">
                  <a 
                    href={`${API_URL}/results/${result._id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-primary text-sm py-1 px-3"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    View Details
                  </a>
                  <button
                    onClick={() => handleDelete(result._id)}
                    className="btn btn-secondary text-sm py-1 px-3 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Empty State */}
      {!loading && results.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No analysis results yet</h3>
          <p className="text-gray-600 mb-6">Upload and analyze a basketball video to get started</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Refresh</button>
        </div>
      )}
    </div>
  );
}

export default AnalysisHistory;
