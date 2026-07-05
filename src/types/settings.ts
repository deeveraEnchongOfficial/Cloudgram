export type ThemeMode = 'dark' | 'light' | 'system';
export type ViewMode = 'grid' | 'list';
export type SortBy = 'date' | 'name' | 'size';
export type SortOrder = 'asc' | 'desc';

export interface NetworkSettings {
  proxyEnabled: boolean;
  proxyType: 'socks5' | 'mtproto';
  proxyHost: string;
  proxyPort: number;
  proxyUsername: string;
  proxyPassword: string;
  proxySecret: string;

  vpnEnabled: boolean;
  timeoutMultiplier: number;
  retryAttempts: number;
  retryBaseBackoffMs: number;
  retryMaxBackoffMs: number;
  adaptivePolling: boolean;
  pollingMinSec: number;
  pollingMaxSec: number;
  preferredDc: string;
  dcFallbackAttempts: number;
  floodWaitRespect: boolean;
  peerCacheSize: number;
  bandwidthLimitUpKbs: number;
  bandwidthLimitDownKbs: number;
  chunkSizeKb: number;
  keepAliveIntervalSec: number;
  autoDetectVpn: boolean;
}

export interface UiSettings {
  theme: ThemeMode;
  viewMode: ViewMode;
  sortBy: SortBy;
  sortOrder: SortOrder;
}

export interface UserSettingsData extends NetworkSettings, UiSettings {}
