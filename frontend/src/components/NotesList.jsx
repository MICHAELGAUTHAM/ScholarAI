import React, { useState, useEffect } from 'react';
import api from '../api';
import { Search, Tag, FileText, Trash2, ArrowRight, Loader2 } from 'lucide-react';

export default function NotesList({ onSelectPaper }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [uniqueTags, setUniqueTags] = useState([]);

  useEffect(() => {
    fetchNotes();
  }, [search, selectedTag]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const data = await api.getNotes(null, search, selectedTag || '');
      setNotes(data);
      
      // Fetch all notes un-filtered to compute unique tag clouds
      const allNotes = await api.getNotes(null, '', '');
      const tagsSet = new Set();
      allNotes.forEach(note => {
        if (note.tags) {
          note.tags.split(',').forEach(t => tagsSet.add(t.trim()));
        }
      });
      setUniqueTags(Array.from(tagsSet));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this annotation?')) return;
    
    try {
      await api.deleteNote(id);
      setNotes(notes.filter(n => n.id !== id));
    } catch (err) {
      alert('Failed to delete note');
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-10 bg-slate-50 dark:bg-slate-950 overflow-y-auto max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-academic">Research Annotations</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review, filter, and search through notes and highlights taken across your library.</p>
      </div>

      {/* Search & Tag Filter Drawer */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Search & Filter Annotations</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Note query search */}
          <div className="relative md:col-span-2">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 dark:text-slate-600">
              <Search className="w-4.5 h-4.5" />
            </span>
            <input
              type="text"
              placeholder="Search content inside your annotations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
            />
          </div>
          
          {/* Tags cloud toggle */}
          <select
            value={selectedTag}
            onChange={e => setSelectedTag(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300"
          >
            <option value="">All Filter Tags</option>
            {uniqueTags.map(t => (
              <option key={t} value={t}>#{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No notes found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You can add notes by opening any paper card from the Library and writing in the Highlights panel.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {notes.map(note => (
            <div 
              key={note.id} 
              className="glass-panel p-6 rounded-2xl transition hover:shadow-md border border-slate-200/50 dark:border-slate-800/40 space-y-4 flex flex-col justify-between relative group"
            >
              <button
                onClick={(e) => handleDelete(note.id, e)}
                className="absolute top-6 right-6 text-slate-400 hover:text-red-500 p-1.5 rounded opacity-0 group-hover:opacity-100 transition"
                title="Delete note"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <div className="space-y-3">
                {/* Meta header */}
                <div className="flex items-center space-x-2 text-[10px] font-bold">
                  {note.page_number && (
                    <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-950/20 text-primary-700 dark:text-primary-400 rounded">
                      Page {note.page_number}
                    </span>
                  )}
                  <span className="text-slate-400">
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Content */}
                <p className="text-sm text-slate-700 dark:text-slate-300 font-academic leading-relaxed whitespace-pre-line pr-8">
                  {note.content}
                </p>

                {/* Tags */}
                {note.tags && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {note.tags.split(',').map(t => (
                      <span key={t} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[9px] font-semibold rounded border border-slate-200/40 dark:border-slate-800/30">
                        #{t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action: Link to paper */}
              <div 
                onClick={() => onSelectPaper(note.paper_id)}
                className="pt-4 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between cursor-pointer group/link"
              >
                <div className="overflow-hidden pr-4">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Source Paper</span>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-academic truncate block mt-0.5 group-hover/link:text-primary-600">
                    Paper ID {note.paper_id}
                  </span>
                </div>
                <div className="text-primary-500 flex items-center text-[10px] font-bold flex-shrink-0">
                  <span>Go to Paper</span>
                  <ArrowRight className="w-3 h-3 ml-0.5 group-hover/link:translate-x-0.5 transition" />
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
