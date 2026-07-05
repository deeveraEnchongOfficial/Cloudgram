'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Lock, Download, Loader2, FileIcon } from 'lucide-react';
import { formatBytes } from '@/lib/utils/format';

export default function ShareViewPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['share', token, authed],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (authed) headers['x-share-session'] = 'true';
      const res = await fetch(`/api/shares/by-token/${token}`, { headers });
      const json = await res.json();
      if (json.needsPassword && !authed) {
        return { needsPassword: true, ...json.data };
      }
      return json;
    },
  });

  async function handlePassword() {
    setLoading(true);
    try {
      const res = await fetch(`/api/shares/by-token/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (json.success) {
        setAuthed(true);
      } else {
        alert(json.error ?? 'Invalid password');
      }
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (data?.needsPassword && !authed) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold">Password Required</h1>
            <p className="text-sm text-muted-foreground mt-1">This shared file is password protected</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-input outline-none focus:ring-2 focus:ring-ring"
            placeholder="Enter password"
          />
          <button
            onClick={handlePassword}
            disabled={loading || !password}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Unlock'}
          </button>
        </div>
      </div>
    );
  }

  const share = data?.data;

  return (
    <div className="flex-1 flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <FileIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-lg font-bold truncate max-w-full">{share?.fileName ?? 'Shared File'}</h1>
          <p className="text-sm text-muted-foreground">{formatBytes(share?.fileSize ?? 0)}</p>
        </div>
        <a
          href={`/api/shares/by-token/${token}?download=true`}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90"
        >
          <Download className="w-4 h-4" /> Download
        </a>
      </div>
    </div>
  );
}
