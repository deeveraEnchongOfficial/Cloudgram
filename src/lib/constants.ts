export const APP_NAME = process.env.APP_NAME ?? 'Cloudgram';
export const APP_VERSION = '1.0.0';

export const TELEGRAM_FOLDER_PREFIX = process.env.TELEGRAM_FOLDER_PREFIX ?? '[td]';

export const JWT_ACCESS_TTL = 15 * 60; // 15 minutes
export const JWT_REFRESH_TTL = 7 * 24 * 60 * 60; // 7 days

export const SHARE_TOKEN_LENGTH = 32;
export const SHARE_SESSION_TTL = 30 * 60; // 30 minutes

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

export const RATE_LIMIT_DEFAULT = 100;
export const RATE_LIMIT_WINDOW_SEC = 60;

export const BANDWIDTH_DAILY_LIMIT = 268435456000; // 250 GB

export const CACHE_TTL = {
  SESSION: 300, // 5 minutes
  AUTH_STATE: 600, // 10 minutes
  RATE_LIMIT: 60, // 60 seconds
  PROGRESS: 3600, // 1 hour
  SHARE_SESSION: 1800, // 30 minutes
  PEER: 3600, // 1 hour
} as const;
