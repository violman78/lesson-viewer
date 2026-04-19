"use client";

import { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Folder {
  id: string;
  name: string;
}

interface MoveToFolderMenuProps {
  lessonId: string;
  currentFolderId: string | null;
}

export default function MoveToFolderMenu({ lessonId, currentFolderId }: MoveToFolderMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    if (isOpen && folders.length === 0) {
      fetchFolders();
    }
  }, [isOpen]);

  const fetchFolders = async () => {
    const { data, error } = await supabase
      .from('folders')
      .select('id, name')
      .order('name');
    
    if (!error && data) {
      setFolders(data);
    }
  };

  const handleMove = async (folderId: string | null) => {
    if (folderId === currentFolderId) {
      setIsOpen(false);
      return;
    }

    setIsUpdating(true);
    const { error } = await supabase
      .from('lessons')
      .update({ folder_id: folderId })
      .eq('id', lessonId);

    if (!error) {
      setIsOpen(false);
      router.refresh();
    }
    setIsUpdating(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border ${isOpen ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-110' : 'bg-white hover:bg-gray-50 text-gray-400 border-gray-100 hover:text-indigo-600 hover:border-indigo-100'}`}
        title="폴더 이동"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><polyline points="9 11 12 14 15 11"></polyline><line x1="12" y1="5" x2="12" y2="14"></line></svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-3 w-56 glass-card rounded-2xl shadow-2xl py-3 z-20 animate-in fade-in zoom-in duration-200 origin-top-right border-white/40">
            <p className="px-5 py-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Move to Folder</p>
            
            <button 
              disabled={isUpdating}
              onClick={() => handleMove(null)}
              className={`w-full text-left px-5 py-3 text-sm transition-colors flex items-center justify-between ${currentFolderId === null ? 'bg-indigo-50/50 text-indigo-700 font-black' : 'text-gray-600 hover:bg-white/50 hover:text-indigo-600'}`}
            >
              <div className="flex items-center gap-3">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                 미분류
              </div>
              {currentFolderId === null && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>}
            </button>

            <div className="h-px bg-gray-100/50 my-2 mx-5"></div>

            <div className="max-h-48 overflow-y-auto">
              {folders.map(folder => (
                <button 
                  key={folder.id}
                  disabled={isUpdating}
                  onClick={() => handleMove(folder.id)}
                  className={`w-full text-left px-5 py-3 text-sm transition-colors flex items-center justify-between ${currentFolderId === folder.id ? 'bg-indigo-50 text-indigo-700 font-black' : 'text-gray-600 hover:bg-white/50 hover:text-indigo-600'}`}
                >
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    <span className="truncate pr-2">{folder.name}</span>
                  </div>
                  {currentFolderId === folder.id && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>}
                </button>
              ))}
            </div>

            {folders.length === 0 && (
              <p className="px-5 py-6 text-center text-[11px] font-bold text-gray-400 italic">No custom folders</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
