import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/useAuthStore';
import { AuthForm } from './components/Auth/AuthForm';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Whiteboard } from './components/Whiteboard/Whiteboard';
import { PublicWhiteboard } from './components/Whiteboard/PublicWhiteboard';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'whiteboard'>('dashboard');
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleBoardSelect = (boardId: string) => {
    setSelectedBoardId(boardId);
    setCurrentView('whiteboard');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedBoardId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/shared/:token" element={<PublicWhiteboard />} />
          <Route path="*" element={<AuthForm />} />
        </Routes>
        <AuthForm />
        <Toaster position="top-right" />
      </Router>
    );
  }

  return (
    <Router>
      {currentView === 'dashboard' ? (
        <Routes>
          <Route path="/" element={<Dashboard onBoardSelect={handleBoardSelect} />} />
          <Route path="/shared/:token" element={<PublicWhiteboard />} />
        </Routes>
      ) : selectedBoardId ? (
        <Routes>
          <Route path="/" element={<Whiteboard boardId={selectedBoardId} onBack={handleBackToDashboard} />} />
          <Route path="/shared/:token" element={<PublicWhiteboard />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/" element={<Dashboard onBoardSelect={handleBoardSelect} />} />
          <Route path="/shared/:token" element={<PublicWhiteboard />} />
        </Routes>
      )}
      <Toaster position="top-right" />
    </Router>
  );
}

export default App;