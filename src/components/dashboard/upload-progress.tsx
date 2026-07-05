'use client';

import { useTransferStore } from '@/stores/transfer-store';
import { formatBytes } from '@/lib/utils/format';
import { CheckCircle2, XCircle, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function UploadProgress() {
  const { uploads, removeUpload } = useTransferStore();

  if (uploads.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 space-y-2">
      {uploads.map((upload) => (
        <div
          key={upload.id}
          className="rounded-lg border border-border bg-background shadow-lg p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {upload.status === 'uploading' && (
                <Loader2 className="w-4 h-4 shrink-0 animate-spin text-primary" />
              )}
              {upload.status === 'done' && (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />
              )}
              {upload.status === 'error' && (
                <XCircle className="w-4 h-4 shrink-0 text-destructive" />
              )}
              <span className="text-sm font-medium truncate">{upload.name}</span>
            </div>
            <button
              onClick={() => removeUpload(upload.id)}
              className="p-0.5 rounded hover:bg-accent text-muted-foreground shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  upload.status === 'error' ? 'bg-destructive' : 'bg-primary'
                )}
                style={{ width: `${upload.progress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums w-9 text-right">
              {upload.progress}%
            </span>
          </div>

          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-muted-foreground">
              {formatBytes(upload.size)}
            </span>
            {upload.status === 'error' && (
              <span className="text-xs text-destructive">{upload.error}</span>
            )}
            {upload.status === 'done' && (
              <span className="text-xs text-green-500">Uploaded</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
