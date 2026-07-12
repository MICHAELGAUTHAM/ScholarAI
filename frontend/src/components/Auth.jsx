import React, { useState } from 'react';
import api from '../api';
import { BookOpen, Key, Mail, User, ArrowRight, ShieldAlert, Check } from 'lucide-react';

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        await api.login(email, password);
        const user = await api.getCurrentUser();
        onAuthSuccess(user);
      } else {
        await api.register(email, password, fullName);
        setSuccess('Account created successfully! Redirecting to sign in...');
        setTimeout(() => {
          setIsLogin(true);
          setPassword('');
          setLoading(false);
          setSuccess('');
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-slate-900 overflow-hidden font-sans">
      {/* Decorative branding column - Left side */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-tr from-primary-950 via-primary-900 to-slate-900 relative p-12 flex-col justify-between overflow-hidden">
        {/* Subtle glowing circular backgrounds */}
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-accent-500/10 blur-3xl" />
        
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3 z-10">
          <div className="p-2.5 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl shadow-lg shadow-primary-500/20">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Scholar<span className="text-primary-400">AI</span></span>
        </div>

        {/* Academic Intro Quote */}
        <div className="my-auto max-w-lg z-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-400 px-3 py-1 bg-primary-500/10 rounded-full border border-primary-500/20">
            Research Companion
          </span>
          <h1 className="mt-6 text-4xl xl:text-5xl font-extrabold text-white leading-tight font-academic">
            Synthesize academic knowledge with intelligence.
          </h1>
          <p className="mt-6 text-slate-300 leading-relaxed text-sm xl:text-base">
            Upload PDFs, extract precise citations, annotate findings, and chat with your research papers using semantic search.
          </p>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-400 z-10 border-t border-slate-800/80 pt-6">
          &copy; {new Date().getFullYear()} ScholarAI Platform. Powered by deep learning models.
        </div>
      </div>

      {/* Interactive Form column - Right side */}
      <div className="w-full lg:w-1/2 bg-white dark:bg-slate-950 flex flex-col justify-center p-8 sm:p-12 xl:p-20 relative">
        <div className="max-w-md w-full mx-auto">
          {/* Header */}
          <div className="text-left mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Academic Profile'}
            </h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">
              {isLogin 
                ? 'Sign in to access your research papers and collections.' 
                : 'Join ScholarAI and kickstart your paper analysis today.'}
            </p>
          </div>

          {/* Form alert states */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/30 flex items-start space-x-3 text-red-700 dark:text-red-300 text-sm animate-shake">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30 flex items-start space-x-3 text-green-700 dark:text-green-300 text-sm">
              <Check className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-500" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-600">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-slate-400 text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-600">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-slate-400 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-600">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-slate-400 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-medium text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300 shadow-md shadow-primary-500/10 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Toggle link */}
          <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {isLogin ? "New to ScholarAI?" : "Already have an account?"}{' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
              }}
              className="text-primary-600 dark:text-primary-400 hover:underline font-semibold"
            >
              {isLogin ? 'Register now' : 'Sign in here'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
