'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Download, Loader2, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { FileMetadata } from '@/types/file';
import { getFileType, isImage, isVideo, isAudio } from '@/lib/utils/file-types';
import { formatBytes } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

interface FilePreviewModalProps {
  files: FileMetadata[];
  index: number;
  folderId: string | null;
  onClose: () => void;
  onDownload: (file: FileMetadata) => void;
}

export function FilePreviewModal({ files, index, folderId, onClose, onDownload }: FilePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(index);
  const [loading, setLoading] = useState(true);
  const file = files[currentIndex];

  const url = folderId
    ? `/api/files/${file.id}/download?folderId=${folderId}`
    : `/api/files/${file.id}/download`;

  const goNext = useCallback(() => {
    setLoading(true);
    setCurrentIndex((i) => (i + 1) % files.length);
  }, [files.length]);

  const goPrev = useCallback(() => {
    setLoading(true);
    setCurrentIndex((i) => (i - 1 + files.length) % files.length);
  }, [files.length]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    }
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, goNext, goPrev]);

  const type = getFileType(file.mimeType, file.name);
  const canPreview = isImage(file.mimeType, file.name) || isVideo(file.mimeType, file.name) || isAudio(file.mimeType, file.name);

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl max-h-[90vh] w-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 text-white">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-white/60">{formatBytes(file.size)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onDownload(file)}
              className="p-2 rounded-lg hover:bg-white/10 text-white"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-white"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center overflow-hidden px-4 pb-4">
          {files.length > 1 && (
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10 touch-manipulation"
              title="Previous"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          <div className="max-w-full max-h-full flex items-center justify-center">
            {loading && (
              <Loader2 className="w-10 h-10 animate-spin text-white/60" />
            )}

            {canPreview && type === 'image' && (
              <img
                src={url}
                alt={file.name}
                className={cn('max-w-full max-h-[75vh] object-contain rounded-lg', loading && 'hidden')}
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
              />
            )}

            {canPreview && type === 'video' && (
              <video
                key={file.id}
                src={url}
                controls
                autoPlay
                className="max-w-full max-h-[75vh] rounded-lg"
                onLoadedData={() => setLoading(false)}
                onError={() => setLoading(false)}
              />
            )}

            {canPreview && type === 'audio' && (
              <div className="flex flex-col items-center gap-6">
                <div className="w-32 h-32 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Play className="w-12 h-12 text-white/80" />
                </div>
                <audio
                  key={file.id}
                  src={url}
                  controls
                  autoPlay
                  onLoadedData={() => setLoading(false)}
                  onError={() => setLoading(false)}
                />
              </div>
            )}

            {!canPreview && (
              <div className="flex flex-col items-center gap-4 text-white/70">
                <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center">
                  <X className="w-10 h-10" />
                </div>
                <p className="text-sm">Preview not available for this file type</p>
                <button
                  onClick={() => onDownload(file)}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download to view
                </button>
              </div>
            )}
          </div>

          {files.length > 1 && (
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-10 touch-manipulation"
              title="Next"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Footer counter */}
        {files.length > 1 && (
          <div className="text-center pb-2">
            <span className="text-xs text-white/50">
              {currentIndex + 1} / {files.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
