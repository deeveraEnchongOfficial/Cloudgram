import { prisma } from '@/lib/db/prisma';
import { generateToken, generateSalt } from '@/lib/security/crypto';
import bcrypt from 'bcryptjs';
import { SHARE_TOKEN_LENGTH } from '@/lib/constants';

export async function createShare(data: {
  userId: string;
  folderMappingId?: string;
  messageId: number;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  password?: string;
  expiryHours?: number;
}) {
  const token = generateToken(SHARE_TOKEN_LENGTH);

  let passwordHash: string | null = null;
  let passwordSalt: string | null = null;

  if (data.password) {
    passwordSalt = generateSalt(16);
    passwordHash = await bcrypt.hash(data.password + passwordSalt, 10);
  }

  const expiresAt = data.expiryHours
    ? new Date(Date.now() + data.expiryHours * 3600 * 1000)
    : null;

  return prisma.share.create({
    data: {
      token,
      userId: data.userId,
      folderMappingId: data.folderMappingId,
      messageId: data.messageId,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      passwordHash,
      passwordSalt,
      expiresAt,
    },
  });
}

export async function getShareByToken(token: string) {
  return prisma.share.findUnique({ where: { token } });
}

export async function listSharesByUser(userId: string) {
  return prisma.share.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function revokeShare(shareId: string, userId: string) {
  return prisma.share.updateMany({
    where: { id: shareId, userId },
    data: { revoked: true },
  });
}

export async function verifySharePassword(share: { passwordHash: string | null; passwordSalt: string | null }, password: string): Promise<boolean> {
  if (!share.passwordHash) return true;
  return bcrypt.compare(password + (share.passwordSalt ?? ''), share.passwordHash);
}

export async function incrementShareDownloadCount(token: string) {
  return prisma.share.update({
    where: { token },
    data: {
      downloadCount: { increment: 1 },
      lastDownloadedAt: new Date(),
    },
  });
}

export function isShareValid(share: { revoked: boolean; expiresAt: Date | null }): boolean {
  if (share.revoked) return false;
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) return false;
  return true;
}
