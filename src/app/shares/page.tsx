'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Share2, Trash2, Copy, ExternalLink } from 'lucide-react';
import { formatBytes, formatRelativeTime } from '@/lib/utils/format';

export default function SharesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['shares'],
    queryFn: async () => {
      const res = await fetch('/api/shares');
      const json = await res.json();
      return json;
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (shareId: string) => {
      const res = await fetch(`/api/shares/${shareId}`, { method: 'DELETE' });
      return res.json();
    },
    onSuccess: () => {
      toast.success('Share revoked');
      queryClient.invalidateQueries({ queryKey: ['shares'] });
    },
  });

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard');
  };

  const shares = data?.data ?? [];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Share2 className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Shared Files</h1>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : shares.length === 0 ? (
        <div className="text-center py-12">
          <Share2 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No shared files yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {shares.map((share: any) => (
            <div key={share.id} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{share.fileName}</p>
                <p className="text-sm text-muted-foreground">{formatBytes(share.fileSize)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs text-muted-foreground truncate">{share.link}</code>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{share.downloadCount} downloads</span>
                  <span>Created {formatRelativeTime(share.createdAt)}</span>
                  {share.expiresAt && <span>Expires {formatRelativeTime(share.expiresAt)}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => copyLink(share.link)} className="p-2 rounded-lg hover:bg-accent" title="Copy link">
                  <Copy className="w-4 h-4" />
                </button>
                <a href={share.link} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-accent" title="Open">
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button onClick={() => revokeMutation.mutate(share.id)} className="p-2 rounded-lg hover:bg-accent text-destructive" title="Revoke">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
