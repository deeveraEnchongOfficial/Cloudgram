import type { UserSettings } from '@prisma/client';

export function getConnectTimeout(settings: Pick<UserSettings, 'vpnEnabled' | 'timeoutMultiplier'>): number {
  return settings.vpnEnabled ? 5 * settings.timeoutMultiplier : 5;
}

export function getRetryAttempts(settings: Pick<UserSettings, 'vpnEnabled' | 'retryAttempts'>): number {
  return settings.vpnEnabled ? settings.retryAttempts : 0;
}

export function getBackoffMs(attempt: number, baseMs: number, maxMs: number): number {
  const exp = baseMs * Math.pow(2, Math.min(attempt, 10));
  const capped = Math.min(exp, maxMs);
  const jitter = Math.floor(capped * 0.25 * Math.random());
  return capped + jitter;
}

export function getPollingInterval(settings: Pick<UserSettings, 'adaptivePolling' | 'pollingMinSec' | 'pollingMaxSec'>): number {
  if (!settings.adaptivePolling) return settings.pollingMinSec * 1000;
  return Math.floor((settings.pollingMinSec + settings.pollingMaxSec) / 2) * 1000;
}
