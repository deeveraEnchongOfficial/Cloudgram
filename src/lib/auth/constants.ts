export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'td_access',
  REFRESH_TOKEN: 'td_refresh',
  SHARE_SESSION: 'td_share',
} as const;

export const JWT_SECRETS = {
  access: process.env.JWT_SECRET,
  refresh: process.env.JWT_REFRESH_SECRET,
} as const;
