"use client";

import { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

interface Folder {
  id: string;
  name: string;
}

interface FolderSidebarProps {
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
}

export default function FolderSidebar({ selectedFolderId, onSelectFolder }: FolderSidebarProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .order('name');
    
    if (!error && data) {
      setFolders(data);
    }
    setIsLoading(false);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const { data, error } = await supabase
      .from('folders')
      .insert({ name: newFolderName.trim() })
      .select()
      .single();

    if (!error && data) {
      setFolders(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewFolderName('');
      setIsCreating(false);
    }
  };

  const handleDeleteFolder = async (id: string, name: string) => {
    if (!confirm(`'${name}' 폴더를 삭제하시겠습니까? 폴더 내 레슨은 삭제되지 않고 '미분류'로 이동됩니다.`)) return;

    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id);

    if (!error) {
      setFolders(prev => prev.filter(f => f.id !== id));
      if (selectedFolderId === id) {
        onSelectFolder(null);
      }
    }
  };

  return (
    <aside className="space-y-6">
      <div className="glass-card p-6 rounded-3xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">📁 폴더</h3>
          <button 
            onClick={() => setIsCreating(true)}
            className="w-8 h-8 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors text-indigo-600 shadow-sm"
            title="새 폴더 만들기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>

        <nav className="space-y-2">
          <button 
            onClick={() => onSelectFolder(null)}
            className={`w-full group text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-between ${selectedFolderId === null ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-[1.02]' : 'text-gray-500 hover:bg-white/50 hover:text-indigo-600'}`}
          >
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              <span>전체 리스트</span>
            </div>
            {selectedFolderId === null && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
          </button>
          
          <div className="h-px bg-gray-100/50 my-4 mx-2"></div>

          {isLoading ? (
            <div className="py-10 flex flex-col items-center gap-3">
               <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Syncing Library...</span>
            </div>
          ) : (
            <div className="space-y-1">
              {folders.length === 0 && !isCreating && (
                <p className="px-4 py-4 text-center text-[11px] font-bold text-gray-400 leading-relaxed uppercase tracking-tight italic bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  No custom folders yet
                </p>
              )}

              {folders.map(folder => (
                <div key={folder.id} className="group relative">
                  <button 
                    onClick={() => onSelectFolder(folder.id)}
                    className={`w-full group/btn text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-between pr-10 ${selectedFolderId === folder.id ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-white/50 hover:text-indigo-600'}`}
                  >
                    <div className="flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={selectedFolderId === folder.id ? 'fill-indigo-700/10' : ''}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                      <span className="truncate">{folder.name}</span>
                    </div>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id, folder.name); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </nav>

        {isCreating && (
          <div className="mt-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 shadow-inner animate-in fade-in slide-in-from-top-2">
            <form onSubmit={handleCreateFolder}>
              <input 
                type="text" 
                autoFocus
                className="w-full bg-white border border-indigo-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none mb-3 placeholder:text-gray-300"
                placeholder="New Folder Name"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white text-[11px] py-2.5 rounded-xl font-black uppercase tracking-wider shadow-md active:scale-95">Save</button>
                <button type="button" onClick={() => setIsCreating(false)} className="flex-1 bg-white text-gray-500 text-[11px] py-2.5 rounded-xl font-black uppercase tracking-wider border border-gray-200 transition-colors hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
}
