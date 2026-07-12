import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  ArrowLeft, 
  BookOpen, 
  Bookmark, 
  Copy, 
  Check, 
  Tag, 
  MessageSquare, 
  FileText, 
  Sparkles,
  Edit3,
  Calendar,
  Layers,
  Send,
  Loader2,
  BookmarkPlus,
  Plus
} from 'lucide-react';
import ChatInterface from './ChatInterface';

export default function PaperDetail({ paperId, onBack, onSelectPaper }) {
  const [paper, setPaper] = useState(null);
  const [collections, setCollections] = useState([]);
  const [similarPapers, setSimilarPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedType, setCopiedType] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'chat', 'notes'
  
  // Note inputs
  const [noteContent, setNoteContent] = useState('');
  const [notePage, setNotePage] = useState('');
  const [noteTags, setNoteTags] = useState('');
  
  // Edit metadata form
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editAuthors, setEditAuthors] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editJournal, setEditJournal] = useState('');

  useEffect(() => {
    fetchPaperDetails();
  }, [paperId]);

  const fetchPaperDetails = async () => {
    try {
      setLoading(true);
      const data = await api.getPaperDetails(paperId);
      setPaper(data);
      
      setEditTitle(data.title);
      setEditAuthors(data.authors || '');
      setEditYear(data.year || '');
      setEditJournal(data.journal || '');

      const cols = await api.getCollections();
      setCollections(cols);

      const similar = await api.getSimilarPapers(paperId);
      setSimilarPapers(similar);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCitation = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1500);
  };

  const handleAddToCollection = async (colId) => {
    if (!colId) return;
    try {
      await api.addPaperToCollection(colId, paperId);
      // Refresh paper to update collections list
      const updated = await api.getPaperDetails(paperId);
      setPaper(updated);
    } catch (err) {
      alert('Failed to add to collection');
    }
  };

  const handleRemoveFromCollection = async (colId) => {
    try {
      await api.removePaperFromCollection(colId, paperId);
      const updated = await api.getPaperDetails(paperId);
      setPaper(updated);
    } catch (err) {
      alert('Failed to remove from collection');
    }
  };

  const handleUpdateMetadata = async (e) => {
    e.preventDefault();
    try {
      const updated = await api.updatePaper(paperId, {
        title: editTitle,
        authors: editAuthors,
        year: parseInt(editYear) || null,
        journal: editJournal
      });
      setPaper({ ...paper, ...updated });
      setIsEditing(false);
      // Refetch for updated citations
      const refreshed = await api.getPaperDetails(paperId);
      setPaper(refreshed);
    } catch (err) {
      alert('Failed to update metadata');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    
    try {
      const pageNum = notePage ? parseInt(notePage) : null;
      await api.createNote(paperId, noteContent, pageNum, null, noteTags || null);
      
      setNoteContent('');
      setNotePage('');
      setNoteTags('');
      
      // Refresh notes list
      const refreshed = await api.getPaperDetails(paperId);
      setPaper(refreshed);
    } catch (err) {
      alert('Failed to add note');
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await api.deleteNote(noteId);
      setPaper({
        ...paper,
        notes: paper.notes.filter(n => n.id !== noteId)
      });
    } catch (err) {
      alert('Failed to delete note');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium animate-pulse">Running semantic synthesis...</p>
        </div>
      </div>
    );
  }

  const getBackendUrl = () => {
    const apiEnv = import.meta.env.VITE_API_URL;
    if (apiEnv && apiEnv.startsWith("http")) {
      try {
        return new URL(apiEnv).origin;
      } catch (e) {
        // fallback to window.location.origin
      }
    }
    return window.location.origin;
  };

  const fileUrl = paper.file_path 
    ? `${getBackendUrl()}/uploads/${paper.file_path.split('_').slice(1).join('_')}`
    : null;

  // Find collections the paper is not in
  const availableCollections = collections.filter(
    col => !paper.collections?.some(pc => pc.id === col.id)
  );

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col h-screen overflow-hidden font-sans">
      {/* Top Header Panel */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6 z-10 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-lg">
              Paper ID: {paper.id}
            </span>
          </div>
        </div>
        
        {/* PDF Link Access */}
        {paper.file_path && (
          <a
            href={`${getBackendUrl()}/uploads/${paper.file_path.split(/[\\/]/).pop()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Open Original PDF</span>
          </a>
        )}
      </header>

      {/* Main split work-desk */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column - Meta details */}
        <div className="w-full lg:w-1/2 p-6 overflow-y-auto border-r border-slate-200 dark:border-slate-800/80 space-y-6">
          
          {/* Metadata Card */}
          <div className="glass-panel p-6 rounded-2xl relative">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
              title="Edit Metadata"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            {isEditing ? (
              <form onSubmit={handleUpdateMetadata} className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-2">Edit Paper Metadata</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Title</label>
                  <input 
                    type="text" 
                    value={editTitle} 
                    onChange={e => setEditTitle(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Authors</label>
                  <input 
                    type="text" 
                    value={editAuthors} 
                    onChange={e => setEditAuthors(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Year</label>
                    <input 
                      type="number" 
                      value={editYear} 
                      onChange={e => setEditYear(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Journal</label>
                    <input 
                      type="text" 
                      value={editJournal} 
                      onChange={e => setEditJournal(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex space-x-2 justify-end pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <h1 className="text-xl lg:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug font-academic pr-8">
                  {paper.title}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
                  {paper.authors}
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> {paper.year || 'N/A'}</span>
                  <span className="flex items-center"><Layers className="w-3.5 h-3.5 mr-1" /> {paper.journal || 'N/A'}</span>
                </div>
                
                {/* Keywords tags */}
                {paper.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {paper.keywords.map(kw => (
                      <span key={kw.id} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-semibold rounded-md border border-slate-200/50 dark:border-slate-800/40">
                        {kw.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Collections Organizer */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center">
              <Bookmark className="w-3.5 h-3.5 mr-1.5 text-accent-500" />
              Collections Organizer
            </h3>
            
            {/* Added Collections */}
            <div className="flex flex-wrap gap-2">
              {paper.collections?.map(col => (
                <span 
                  key={col.id}
                  className="pl-3 pr-2 py-1.5 bg-accent-100 dark:bg-accent-950/20 text-accent-800 dark:text-accent-300 text-xs font-medium rounded-xl border border-accent-200/40 dark:border-accent-900/30 flex items-center space-x-1.5"
                >
                  <span>{col.name}</span>
                  <button 
                    onClick={() => handleRemoveFromCollection(col.id)}
                    className="hover:text-red-500 text-accent-400 font-bold ml-1 text-[11px] p-0.5 rounded"
                  >
                    &times;
                  </button>
                </span>
              ))}
              
              {paper.collections?.length === 0 && (
                <p className="text-xs text-slate-400">This paper does not belong to any collections yet.</p>
              )}
            </div>

            {/* Collection Add Selector */}
            {availableCollections.length > 0 && (
              <div className="flex items-center space-x-2 max-w-xs">
                <select
                  onChange={(e) => {
                    handleAddToCollection(e.target.value);
                    e.target.value = '';
                  }}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300"
                >
                  <option value="">Move to Collection...</option>
                  {availableCollections.map(col => (
                    <option key={col.id} value={col.id}>{col.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Citations Box */}
          {paper.citation && (
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Academic Citations</h3>
              
              <div className="space-y-3">
                {['APA', 'MLA', 'IEEE'].map(type => {
                  const citText = type === 'APA' ? paper.citation.apa : type === 'MLA' ? paper.citation.mla : paper.citation.ieee;
                  return (
                    <div key={type} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/40 relative group">
                      <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 block mb-1.5">{type} Format</span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-academic leading-relaxed pr-8">{citText}</p>
                      
                      <button
                        onClick={() => handleCopyCitation(citText, type)}
                        className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition opacity-0 group-hover:opacity-100"
                        title="Copy citation"
                      >
                        {copiedType === type ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Similar Papers Recommendations */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary-500 animate-pulse" />
              Similar Research Recommendations
            </h3>
            
            <div className="space-y-2.5">
              {similarPapers.map(sim => (
                <div
                  key={sim.id}
                  onClick={() => onSelectPaper(sim.id)}
                  className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-800/40 rounded-xl transition cursor-pointer flex items-start justify-between"
                >
                  <div className="pr-4 overflow-hidden">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1 font-academic">{sim.title}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{sim.authors || 'Unknown'}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-primary-500/10 text-primary-700 dark:text-primary-300 text-[10px] font-bold rounded-md flex-shrink-0">
                    {Math.round(sim.similarity_score * 100)}% Match
                  </span>
                </div>
              ))}
              
              {similarPapers.length === 0 && (
                <p className="text-xs text-slate-400">No similarity recommendations found. Add more papers to your library to generate maps.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Work-Desk Tabs (Summary, QA Chat, Notes) */}
        <div className="w-full lg:w-1/2 flex flex-col bg-white dark:bg-slate-900">
          
          {/* Work Tabs */}
          <div className="h-14 border-b border-slate-200 dark:border-slate-800 flex items-center px-6 space-x-6 flex-shrink-0 bg-slate-50 dark:bg-slate-900/60">
            {[
              { id: 'summary', label: 'AI Summary', icon: Sparkles },
              { id: 'chat', label: 'Chat Q&A', icon: MessageSquare },
              { id: 'notes', label: 'Highlights & Notes', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`h-full flex items-center space-x-1.5 border-b-2 text-sm font-semibold transition ${
                    isActive 
                      ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400' 
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Workdesk Area Container */}
          <div className="flex-1 overflow-y-auto">
            
            {/* Tab: Summary */}
            {activeTab === 'summary' && (
              <div className="p-6 space-y-6">
                <div className="prose dark:prose-invert max-w-none">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">AI generated summary</h3>
                  <div className="text-sm text-slate-600 dark:text-slate-300 font-academic leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                    {paper.summary || 'Processing AI summary. This might take a few seconds...'}
                  </div>
                </div>

                <div className="prose dark:prose-invert max-w-none">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4">Original Abstract</h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-academic leading-relaxed bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                    {paper.abstract}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Chat QA */}
            {activeTab === 'chat' && (
              <ChatInterface paperId={paperId} />
            )}

            {/* Tab: Notes */}
            {activeTab === 'notes' && (
              <div className="p-6 space-y-6">
                
                {/* Note adding Form */}
                <form onSubmit={handleAddNote} className="glass-panel p-5 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Add Research Annotation</h4>
                  
                  <textarea
                    required
                    rows={3}
                    placeholder="Type notes or paste key highlights from the paper..."
                    value={noteContent}
                    onChange={e => setNoteContent(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Page Number</label>
                      <input
                        type="number"
                        placeholder="e.g. 5"
                        value={notePage}
                        onChange={e => setNotePage(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tags (comma-separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. methods, validation"
                        value={noteTags}
                        onChange={e => setNoteTags(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-lg text-xs font-semibold hover:shadow-md transition flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save Note</span>
                  </button>
                </form>

                {/* Notes List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">All annotations ({paper.notes?.length || 0})</h4>
                  
                  <div className="space-y-3">
                    {paper.notes?.map(note => (
                      <div key={note.id} className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800/40 space-y-3 relative group">
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-1 rounded opacity-0 group-hover:opacity-100 transition"
                          title="Delete note"
                        >
                          &times;
                        </button>
                        
                        <div className="flex items-center space-x-2">
                          {note.page_number && (
                            <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-950/20 text-primary-700 dark:text-primary-400 text-[10px] font-bold rounded">
                              Page {note.page_number}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">
                            {new Date(note.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-academic leading-relaxed pr-8 whitespace-pre-wrap">{note.content}</p>
                        
                        {note.tags && (
                          <div className="flex flex-wrap gap-1">
                            {note.tags.split(',').map(t => (
                              <span key={t} className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[9px] font-bold rounded">
                                #{t.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {paper.notes?.length === 0 && (
                      <div className="text-center py-8 text-xs text-slate-400">
                        No notes taken yet. Use the form above to add your first annotation.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
