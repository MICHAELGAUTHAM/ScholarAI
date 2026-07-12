import React, { useState, useEffect } from 'react';
import api from '../api';
import { Folder, FolderPlus, Trash2, ArrowRight, FileText, Loader2, Edit2, Plus } from 'lucide-react';

export default function CollectionList({ onSelectPaper }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Active/selected collection to inspect
  const [activeCollectionId, setActiveCollectionId] = useState(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const data = await api.getCollections();
      setCollections(data);
      if (data.length > 0 && !activeCollectionId) {
        setActiveCollectionId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const newCol = await api.createCollection(name, description);
      setCollections([...collections, newCol]);
      setActiveCollectionId(newCol.id);
      setName('');
      setDescription('');
    } catch (err) {
      alert('Failed to create collection');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this collection? (Papers inside will NOT be deleted, only categorized categorization will be removed)')) return;

    try {
      await api.deleteCollection(id);
      setCollections(collections.filter(c => c.id !== id));
      if (activeCollectionId === id) {
        setActiveCollectionId(collections[0]?.id || null);
      }
    } catch (err) {
      alert('Failed to delete collection');
    }
  };

  const activeCollection = collections.find(c => c.id === activeCollectionId);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          <p className="text-sm text-slate-500">Syncing collection folders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 lg:p-10 bg-slate-50 dark:bg-slate-950 overflow-y-auto max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-academic">Research Collections</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Organize your papers into folders and collections for target workflows.</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Left Side: Creation Form & Folders List */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Creation Form */}
          <form onSubmit={handleCreate} className="glass-panel p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center">
              <FolderPlus className="w-4 h-4 mr-1.5 text-primary-500" />
              New Collection
            </h4>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Collection Name</label>
              <input
                required
                type="text"
                placeholder="e.g. Deep Learning QA"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
              <textarea
                placeholder="e.g. Papers detailing transformers and NLP QA methodologies"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-2 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-lg text-xs font-semibold hover:shadow-md transition flex items-center justify-center space-x-1 disabled:opacity-50"
            >
              <span>{creating ? 'Creating...' : 'Create Folder'}</span>
            </button>
          </form>

          {/* Folders List */}
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">All Folders</h4>
            
            <div className="space-y-1.5">
              {collections.map(col => {
                const isActive = activeCollectionId === col.id;
                return (
                  <div
                    key={col.id}
                    onClick={() => setActiveCollectionId(col.id)}
                    className={`p-3 rounded-xl cursor-pointer transition flex items-center justify-between border ${
                      isActive 
                        ? 'bg-primary-500/10 border-primary-500/20 text-primary-700 dark:text-primary-300' 
                        : 'bg-white dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/40 text-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <Folder className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-primary-500' : 'text-slate-400'}`} />
                      <div className="truncate pr-4">
                        <span className="text-xs font-bold block truncate">{col.name}</span>
                        <span className="text-[10px] text-slate-400">{(col.papers || []).length} paper(s)</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => handleDelete(col.id, e)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded transition"
                      title="Delete folder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              
              {collections.length === 0 && (
                <p className="text-center py-6 text-xs text-slate-400">No collections. Create one above!</p>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Active Folder Contents */}
        <div className="lg:col-span-2">
          {activeCollection ? (
            <div className="glass-panel p-6 rounded-2xl h-full flex flex-col justify-between space-y-6">
              <div>
                <div className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white font-academic">{activeCollection.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{activeCollection.description || 'No description provided.'}</p>
                </div>
                
                {/* Papers list in collection */}
                <div className="mt-6 space-y-2.5">
                  {(activeCollection.papers || []).map(paper => (
                    <div
                      key={paper.id}
                      onClick={() => onSelectPaper(paper.id)}
                      className="p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/40 hover:border-primary-500/20 rounded-xl transition cursor-pointer flex items-center justify-between group"
                    >
                      <div className="pr-4 overflow-hidden">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate font-academic">{paper.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{paper.authors} • {paper.year}</p>
                      </div>
                      <div className="text-primary-500 flex items-center text-[10px] font-bold flex-shrink-0">
                        <span>Read</span>
                        <ArrowRight className="w-3 h-3 ml-0.5 group-hover:translate-x-0.5 transition" />
                      </div>
                    </div>
                  ))}
                  
                  {(activeCollection.papers || []).length === 0 && (
                    <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <FileText className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">No papers inside this collection.</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Go to the Library and click the Move dropdown on a paper card.</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-[10px] text-slate-400">
                Created on {new Date(activeCollection.created_at).toLocaleDateString()}
              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-2xl h-full flex items-center justify-center text-center">
              <p className="text-slate-400 text-xs">Select a collection on the left or create one to view contents.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
