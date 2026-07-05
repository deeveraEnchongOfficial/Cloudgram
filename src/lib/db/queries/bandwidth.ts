import { prisma } from '@/lib/db/prisma';
import { BANDWIDTH_DAILY_LIMIT } from '@/lib/constants';

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export async function getOrCreateTodayStat(userId: string) {
  const date = getTodayStr();
  let stat = await prisma.bandwidthStat.findFirst({
    where: { userId, date },
  });
  if (!stat) {
    stat = await prisma.bandwidthStat.create({
      data: { userId, date, dailyLimitBytes: BANDWIDTH_DAILY_LIMIT },
    });
  }
  return stat;
}

export async function trackUploadBytes(userId: string, bytes: number) {
  const date = getTodayStr();
  const existing = await prisma.bandwidthStat.findFirst({ where: { userId, date } });
  if (existing) {
    await prisma.bandwidthStat.update({
      where: { id: existing.id },
      data: { upBytes: { increment: bytes } },
    });
  } else {
    await prisma.bandwidthStat.create({
      data: { userId, date, upBytes: bytes, dailyLimitBytes: BANDWIDTH_DAILY_LIMIT },
    });
  }
}

export async function trackDownloadBytes(userId: string, bytes: number) {
  const date = getTodayStr();
  const existing = await prisma.bandwidthStat.findFirst({ where: { userId, date } });
  if (existing) {
    await prisma.bandwidthStat.update({
      where: { id: existing.id },
      data: { downBytes: { increment: bytes } },
    });
  } else {
    await prisma.bandwidthStat.create({
      data: { userId, date, downBytes: bytes, dailyLimitBytes: BANDWIDTH_DAILY_LIMIT },
    });
  }
}

export async function getBandwidthStats(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  return prisma.bandwidthStat.findMany({
    where: {
      userId,
      date: { gte: startDateStr },
    },
    orderBy: { date: 'desc' },
  });
}

export async function getTodayBandwidth(userId: string) {
  return getOrCreateTodayStat(userId);
}
