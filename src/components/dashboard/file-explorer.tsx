'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { File, Image, Video, Music, FileText, Archive, Download, Trash2, Share2, MoreVertical, Loader2, Upload as UploadIcon } from 'lucide-react';
import { useFileStore } from '@/stores/file-store';
import { useFolderStore } from '@/stores/folder-store';
import { useTransferStore } from '@/stores/transfer-store';
import { formatBytes, formatRelativeTime, truncateString } from '@/lib/utils/format';
import { getFileType, isPreviewable } from '@/lib/utils/file-types';
import { cn } from '@/lib/utils/cn';
import { CreateFolderModal } from '@/components/dashboard/create-folder-modal';
import type { FileMetadata } from '@/types/file';

const fileIcons: Record<string, typeof File> = {
  image: Image,
  video: Video,
  audio: Music,
  pdf: FileText,
  document: FileText,
  archive: Archive,
  text: FileText,
  spreadsheet: FileText,
  presentation: FileText,
  code: FileText,
  other: File,
};

export function FileExplorer() {
  const queryClient = useQueryClient();
  const { currentFolderId, viewMode, selectedFiles, toggleSelect, clearSelection, sortBy, sortOrder, searchQuery, setFiles, uploadTrigger } = useFileStore();
  const { folders } = useFolderStore();
  const { addUpload, updateUpload, removeUpload } = useTransferStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId: number | null }>({ x: 0, y: 0, fileId: null });
  const [showFolderModal, setShowFolderModal] = useState(false);

  useEffect(() => {
    if (uploadTrigger > 0 && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [uploadTrigger]);

  const { data, isLoading } = useQuery({
    queryKey: ['files', currentFolderId, sortBy, sortOrder],
    queryFn: async () => {
      if (!currentFolderId) return [];
      const params = new URLSearchParams({ folderId: currentFolderId, sortBy, sortOrder, limit: '100' });
      const res = await fetch(`/api/files?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as FileMetadata[];
    },
    enabled: !!currentFolderId,
  });

  const searchResults = useQuery({
    queryKey: ['search', searchQuery, currentFolderId],
    queryFn: async () => {
      if (!searchQuery) return [];
      const params = new URLSearchParams({ q: searchQuery });
      if (currentFolderId) params.set('folderId', currentFolderId);
      const res = await fetch(`/api/files/search?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as FileMetadata[];
    },
    enabled: !!searchQuery,
  });

  const deleteMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await fetch(`/api/files/${messageId}?folderId=${currentFolderId}`, { method: 'DELETE' });
      return res.json();
    },
    onSuccess: () => {
      toast.success('File deleted');
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: () => toast.error('Failed to delete file'),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const uploadId = crypto.randomUUID();
      addUpload({ id: uploadId, name: file.name, size: file.size, progress: 0, status: 'uploading' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderId', currentFolderId ?? '');
      formData.append('uploadId', uploadId);

      const result = await new Promise<{ success: boolean; data?: any; error?: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            updateUpload(uploadId, { progress, status: 'uploading' });
          }
        };
        xhr.onload = () => {
          try {
            const json = JSON.parse(xhr.responseText);
            resolve(json);
          } catch {
            reject(new Error('Invalid response'));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.open('POST', '/api/files');
        xhr.send(formData);
      });

      if (result.success) {
        updateUpload(uploadId, { progress: 100, status: 'done' });
        setTimeout(() => removeUpload(uploadId), 3000);
      } else {
        updateUpload(uploadId, { status: 'error', error: result.error });
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
    onError: (err: any) => toast.error(err.message ?? 'Upload failed'),
  });

  const files = searchQuery ? (searchResults.data ?? []) : (data ?? []);

  function handleUpload() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(e.target.files ?? []);
    for (const file of selectedFiles) {
      uploadMutation.mutate(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDownload(file: FileMetadata) {
    window.open(`/api/files/${file.id}/download?folderId=${currentFolderId}`, '_blank');
  }

  function handleContextMenu(e: React.MouseEvent, fileId: number | null) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, fileId });
  }

  const displayFiles = searchQuery
    ? (searchResults.data ?? [])
    : files;

  if (!currentFolderId && folders.length === 0) {
    return (
      <>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <UploadIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Welcome to Cloudgram</h3>
          <p className="text-muted-foreground text-sm mb-4">Create a folder to start uploading files</p>
          <button
            onClick={() => setShowFolderModal(true)}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 flex items-center gap-2"
          >
            Create First Folder
          </button>
        </div>
        <CreateFolderModal open={showFolderModal} onClose={() => setShowFolderModal(false)} />
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (displayFiles.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <File className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-1">No files yet</h3>
        <p className="text-muted-foreground text-sm mb-4">Upload your first file to get started</p>
        <button onClick={handleUpload} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          Upload File
        </button>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
      </div>
    );
  }

  return (
    <div className="flex-1 p-4" onClick={() => setContextMenu({ x: 0, y: 0, fileId: null })}>
      {selectedFiles.size > 0 && (
        <div className="mb-4 flex items-center gap-3 px-4 py-2 rounded-lg bg-muted">
          <span className="text-sm font-medium">{selectedFiles.size} selected</span>
          <button onClick={clearSelection} className="text-sm text-muted-foreground hover:text-foreground">Clear</button>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {displayFiles.map((file) => {
            const Icon = fileIcons[getFileType(file.mimeType, file.name)] ?? File;
            const selected = selectedFiles.has(file.id);
            return (
              <div
                key={file.id}
                onClick={() => toggleSelect(file.id)}
                onContextMenu={(e) => handleContextMenu(e, file.id)}
                className={cn(
                  'group relative flex flex-col items-center p-4 rounded-xl border cursor-pointer transition-colors',
                  selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
                )}
              >
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-2">
                  <Icon className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-xs text-center truncate w-full" title={file.name}>
                  {truncateString(file.name, 20)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatBytes(file.size)}</p>
                <p className="text-xs text-muted-foreground">{formatRelativeTime(file.date)}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1">
          {displayFiles.map((file) => {
            const Icon = fileIcons[getFileType(file.mimeType, file.name)] ?? File;
            const selected = selectedFiles.has(file.id);
            return (
              <div
                key={file.id}
                onClick={() => toggleSelect(file.id)}
                onContextMenu={(e) => handleContextMenu(e, file.id)}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                  selected ? 'bg-primary/5' : 'hover:bg-accent'
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="flex-1 text-sm truncate" title={file.name}>{file.name}</span>
                <span className="text-xs text-muted-foreground hidden sm:inline">{formatBytes(file.size)}</span>
                <span className="text-xs text-muted-foreground hidden md:inline">{formatRelativeTime(file.date)}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); handleDownload(file); }} className="p-1.5 rounded-lg hover:bg-background">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(file.id); }} className="p-1.5 rounded-lg hover:bg-background text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />

      {contextMenu.fileId !== null && (
        <div
          className="fixed z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { handleDownload(displayFiles.find(f => f.id === contextMenu.fileId)!); setContextMenu({ x: 0, y: 0, fileId: null }); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
          >
            <Download className="w-4 h-4" /> Download
          </button>
          <button
            onClick={() => { setContextMenu({ x: 0, y: 0, fileId: null }); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button
            onClick={() => { deleteMutation.mutate(contextMenu.fileId!); setContextMenu({ x: 0, y: 0, fileId: null }); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-destructive"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
