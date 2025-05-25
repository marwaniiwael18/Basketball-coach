import React, { useState, useEffect } from 'react';
import VideoUpload from './VideoUpload';
import AnalysisHistory from './AnalysisHistory';
import Dashboard from './Dashboard';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll events for header styling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  return (
    <div className="min-h-screen basketball-bg">
      <header className={`bg-blue-800 text-white shadow-lg sticky top-0 z-50 transition-all ${
        isScrolled ? 'py-2' : 'py-5'
      }`}>
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center bg-white text-blue-800 rounded-full p-1 mr-3">
              <span className="text-xl" role="img" aria-label="Basketball">🏀</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">CourtIQ</h1>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <p className="text-blue-200 text-sm">Advanced Basketball Video Analysis</p>
            <nav className="ml-6">
              <ul className="flex space-x-3">
                <li>
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-4 py-2 rounded-lg transition flex items-center ${
                      activeTab === 'dashboard' 
                        ? 'bg-white text-blue-800 font-medium'
                        : 'bg-blue-700 text-white hover:bg-blue-600'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Dashboard
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('upload')}
                    className={`px-4 py-2 rounded-lg transition flex items-center ${
                      activeTab === 'upload' 
                        ? 'bg-white text-blue-800 font-medium'
                        : 'bg-blue-700 text-white hover:bg-blue-600'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Upload
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 rounded-lg transition flex items-center ${
                      activeTab === 'history'
                        ? 'bg-white text-blue-800 font-medium'
                        : 'bg-blue-700 text-white hover:bg-blue-600'
                    }`}
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    History
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Mobile Navigation */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="px-4 py-3 space-y-1">
            <button 
              onClick={() => {
                setActiveTab('dashboard');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2 rounded-lg transition flex items-center ${
                activeTab === 'dashboard' 
                  ? 'bg-white text-blue-800 font-medium'
                  : 'bg-blue-700 text-white hover:bg-blue-600'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard
            </button>
            <button 
              onClick={() => {
                setActiveTab('upload');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2 rounded-lg transition flex items-center ${
                activeTab === 'upload' 
                  ? 'bg-white text-blue-800 font-medium'
                  : 'bg-blue-700 text-white hover:bg-blue-600'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload
            </button>
            <button 
              onClick={() => {
                setActiveTab('history');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2 rounded-lg transition flex items-center ${
                activeTab === 'history'
                  ? 'bg-white text-blue-800 font-medium'
                  : 'bg-blue-700 text-white hover:bg-blue-600'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              History
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="court-gradient rounded-2xl p-6 shadow-sm mb-8">
            <div className="fade-in">
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'upload' && <VideoUpload onAnalysisComplete={() => setActiveTab('history')} />}
              {activeTab === 'history' && <AnalysisHistory />}
            </div>
          </div>
          
          <footer className="mt-16">
            <div className="border-t border-gray-200 pt-10 pb-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-800 rounded-full p-2 mr-3 text-white">
                      <span role="img" aria-label="Basketball">🏀</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">CourtIQ</h3>
                  </div>
                  <p className="text-gray-600 mb-4 pr-4">
                    Advanced basketball video analysis platform powered by artificial intelligence.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
                  <ul className="space-y-2">
                    <li>
                      <button 
                        onClick={() => setActiveTab('dashboard')} 
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Dashboard
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => setActiveTab('upload')} 
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Upload Video
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => setActiveTab('history')} 
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Analysis History
                      </button>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
                  <ul className="space-y-2">
                    <li>
                      <a href="https://github.com/mediapipe/mediapipe" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        MediaPipe Documentation
                      </a>
                    </li>
                    <li>
                      <a href="https://opencv.org/docs/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        OpenCV Documentation
                      </a>
                    </li>
                    <li>
                      <a href="https://flask.palletsprojects.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                        Flask Documentation
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-600 mb-4 md:mb-0">© {new Date().getFullYear()} CourtIQ. All rights reserved.</p>
                <div className="flex space-x-6">
                  <a href="#" className="text-gray-500 hover:text-gray-700">
                    Terms of Service
                  </a>
                  <a href="#" className="text-gray-500 hover:text-gray-700">
                    Privacy Policy
                  </a>
                  <a href="#" className="text-gray-500 hover:text-gray-700">
                    Contact
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default App;
