import { mongoCache } from '@/lib/cache/mongo';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { CACHE_TTL } from '@/lib/constants';

export async function initProgress(uploadId: string, fileName: string, total: number) {
  await mongoCache.collection('cache_progress').updateOne(
    { _id: CACHE_KEYS.uploadProgress(uploadId) as any },
    {
      $set: {
        uploadId,
        fileName,
        total,
        progress: 0,
        transferred: 0,
        status: 'uploading',
        expiresAt: new Date(Date.now() + CACHE_TTL.PROGRESS * 1000),
      },
    },
    { upsert: true }
  );
}

export async function updateProgress(uploadId: string, transferred: number, total: number) {
  const progress = total > 0 ? Math.round((transferred / total) * 100) : 0;
  await mongoCache.collection('cache_progress').updateOne(
    { _id: CACHE_KEYS.uploadProgress(uploadId) as any },
    { $set: { progress, transferred, total } }
  );
}

export async function completeProgress(uploadId: string, success: boolean) {
  await mongoCache.collection('cache_progress').updateOne(
    { _id: CACHE_KEYS.uploadProgress(uploadId) as any },
    { $set: { status: success ? 'done' : 'error', progress: success ? 100 : 0 } }
  );
}

export async function initDownloadProgress(downloadId: string, fileName: string, total: number) {
  await mongoCache.collection('cache_progress').updateOne(
    { _id: CACHE_KEYS.downloadProgress(downloadId) as any },
    {
      $set: {
        downloadId,
        fileName,
        total,
        progress: 0,
        transferred: 0,
        status: 'downloading',
        expiresAt: new Date(Date.now() + CACHE_TTL.PROGRESS * 1000),
      },
    },
    { upsert: true }
  );
}

export async function updateDownloadProgress(downloadId: string, transferred: number, total: number) {
  const progress = total > 0 ? Math.round((transferred / total) * 100) : 0;
  await mongoCache.collection('cache_progress').updateOne(
    { _id: CACHE_KEYS.downloadProgress(downloadId) as any },
    { $set: { progress, transferred, total } }
  );
}

export async function completeDownloadProgress(downloadId: string, success: boolean) {
  await mongoCache.collection('cache_progress').updateOne(
    { _id: CACHE_KEYS.downloadProgress(downloadId) as any },
    { $set: { status: success ? 'done' : 'error', progress: success ? 100 : 0 } }
  );
}
