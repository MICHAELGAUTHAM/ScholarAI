import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { 
  Search, 
  Upload, 
  Trash2, 
  BookOpen, 
  Calendar, 
  MapPin, 
  Tag, 
  Loader2, 
  AlertCircle,
  FileCheck,
  ChevronRight
} from 'lucide-react';

export default function PaperList({ onSelectPaper }) {
  const [papers, setPapers] = useState([]);
  const [collections, setCollections] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [search, selectedCollection]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const papersData = await api.getPapers(search, selectedCollection || null);
      setPapers(papersData);
      
      const colsData = await api.getCollections();
      setCollections(colsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endswith('.pdf')) {
      setUploadError('Only PDF research papers are supported.');
      return;
    }

    setUploadError('');
    setUploading(true);

    try {
      await api.uploadPaper(file);
      // Refresh list
      await fetchData();
    } catch (err) {
      setUploadError(err.message || 'File upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Avoid selecting the paper when clicking delete
    if (!window.confirm('Are you sure you want to delete this research paper?')) return;

    try {
      await api.deletePaper(id);
      setPapers(papers.filter(p => p.id !== id));
    } catch (err) {
      alert('Failed to delete paper');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setUploadError('Only PDF files are supported.');
        return;
      }
      setUploadError('');
      setUploading(true);
      try {
        await api.uploadPaper(file);
        await fetchData();
      } catch (err) {
        setUploadError(err.message || 'File upload failed.');
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-10 bg-slate-50 dark:bg-slate-950 overflow-y-auto max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-academic">Academic Library</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage, search, and upload research papers for AI synthesis.</p>
      </div>

      {/* Upload Area & Search Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Container */}
        <div 
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="lg:col-span-1 glass-panel p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-primary-500/50 dark:hover:border-primary-500/50 transition duration-300 flex flex-col justify-center items-center text-center cursor-pointer min-h-[200px]"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf"
          />
          {uploading ? (
            <div className="flex flex-col items-center space-y-3">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Extracting PDF layout...</p>
              <p className="text-xs text-slate-400">Running AI text analytics in background</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-primary-500/10 rounded-full w-max mx-auto text-primary-600 dark:text-primary-400">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Drag & Drop research PDF</p>
                <p className="text-xs text-slate-400 mt-1">or click to browse local files</p>
              </div>
            </div>
          )}
          {uploadError && (
            <div className="mt-3 flex items-center space-x-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* Search & Filter Container */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Search & Filters</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fuzzy Text Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-600">
                <Search className="w-4.5 h-4.5" />
              </span>
              <input
                type="text"
                placeholder="Search title, author, abstract..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm placeholder-slate-400"
              />
            </div>

            {/* Collection Filter */}
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-slate-700 dark:text-slate-300"
            >
              <option value="">All Collections / Folders</option>
              {collections.map(col => (
                <option key={col.id} value={col.id}>{col.name}</option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-400 dark:text-slate-500">
            {papers.length} paper(s) matched your filtering criteria.
          </div>
        </div>
      </div>

      {/* Library Grid */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <p className="text-sm text-slate-500">Syncing papers catalogue...</p>
          </div>
        </div>
      ) : papers.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No papers found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Upload your first research paper by dragging a PDF to the dropzone or searching different keywords.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {papers.map((paper) => {
            const isProcessing = paper.authors === 'Analyzing...';
            return (
              <div
                key={paper.id}
                onClick={() => !isProcessing && onSelectPaper(paper.id)}
                className={`glass-panel p-6 rounded-2xl transition-all duration-300 flex flex-col justify-between min-h-[220px] group ${
                  isProcessing 
                    ? 'opacity-85 cursor-not-allowed border-amber-500/20 dark:border-amber-500/10' 
                    : 'cursor-pointer hover:shadow-md hover:border-slate-300/80 dark:hover:border-slate-800/85 hover:-translate-y-0.5'
                }`}
              >
                <div>
                  {/* Top line with Year & Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400 dark:text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{isProcessing ? 'New' : paper.year || 'Year'}</span>
                    </div>
                    <button
                      onClick={(e) => handleDelete(paper.id, e)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition duration-200"
                      title="Delete Paper"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug font-academic group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {paper.title}
                  </h3>

                  {/* Authors */}
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {paper.authors}
                  </p>

                  {/* Abstract preview or Processing state */}
                  {isProcessing ? (
                    <div className="mt-4 flex items-center space-x-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/5 px-3 py-2 rounded-xl w-max animate-pulse border border-amber-500/10">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="font-semibold">AI Generating Summary & Citations...</span>
                    </div>
                  ) : (
                    <p className="mt-3.5 text-xs text-slate-400 line-clamp-2 leading-relaxed font-academic">
                      {paper.abstract}
                    </p>
                  )}
                </div>

                {/* Footer with Keywords */}
                {!isProcessing && (
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between">
                    {/* Keywords tags */}
                    <div className="flex items-center space-x-1.5 overflow-hidden pr-4">
                      {paper.keywords?.slice(0, 3).map((kw) => (
                        <span 
                          key={kw.id} 
                          className="px-2 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[10px] font-semibold rounded-md flex items-center space-x-0.5 border border-slate-200/50 dark:border-slate-800/40 flex-shrink-0"
                        >
                          <Tag className="w-2.5 h-2.5 text-slate-400" />
                          <span>{kw.name}</span>
                        </span>
                      ))}
                      {paper.keywords?.length > 3 && (
                        <span className="text-[10px] text-slate-400 font-semibold flex-shrink-0">
                          +{paper.keywords.length - 3} more
                        </span>
                      )}
                    </div>

                    <div className="text-primary-500 flex items-center text-xs font-bold flex-shrink-0">
                      <span>Open</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
