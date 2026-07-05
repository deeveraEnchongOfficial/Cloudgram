'use client';

import { useState } from 'react';
import { useFolderStore } from '@/stores/folder-store';
import { useFileStore } from '@/stores/file-store';
import { Folder, FolderPlus, Settings, Share2, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { CreateFolderModal } from '@/components/dashboard/create-folder-modal';
import { CloudgramLogo } from '@/components/cloudgram-logo';

export function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen: boolean; setMobileOpen: (open: boolean) => void }) {
  const { folders, currentFolderId, setCurrentFolder } = useFolderStore();
  const setCurrentFolderFile = useFileStore((s) => s.setCurrentFolder);
  const [collapsed, setCollapsed] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed md:sticky top-0 left-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-200 flex flex-col',
          collapsed ? 'w-16' : 'w-60',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <CloudgramLogo className="w-8 h-8 text-primary shrink-0" />
              <span className="font-semibold text-sm">Cloudgram</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {!collapsed && (
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Folders
            </div>
          )}
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => {
                setCurrentFolder(folder.id);
                setCurrentFolderFile(folder.id);
                setMobileOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors',
                currentFolderId === folder.id && 'bg-accent text-accent-foreground font-medium',
                collapsed && 'justify-center'
              )}
              title={folder.name}
            >
              <Folder className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="truncate">{folder.name}</span>}
            </button>
          ))}
          {!collapsed && folders.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">No folders yet</p>
          )}
        </div>

        <div className="p-2 border-t border-sidebar-border space-y-1">
          <button
            onClick={() => setShowFolderModal(true)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors',
              collapsed && 'justify-center'
            )}
            title="New Folder"
          >
            <FolderPlus className="w-4 h-4 shrink-0" />
            {!collapsed && <span>New Folder</span>}
          </button>
          <a
            href="/shares"
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors',
              collapsed && 'justify-center'
            )}
            title="Shares"
          >
            <Share2 className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Shares</span>}
          </a>
          <a
            href="/settings"
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors',
              collapsed && 'justify-center'
            )}
            title="Settings"
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </a>
          <button
            onClick={() => {
              fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-destructive/10 text-destructive transition-colors',
              collapsed && 'justify-center'
            )}
            title="Logout"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
      <CreateFolderModal open={showFolderModal} onClose={() => setShowFolderModal(false)} />
    </>
  );
}
