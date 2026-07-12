import React, { useState, useEffect } from 'react';
import api from './api';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PaperList from './components/PaperList';
import PaperDetail from './components/PaperDetail';
import CollectionList from './components/CollectionList';
import NotesList from './components/NotesList';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedPaperId, setSelectedPaperId] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('scholarai_theme');
    return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // Verify user token on app initialization
  useEffect(() => {
    checkAuth();
  }, []);

  // Sync dark mode class with document body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('scholarai_theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('scholarai_theme', 'light');
    }
  }, [darkMode]);

  const checkAuth = async () => {
    if (!api.token) {
      setLoading(false);
      return;
    }
    try {
      const currentUser = await api.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error("Session token validation failed:", err);
      api.logout();
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setSelectedPaperId(null);
    setCurrentTab('dashboard');
  };

  const handleSelectPaper = (id) => {
    setSelectedPaperId(id);
  };

  const handleBackToLibrary = () => {
    setSelectedPaperId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          <h2 className="text-white text-sm font-semibold tracking-wider animate-pulse uppercase">ScholarAI Initializing...</h2>
        </div>
      </div>
    );
  }

  // Render auth screens if no active user session
  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Navigation sidebar drawer */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          setSelectedPaperId(null); // Reset paper details when clicking main sidebar links
        }} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {selectedPaperId ? (
          <PaperDetail 
            paperId={selectedPaperId} 
            onBack={handleBackToLibrary}
            onSelectPaper={handleSelectPaper} 
          />
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <Dashboard 
                onSelectPaper={handleSelectPaper} 
                setCurrentTab={setCurrentTab}
              />
            )}
            
            {currentTab === 'papers' && (
              <PaperList onSelectPaper={handleSelectPaper} />
            )}
            
            {currentTab === 'collections' && (
              <CollectionList onSelectPaper={handleSelectPaper} />
            )}
            
            {currentTab === 'notes' && (
              <NotesList onSelectPaper={handleSelectPaper} />
            )}
          </>
        )}
      </main>

    </div>
  );
}
