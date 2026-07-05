'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { Settings as SettingsIcon, Network, Palette, Gauge } from 'lucide-react';

export default function SettingsPage() {
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [proxyType, setProxyType] = useState('socks5');
  const [proxyHost, setProxyHost] = useState('');
  const [proxyPort, setProxyPort] = useState(1080);
  const [theme, setTheme] = useState('dark');
  const [viewMode, setViewMode] = useState('grid');

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      const json = await res.json();
      if (json.success) {
        setProxyEnabled(json.data.proxyEnabled);
        setProxyType(json.data.proxyType);
        setProxyHost(json.data.proxyHost);
        setProxyPort(json.data.proxyPort);
        setTheme(json.data.theme);
        setViewMode(json.data.viewMode);
      }
      return json;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (data: { section: string; [key: string]: any }) => {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => toast.success('Settings updated'),
    onError: () => toast.error('Failed to update settings'),
  });

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Proxy</h2>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={proxyEnabled} onChange={(e) => setProxyEnabled(e.target.checked)} />
          <span>Enable proxy</span>
        </label>
        {proxyEnabled && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Type</label>
              <select value={proxyType} onChange={(e) => setProxyType(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-input">
                <option value="socks5">SOCKS5</option>
                <option value="mtproto">MTProto</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Host</label>
              <input value={proxyHost} onChange={(e) => setProxyHost(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-input" />
            </div>
            <div>
              <label className="text-sm font-medium">Port</label>
              <input type="number" value={proxyPort} onChange={(e) => setProxyPort(parseInt(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-input" />
            </div>
          </div>
        )}
        <button
          onClick={() => updateSettings.mutate({ section: 'proxy', enabled: proxyEnabled, proxyType, host: proxyHost, port: proxyPort })}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          Save Proxy
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Appearance</h2>
        </div>
        <div>
          <label className="text-sm font-medium">Theme</label>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-input">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Default View</label>
          <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-input">
            <option value="grid">Grid</option>
            <option value="list">List</option>
          </select>
        </div>
        <button
          onClick={() => updateSettings.mutate({ section: 'ui', theme, viewMode, sortBy: 'date', sortOrder: 'desc' })}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          Save Appearance
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Gauge className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Bandwidth</h2>
        </div>
        <BandwidthStats />
      </div>
    </div>
  );
}

function BandwidthStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['bandwidth'],
    queryFn: async () => {
      const res = await fetch('/api/bandwidth');
      const json = await res.json();
      return json;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (!data?.success) return null;

  const { today } = data.data;
  const formatB = (b: number) => {
    if (b === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(b) / Math.log(k));
    return `${parseFloat((b / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Upload today</span>
        <span className="font-medium">{formatB(today.upBytes)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Download today</span>
        <span className="font-medium">{formatB(today.downBytes)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Daily limit</span>
        <span className="font-medium">{formatB(today.dailyLimitBytes)}</span>
      </div>
    </div>
  );
}
