'use client';

import { useTransferStore } from '@/stores/transfer-store';
import { formatBytes } from '@/lib/utils/format';
import { CheckCircle2, XCircle, Loader2, X, Download } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function DownloadProgress() {
  const { downloads, removeDownload } = useTransferStore();

  if (downloads.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 space-y-2">
      {downloads.map((download) => (
        <div
          key={download.id}
          className="rounded-lg border border-border bg-background shadow-lg p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              {download.status === 'downloading' && (
                <Loader2 className="w-4 h-4 shrink-0 animate-spin text-primary" />
              )}
              {download.status === 'done' && (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />
              )}
              {download.status === 'error' && (
                <XCircle className="w-4 h-4 shrink-0 text-destructive" />
              )}
              <span className="text-sm font-medium truncate">{download.name}</span>
            </div>
            <button
              onClick={() => removeDownload(download.id)}
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
                  download.status === 'error' ? 'bg-destructive' : 'bg-primary'
                )}
                style={{ width: `${download.progress}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums w-9 text-right">
              {download.progress}%
            </span>
          </div>

          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Download className="w-3 h-3" />
              {formatBytes(download.size)}
            </span>
            {download.status === 'error' && (
              <span className="text-xs text-destructive">{download.error}</span>
            )}
            {download.status === 'done' && (
              <span className="text-xs text-green-500">Downloaded</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
