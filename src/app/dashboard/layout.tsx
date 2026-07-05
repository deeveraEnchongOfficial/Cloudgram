'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { FileExplorer } from '@/components/dashboard/file-explorer';
import { UploadProgress } from '@/components/dashboard/upload-progress';
import { DownloadProgress } from '@/components/dashboard/download-progress';
import { useFolderStore } from '@/stores/folder-store';
import { useFileStore } from '@/stores/file-store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { setFolders, setCurrentFolder } = useFolderStore();
  const setCurrentFolderFile = useFileStore((s) => s.setCurrentFolder);

  useEffect(() => {
    async function loadFolders() {
      try {
        const res = await fetch('/api/folders');
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          const folders = data.data.map((f: any) => ({
            id: f.id,
            name: f.folderName,
            channelId: f.channelId,
            accessHash: f.accessHash,
            channelUsername: f.channelUsername,
          }));
          setFolders(folders);
          setCurrentFolder(folders[0].id);
          setCurrentFolderFile(folders[0].id);
        }
      } catch {
        // ignore
      }
    }
    loadFolders();
  }, [setFolders, setCurrentFolder]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          onMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <UploadProgress />
      <DownloadProgress />
    </div>
  );
}
