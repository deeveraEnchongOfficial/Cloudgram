'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { File, Image, Video, Music, FileText, Archive, Download, Trash2, Share2, MoreVertical, Loader2, Upload as UploadIcon, Play } from 'lucide-react';
import { useFileStore } from '@/stores/file-store';
import { useFolderStore } from '@/stores/folder-store';
import { useTransferStore } from '@/stores/transfer-store';
import { formatBytes, formatRelativeTime, truncateString } from '@/lib/utils/format';
import { getFileType, isPreviewable } from '@/lib/utils/file-types';
import { cn } from '@/lib/utils/cn';
import { CreateFolderModal } from '@/components/dashboard/create-folder-modal';
import { FilePreviewModal } from '@/components/dashboard/file-preview-modal';
import type { FileMetadata } from '@/types/file';
import { isImage, isVideo, isAudio } from '@/lib/utils/file-types';

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

const LONG_PRESS_MS = 500;

function useLongPress(onLongPress: () => void, onClick: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggeredRef = useRef(false);
  const didHandleRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const start = useCallback((e: React.PointerEvent) => {
    triggeredRef.current = false;
    didHandleRef.current = false;
    startPosRef.current = { x: e.clientX, y: e.clientY };
    timerRef.current = setTimeout(() => {
      triggeredRef.current = true;
      didHandleRef.current = true;
      onLongPress();
    }, LONG_PRESS_MS);
  }, [onLongPress]);

  const move = useCallback((e: React.PointerEvent) => {
    if (!timerRef.current) return;
    const dx = Math.abs(e.clientX - startPosRef.current.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y);
    if (dx > 10 || dy > 10) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const end = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!triggeredRef.current && !didHandleRef.current) {
      didHandleRef.current = true;
      onClick();
    }
  }, [onClick]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clickFallback = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!didHandleRef.current) {
      didHandleRef.current = true;
      if (!triggeredRef.current) {
        onClick();
      }
    }
  }, [onClick]);

  return {
    onPointerDown: start,
    onPointerMove: move,
    onPointerUp: end,
    onPointerLeave: cancel,
    onClick: clickFallback,
    style: { touchAction: 'manipulation' } as React.CSSProperties,
  };
}

interface FileItemProps {
  file: FileMetadata;
  selected: boolean;
  selectMode: boolean;
  folderId: string | null;
  onLongPressSelect: (id: number) => void;
  onSingleClick: (file: FileMetadata) => void;
  onContextMenu: (e: React.MouseEvent, fileId: number) => void;
  onDownload: (file: FileMetadata) => void;
  onDelete: (id: number) => void;
}

