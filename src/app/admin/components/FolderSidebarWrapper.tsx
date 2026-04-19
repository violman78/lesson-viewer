"use client";

import { useRouter } from 'next/navigation';
import FolderSidebar from './FolderSidebar';

interface FolderSidebarWrapperProps {
  selectedFolderId: string | null;
}

export default function FolderSidebarWrapper({ selectedFolderId }: FolderSidebarWrapperProps) {
  const router = useRouter();
  
  const handleSelectFolder = (folderId: string | null) => {
    if (folderId) {
      router.push(`/admin?folderId=${folderId}`);
    } else {
      router.push('/admin');
    }
  };

  return <FolderSidebar selectedFolderId={selectedFolderId} onSelectFolder={handleSelectFolder} />;
}
