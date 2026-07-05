import { prisma } from '@/lib/db/prisma';
import { encrypt, decrypt } from '@/lib/security/crypto';

export async function getUserSettings(userId: string) {
  return prisma.userSettings.findUnique({ where: { userId } });
}

export async function getOrCreateUserSettings(userId: string) {
  let settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!settings) {
    settings = await prisma.userSettings.create({ data: { userId } });
  }
  return settings;
}

export async function updateNetworkSettings(userId: string, data: {
  proxyEnabled?: boolean;
  proxyType?: string;
  proxyHost?: string;
  proxyPort?: number;
  proxyUsername?: string;
  proxyPassword?: string;
  proxySecret?: string;
  vpnEnabled?: boolean;
  timeoutMultiplier?: number;
  retryAttempts?: number;
  retryBaseBackoffMs?: number;
  retryMaxBackoffMs?: number;
  adaptivePolling?: boolean;
  pollingMinSec?: number;
  pollingMaxSec?: number;
  preferredDc?: string;
  dcFallbackAttempts?: number;
  floodWaitRespect?: boolean;
  peerCacheSize?: number;
  bandwidthLimitUpKbs?: number;
  bandwidthLimitDownKbs?: number;
  chunkSizeKb?: number;
  keepAliveIntervalSec?: number;
  autoDetectVpn?: boolean;
}) {
  const encryptedData: any = { ...data };
  if (data.proxyPassword) {
    encryptedData.proxyPassword = encrypt(data.proxyPassword);
  }
  if (data.proxySecret) {
    encryptedData.proxySecret = encrypt(data.proxySecret);
  }

  return prisma.userSettings.upsert({
    where: { userId },
    create: { userId, ...encryptedData },
    update: encryptedData,
  });
}

export async function updateUiSettings(userId: string, data: {
  theme?: string;
  viewMode?: string;
  sortBy?: string;
  sortOrder?: string;
}) {
  return prisma.userSettings.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}

export async function getDecryptedProxyConfig(userId: string) {
  const settings = await getUserSettings(userId);
  if (!settings?.proxyEnabled) return null;

  let proxyPassword = settings.proxyPassword;
  let proxySecret = settings.proxySecret;

  if (proxyPassword) {
    try {
      proxyPassword = decrypt(proxyPassword);
    } catch { /* ignore */ }
  }
  if (proxySecret) {
    try {
      proxySecret = decrypt(proxySecret);
    } catch { /* ignore */ }
  }

  return {
    proxyEnabled: settings.proxyEnabled,
    proxyType: settings.proxyType,
    proxyHost: settings.proxyHost,
    proxyPort: settings.proxyPort,
    proxyUsername: settings.proxyUsername,
    proxyPassword,
    proxySecret,
  };
}