function FileGridItem({ file, selected, selectMode, folderId, onLongPressSelect, onSingleClick, onContextMenu, onDownload, onDelete }: FileItemProps) {
  const Icon = fileIcons[getFileType(file.mimeType, file.name)] ?? File;
  const longPressHandlers = useLongPress(
    () => onLongPressSelect(file.id),
    () => { if (selectMode) onLongPressSelect(file.id); else onSingleClick(file); }
  );

  return (
    <div
      {...longPressHandlers}
      onContextMenu={(e) => onContextMenu(e, file.id)}
      className={cn(
        'group relative flex flex-col items-center p-4 rounded-xl border cursor-pointer transition-colors select-none',
        selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
      )}
    >
      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-2 overflow-hidden">
        {isImage(file.mimeType, file.name) ? (
          <img
            src={`/api/files/${file.id}/preview?folderId=${folderId}`}
            alt={file.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <Icon className="w-6 h-6 text-muted-foreground" />
        )}
      </div>
      <p className="text-xs text-center truncate w-full" title={file.name}>
        {truncateString(file.name, 20)}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{formatBytes(file.size)}</p>
      <p className="text-xs text-muted-foreground">{formatRelativeTime(file.date)}</p>
      <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onDownload(file); }} className="p-1 rounded-lg hover:bg-background" title="Download">
          <Download className="w-3.5 h-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(file.id); }} className="p-1 rounded-lg hover:bg-background text-destructive" title="Delete">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function FileListItem({ file, selected, selectMode, folderId, onLongPressSelect, onSingleClick, onContextMenu, onDownload, onDelete }: FileItemProps) {
  const Icon = fileIcons[getFileType(file.mimeType, file.name)] ?? File;
  const longPressHandlers = useLongPress(
    () => onLongPressSelect(file.id),
    () => { if (selectMode) onLongPressSelect(file.id); else onSingleClick(file); }
  );

  return (
    <div
      {...longPressHandlers}
      onContextMenu={(e) => onContextMenu(e, file.id)}
      className={cn(
        'group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors select-none',
        selected ? 'bg-primary/5' : 'hover:bg-accent'
      )}
    >
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {isImage(file.mimeType, file.name) ? (
          <img
            src={`/api/files/${file.id}/preview?folderId=${folderId}`}
            alt={file.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <Icon className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      <span className="flex-1 text-sm truncate" title={file.name}>{file.name}</span>
      <span className="text-xs text-muted-foreground hidden sm:inline">{formatBytes(file.size)}</span>
      <span className="text-xs text-muted-foreground hidden md:inline">{formatRelativeTime(file.date)}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onDownload(file); }} className="p-1.5 rounded-lg hover:bg-background" title="Download">
          <Download className="w-4 h-4" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(file.id); }} className="p-1.5 rounded-lg hover:bg-background text-destructive" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function FileExplorer() {
  const queryClient = useQueryClient();
  const { currentFolderId, viewMode, selectedFiles, toggleSelect, clearSelection, sortBy, sortOrder, searchQuery, setFiles, uploadTrigger } = useFileStore();
  const { folders } = useFolderStore();
  const { addUpload, updateUpload, removeUpload, addDownload, updateDownload, removeDownload } = useTransferStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fileId: number | null }>({ x: 0, y: 0, fileId: null });
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

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
    mutationFn: async (files: File[]) => {
      const MAX_CONCURRENT = 3;
      const queue = [...files];
      const results: { success: boolean; data?: any; error?: string }[] = [];

      async function uploadOne(file: File): Promise<{ success: boolean; data?: any; error?: string }> {
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
        }).catch((err) => ({ success: false, error: err.message }));

        if (result.success) {
          updateUpload(uploadId, { progress: 100, status: 'done' });
          setTimeout(() => removeUpload(uploadId), 3000);
        } else {
          updateUpload(uploadId, { status: 'error', error: result.error });
        }

        return result;
      }

      async function worker() {
        while (queue.length > 0) {
          const file = queue.shift();
          if (!file) break;
          const result = await uploadOne(file);
          results.push(result);
        }
      }

      const workers = Array.from({ length: Math.min(MAX_CONCURRENT, files.length) }, () => worker());
      await Promise.all(workers);

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;
      if (failCount > 0 && successCount === 0) {
        throw new Error(`All ${failCount} uploads failed`);
      }

      return { successCount, failCount, total: results.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      if (data.failCount > 0) {
        toast.error(`${data.failCount} of ${data.total} uploads failed`);
      }
      if (data.successCount > 0) {
        toast.success(`${data.successCount} file${data.successCount > 1 ? 's' : ''} uploaded`);
      }
    },
    onError: (err: any) => toast.error(err.message ?? 'Upload failed'),
  });

  const files = searchQuery ? (searchResults.data ?? []) : (data ?? []);

  function handleUpload() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length > 0) {
      uploadMutation.mutate(selected);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      uploadMutation.mutate(droppedFiles);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  }

  function handleDownload(file: FileMetadata) {
    const downloadId = crypto.randomUUID();
    addDownload({ id: downloadId, name: file.name, size: file.size, progress: 0, status: 'downloading' });

    const xhr = new XMLHttpRequest();
    xhr.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100);
        updateDownload(downloadId, { progress });
      }
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        const blob = new Blob([xhr.response]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        updateDownload(downloadId, { progress: 100, status: 'done' });
        setTimeout(() => removeDownload(downloadId), 3000);
      } else {
        updateDownload(downloadId, { status: 'error', error: 'Download failed' });
      }
    };
    xhr.onerror = () => {
      updateDownload(downloadId, { status: 'error', error: 'Download failed' });
    };
    xhr.open('GET', `/api/files/${file.id}/download?folderId=${currentFolderId}`);
    xhr.responseType = 'blob';
    xhr.send();
  }

  function handleBulkDownload() {
    const ids = Array.from(selectedFiles);
    if (ids.length === 0) return;
    if (ids.length === 1) {
      const file = displayFiles.find((f) => f.id === ids[0]);
      if (file) handleDownload(file);
      clearSelection();
      return;
    }

    const downloadId = crypto.randomUUID();
    const totalSize = displayFiles
      .filter((f) => selectedFiles.has(f.id))
      .reduce((sum, f) => sum + f.size, 0);
    addDownload({ id: downloadId, name: `${ids.length} files (zip)`, size: totalSize, progress: 0, status: 'downloading' });

    const xhr = new XMLHttpRequest();
    xhr.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = Math.round((e.loaded / e.total) * 100);
        updateDownload(downloadId, { progress });
      }
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        const blob = new Blob([xhr.response]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cloudgram-download.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        updateDownload(downloadId, { progress: 100, status: 'done' });
        setTimeout(() => removeDownload(downloadId), 3000);
        toast.success(`Downloaded ${ids.length} files`);
      } else {
        updateDownload(downloadId, { status: 'error', error: 'Bulk download failed' });
        toast.error('Bulk download failed');
      }
      clearSelection();
    };
    xhr.onerror = () => {
      updateDownload(downloadId, { status: 'error', error: 'Bulk download failed' });
      toast.error('Bulk download failed');
      clearSelection();
    };
    xhr.open('POST', '/api/files/bulk/download');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.responseType = 'blob';
    xhr.send(JSON.stringify({ messageIds: ids, folderId: currentFolderId }));
  }

  function handlePreview(file: FileMetadata) {
    const idx = displayFiles.findIndex((f) => f.id === file.id);
    if (idx >= 0) setPreviewIndex(idx);
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
    <div
      className={cn('flex-1 p-4 relative', isDragOver && 'ring-2 ring-primary ring-inset rounded-lg')}
      onClick={() => setContextMenu({ x: 0, y: 0, fileId: null })}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <UploadIcon className="w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-semibold">Drop files to upload</p>
            <p className="text-sm text-muted-foreground">Multiple files supported</p>
          </div>
        </div>
      )}
      {selectedFiles.size > 0 && (
        <div className="mb-4 flex items-center gap-3 px-4 py-2 rounded-lg bg-muted">
          <span className="text-sm font-medium">{selectedFiles.size} selected</span>
          <button
            onClick={handleBulkDownload}
            className="text-sm font-medium text-primary hover:opacity-80 flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Download
          </button>
          <button onClick={() => { clearSelection(); setSelectMode(false); }} className="text-sm text-muted-foreground hover:text-foreground">Clear</button>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {displayFiles.map((file) => (
            <FileGridItem
              key={file.id}
              file={file}
              selected={selectedFiles.has(file.id)}
              selectMode={selectMode}
              folderId={currentFolderId}
              onLongPressSelect={(id) => { setSelectMode(true); toggleSelect(id); }}
              onSingleClick={handlePreview}
              onContextMenu={handleContextMenu}
              onDownload={handleDownload}
              onDelete={deleteMutation.mutate}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {displayFiles.map((file) => (
            <FileListItem
              key={file.id}
              file={file}
              selected={selectedFiles.has(file.id)}
              selectMode={selectMode}
              folderId={currentFolderId}
              onLongPressSelect={(id) => { setSelectMode(true); toggleSelect(id); }}
              onSingleClick={handlePreview}
              onContextMenu={handleContextMenu}
              onDownload={handleDownload}
              onDelete={deleteMutation.mutate}
            />
          ))}
        </div>
      )}

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />

      {contextMenu.fileId !== null && (
        <div
          className="fixed z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const ctxFile = displayFiles.find(f => f.id === contextMenu.fileId);
            const canPreview = ctxFile && (isImage(ctxFile.mimeType, ctxFile.name) || isVideo(ctxFile.mimeType, ctxFile.name) || isAudio(ctxFile.mimeType, ctxFile.name));
            return canPreview ? (
              <button
                onClick={() => { handlePreview(ctxFile!); setContextMenu({ x: 0, y: 0, fileId: null }); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
              >
                <Play className="w-4 h-4" /> Preview
              </button>
            ) : null;
          })()}
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

      {previewIndex !== null && displayFiles.length > 0 && (
        <FilePreviewModal
          files={displayFiles}
          index={previewIndex}
          folderId={currentFolderId}
          onClose={() => setPreviewIndex(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}
