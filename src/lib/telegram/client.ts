import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { prisma } from '@/lib/db/prisma';
import { mongoCache } from '@/lib/cache/mongo';
import { decrypt } from '@/lib/security/crypto';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { CACHE_TTL } from '@/lib/constants';

const globalForClients = globalThis as unknown as {
  __clients?: Map<string, TelegramClient>;
  __connecting?: Map<string, Promise<TelegramClient>>;
};
if (!globalForClients.__clients) {
  globalForClients.__clients = new Map<string, TelegramClient>();
}
if (!globalForClients.__connecting) {
  globalForClients.__connecting = new Map<string, Promise<TelegramClient>>();
}
const globalClientMap = globalForClients.__clients;
const connectingMap = globalForClients.__connecting;

async function getProxyConfig(userId: string) {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  if (!settings?.proxyEnabled) return undefined;

  if (settings.proxyType === 'socks5') {
    return {
      socksType: 5 as const,
      ip: settings.proxyHost,
      port: settings.proxyPort,
      username: settings.proxyUsername || undefined,
      password: settings.proxyPassword || undefined,
    };
  }
  return undefined;
}

async function isClientHealthy(client: TelegramClient): Promise<boolean> {
  try {
    return client.connected ?? false;
  } catch {
    return false;
  }
}

export async function getClient(userId: string): Promise<TelegramClient> {
  const existing = globalClientMap.get(userId);
  if (existing && (await isClientHealthy(existing))) {
    return existing;
  }

  const inProgress = connectingMap.get(userId);
  if (inProgress) return inProgress;

  const connectPromise = (async () => {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.sessionString) throw new Error('No session found');

      const decryptedSession = decrypt(user.sessionString);

      const session = new StringSession(decryptedSession);
      const client = new TelegramClient(session, user.apiId, user.apiHash, {
        connectionRetries: 3,
        proxy: await getProxyConfig(userId),
      });

      await client.connect();
      globalClientMap.set(userId, client);

      await mongoCache.set(
        'cache_sessions',
        CACHE_KEYS.session(userId),
        decryptedSession,
        CACHE_TTL.SESSION
      );

      return client;
    } finally {
      connectingMap.delete(userId);
    }
  })();

  connectingMap.set(userId, connectPromise);
  return connectPromise;
}

export function disconnectClient(userId: string): void {
  const client = globalClientMap.get(userId);
  if (client) {
    client.disconnect();
    globalClientMap.delete(userId);
  }
}

export async function createTempClient(
  apiId: number,
  apiHash: string,
  sessionString?: string
): Promise<TelegramClient> {
  const session = new StringSession(sessionString ?? '');
  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 3,
  });
  await client.connect();
  return client;
}

export function getSessionString(client: TelegramClient): string {
  return (client.session as StringSession).save();
}
