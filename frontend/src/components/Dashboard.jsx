import React, { useEffect, useState } from 'react';
import api from '../api';
import { 
  FileText, 
  TrendingUp, 
  Clock, 
  Sparkles, 
  BookOpen, 
  CheckCircle,
  FolderDot
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  AreaChart,
  Area
} from 'recharts';

const CHART_COLORS = ['#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

export default function Dashboard({ onSelectPaper, setCurrentTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium animate-pulse">Assembling analytics statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8 bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/20 rounded-2xl max-w-sm">
          <p className="text-red-700 dark:text-red-300 font-semibold">{error}</p>
          <button 
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition"
          >
            Retry Fetch
          </button>
        </div>
      </div>
    );
  }

  const { total_papers, reading_progress, recent_papers, topic_distribution, monthly_activity } = stats;

  return (
    <div className="flex-1 p-6 lg:p-10 bg-slate-50 dark:bg-slate-950 overflow-y-auto space-y-8 max-w-[1600px] mx-auto">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-academic">Research Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track your reading progress, analyze key topics, and review smart insights.</p>
        </div>
        <button
          onClick={() => setCurrentTab('papers')}
          className="flex items-center space-x-2 px-4.5 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-xl text-sm font-medium shadow-md shadow-primary-500/10 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
        >
          <Sparkles className="w-4 h-4" />
          <span>Upload New Paper</span>
        </button>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Papers */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10 group-hover:scale-110 transition duration-300">
            <BookOpen className="w-24 h-24 text-primary-500" />
          </div>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Papers</span>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{total_papers}</span>
            <span className="text-xs text-green-500 font-medium flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              Uploaded
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Total documents stored in your academic library.</p>
        </div>

        {/* Reading Progress */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10 group-hover:scale-110 transition duration-300">
            <CheckCircle className="w-24 h-24 text-green-500" />
          </div>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Reading Progress</span>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{reading_progress}%</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">active</span>
          </div>
          {/* Progress bar */}
          <div className="mt-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${reading_progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Based on annotations, citations, and notes taken.</p>
        </div>

        {/* Active Collections */}
        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group sm:col-span-2 lg:col-span-1">
          <div className="absolute top-0 right-0 p-6 opacity-5 dark:opacity-10 group-hover:scale-110 transition duration-300">
            <FolderDot className="w-24 h-24 text-accent-500" />
          </div>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Library Health</span>
          <div className="mt-4 flex items-baseline space-x-2">
            <span className="text-4xl font-extrabold text-slate-900 dark:text-white">Active</span>
          </div>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">All local language processing systems are operating at peak status.</p>
        </div>
      </div>

      {/* Visual Analytics / Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Monthly Activity Area Chart - 3 cols */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-3">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-6">Library Growth (Upload History)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly_activity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: 'none', 
                    borderRadius: '8px', 
                    color: '#fff' 
                  }} 
                />
                <Area type="monotone" dataKey="uploads" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorUploads)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Topic Distribution Pie Chart - 2 cols */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2">
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">Topic Distribution</h3>
          <div className="h-64 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topic_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {topic_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: 'none', 
                    borderRadius: '8px', 
                    color: '#fff' 
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Label */}
            <div className="absolute text-center">
              <span className="text-xs text-slate-400 uppercase tracking-wider block">Main Focus</span>
              <span className="text-sm font-extrabold text-slate-800 dark:text-white truncate max-w-[120px] block">
                {topic_distribution[0]?.name || 'N/A'}
              </span>
            </div>
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 justify-center">
            {topic_distribution.map((item, index) => (
              <div key={item.name} className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="truncate max-w-[80px]">{item.name}</span>
                <span className="font-semibold text-slate-800 dark:text-white">({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recently Accessed Papers */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-6 flex items-center">
          <Clock className="w-4.5 h-4.5 mr-2 text-primary-500" />
          Recently Uploaded Papers
        </h3>
        
        {recent_papers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm">Your library is empty. Go to the Library tab to upload your first paper.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 text-xs text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Title</th>
                  <th className="pb-3 font-semibold">Authors</th>
                  <th className="pb-3 font-semibold">Year</th>
                  <th className="pb-3 font-semibold">Journal</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                {recent_papers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition duration-150 group">
                    <td className="py-4 font-semibold text-slate-800 dark:text-slate-200 pr-4 max-w-xs truncate font-academic">
                      {paper.title}
                    </td>
                    <td className="py-4 text-slate-500 dark:text-slate-400 pr-4 max-w-[180px] truncate">
                      {paper.authors || 'Unknown'}
                    </td>
                    <td className="py-4 text-slate-500 dark:text-slate-400 pr-4">
                      {paper.year || 'N/A'}
                    </td>
                    <td className="py-4 text-slate-500 dark:text-slate-400 pr-4 max-w-[140px] truncate">
                      {paper.journal || 'N/A'}
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => onSelectPaper(paper.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-primary-600 dark:bg-slate-800 dark:hover:bg-primary-600 hover:text-white dark:hover:text-white text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold transition"
                      >
                        Open Reader
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
