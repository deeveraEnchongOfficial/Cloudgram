import { prisma } from '@/lib/db/prisma';
import { encrypt } from '@/lib/security/crypto';

export async function createOrUpdateUser(data: {
  telegramId: number;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  apiId: number;
  apiHash: string;
  sessionString: string;
}) {
  const encryptedApiHash = encrypt(data.apiHash);
  const encryptedSession = encrypt(data.sessionString);

  return prisma.user.upsert({
    where: { telegramId: data.telegramId },
    create: {
      telegramId: data.telegramId,
      phoneNumber: data.phoneNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      apiId: data.apiId,
      apiHash: encryptedApiHash,
      sessionString: encryptedSession,
    },
    update: {
      phoneNumber: data.phoneNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      username: data.username,
      apiId: data.apiId,
      apiHash: encryptedApiHash,
      sessionString: encryptedSession,
    },
  });
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({ where: { id: userId } });
}

export async function getUserByTelegramId(telegramId: number) {
  return prisma.user.findUnique({ where: { telegramId } });
}

export async function clearUserSession(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { sessionString: '' },
  });
}
