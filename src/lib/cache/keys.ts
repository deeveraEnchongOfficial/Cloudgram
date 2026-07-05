export const CACHE_KEYS = {
  session: (userId: string) => `tg:client:${userId}`,
  peer: (userId: string, folderId: string) => `tg:peer:${userId}:${folderId}`,
  authState: (sessionId: string) => `tg:auth:${sessionId}`,
  rateLimit: (userId: string, action: string) => `tg:rl:${userId}:${action}`,
  uploadProgress: (uploadId: string) => `tg:up:${uploadId}`,
  downloadProgress: (downloadId: string) => `tg:dl:${downloadId}`,
  shareSession: (token: string) => `tg:share:${token}`,
};
