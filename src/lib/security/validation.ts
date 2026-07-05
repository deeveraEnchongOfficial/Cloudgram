import { z } from 'zod';

export const apiCredentialsSchema = z.object({
  apiId: z.number().int().positive(),
  apiHash: z.string().regex(/^[a-f0-9]{32}$/),
});

export const phoneSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[0-9]{7,15}$/),
});

export const signInSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[0-9]{7,15}$/),
  code: z.string().regex(/^[0-9]{4,8}$/),
  phoneCodeHash: z.string().min(1),
});

export const passwordSchema = z.object({
  password: z.string().min(1).max(200),
});

export const createShareSchema = z.object({
  messageId: z.number().int().positive(),
  folderId: z.string().optional(),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().nonnegative(),
  password: z.string().min(4).max(100).optional(),
  expiryHours: z.number().int().min(1).max(720).optional(),
});

export const proxySettingsSchema = z.object({
  enabled: z.boolean(),
  proxyType: z.enum(['socks5', 'mtproto']),
  host: z.string().min(1).max(255),
  port: z.number().int().min(1).max(65535),
  username: z.string().max(255).optional(),
  password: z.string().max(255).optional(),
  secret: z.string().max(255).optional(),
});

export const vpnSettingsSchema = z.object({
  vpnEnabled: z.boolean(),
  timeoutMultiplier: z.number().int().min(1).max(5),
  retryAttempts: z.number().int().min(0).max(5),
  retryBaseBackoffMs: z.number().int().min(500).max(5000),
  retryMaxBackoffMs: z.number().int().min(8000).max(60000),
  adaptivePolling: z.boolean(),
  pollingMinSec: z.number().int().min(10).max(30),
  pollingMaxSec: z.number().int().min(45).max(120),
  preferredDc: z.enum(['auto', 'dc1', 'dc2', 'dc3', 'dc4', 'dc5']),
  dcFallbackAttempts: z.number().int().min(1).max(4),
  floodWaitRespect: z.boolean(),
  peerCacheSize: z.number().int().min(100).max(2000),
  bandwidthLimitUpKbs: z.number().int().min(0),
  bandwidthLimitDownKbs: z.number().int().min(0),
  chunkSizeKb: z.number().int().min(64).max(512),
  keepAliveIntervalSec: z.number().int().min(0).max(120),
  autoDetectVpn: z.boolean(),
});

export const uiSettingsSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']),
  viewMode: z.enum(['grid', 'list']),
  sortBy: z.enum(['date', 'name', 'size']),
  sortOrder: z.enum(['asc', 'desc']),
});

export const fileListQuerySchema = z.object({
  folderId: z.string().optional(),
  cursor: z.coerce.number().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sortBy: z.enum(['date', 'name', 'size']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(255),
  folderId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const bulkOperationSchema = z.object({
  operation: z.enum(['delete', 'move']),
  messageIds: z.array(z.number().int().positive()).min(1).max(100),
  targetFolderId: z.string().optional(),
});

export const createFolderSchema = z.object({
  folderName: z.string().min(1).max(100),
});

export const moveFilesSchema = z.object({
  messageIds: z.array(z.number().int().positive()).min(1).max(100),
});

export const sharePasswordSchema = z.object({
  password: z.string().min(1).max(100),
});
