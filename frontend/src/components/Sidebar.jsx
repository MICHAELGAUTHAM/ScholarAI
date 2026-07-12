import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  FolderOpen, 
  FileText, 
  MessageSquare, 
  LogOut, 
  Sun, 
  Moon,
  ChevronLeft,
  Menu
} from 'lucide-react';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  darkMode, 
  setDarkMode, 
  user, 
  onLogout 
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'papers', label: 'Paper Library', icon: BookOpen },
    { id: 'collections', label: 'Collections', icon: FolderOpen },
    { id: 'notes', label: 'Research Notes', icon: FileText },
  ];

  return (
    <aside className="w-64 h-screen bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between flex-shrink-0 relative z-20">
      <div>
        {/* Brand/Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Scholar<span className="text-primary-400">AI</span>
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-500/10' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Controls & User Profile */}
      <div className="p-4 border-t border-slate-800 space-y-4">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-950/40 rounded-xl">
          <span className="text-xs text-slate-500 font-medium">Dark Mode</span>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors duration-200"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-400" />}
          </button>
        </div>

        {/* User Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-md">
              {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-sm font-semibold text-white truncate">
                {user?.full_name || 'Academic User'}
              </h4>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition-all duration-200"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
