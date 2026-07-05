import { NextRequest } from 'next/server';
import { getShareByToken, verifySharePassword, isShareValid, incrementShareDownloadCount } from '@/lib/db/queries/shares';
import { getClient } from '@/lib/telegram/client';
import { resolvePeer } from '@/lib/telegram/folders';
import { getFileSize, getMimeType } from '@/lib/telegram/files';
import { createDownloadStream, parseRange } from '@/lib/telegram/streaming';
import { sharePasswordSchema } from '@/lib/security/validation';
import { mongoCache } from '@/lib/cache/mongo';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { CACHE_TTL, SHARE_SESSION_TTL } from '@/lib/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const share = await getShareByToken(token);

    if (!share || !isShareValid(share)) {
      return Response.json({ success: false, error: 'Share not found or expired' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download') === 'true';

    if (share.passwordHash) {
      const sessionToken = request.headers.get('x-share-session');
      if (sessionToken) {
        const valid = await mongoCache.get('cache_share_session', CACHE_KEYS.shareSession(token));
        if (!valid) {
          return Response.json({ success: false, error: 'Password required', needsPassword: true }, { status: 403 });
        }
      } else {
        return Response.json({
          success: false,
          error: 'Password required',
          needsPassword: true,
          data: { fileName: share.fileName, fileSize: share.fileSize },
        }, { status: 403 });
      }
    }

    if (!download) {
      return Response.json({
        success: true,
        data: {
          fileName: share.fileName,
          fileSize: share.fileSize,
          mimeType: share.mimeType,
        },
      });
    }

    const user = await import('@/lib/db/prisma').then(m => m.prisma.user.findUnique({ where: { id: share.userId } }));
    if (!user) {
      return Response.json({ success: false, error: 'Owner not found' }, { status: 404 });
    }

    const client = await getClient(share.userId);
    const peer = await resolvePeer(client, share.userId, share.folderMappingId ?? '');
    const messages = await client.getMessages(peer, { ids: share.messageId });
    const message = messages[0];

    if (!message?.media) {
      return Response.json({ success: false, error: 'File not found' }, { status: 404 });
    }

    const fileSize = getFileSize(message.media);
    const mimeType = getMimeType(message.media);
    const range = request.headers.get('range');
    const { start, end } = parseRange(range, fileSize);

    const stream = await createDownloadStream(
      client,
      message,
      range ? start : undefined,
      range ? end - start + 1 : undefined
    );

    await incrementShareDownloadCount(token);

    const headers = new Headers({
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
      'Content-Length': (end - start + 1).toString(),
      'Cache-Control': 'private, max-age=3600',
    });

    if (range) {
      headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      return new Response(stream, { status: 206, headers });
    }

    return new Response(stream, { status: 200, headers });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message ?? 'Download failed' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const share = await getShareByToken(token);

    if (!share || !isShareValid(share)) {
      return Response.json({ success: false, error: 'Share not found or expired' }, { status: 404 });
    }

    if (!share.passwordHash) {
      return Response.json({ success: true });
    }

    const body = await request.json();
    const validated = sharePasswordSchema.parse(body);

    const valid = await verifySharePassword(share, validated.password);
    if (!valid) {
      return Response.json({ success: false, error: 'Invalid password' }, { status: 403 });
    }

    await mongoCache.set('cache_share_session', CACHE_KEYS.shareSession(token), true, SHARE_SESSION_TTL);

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({ success: false, error: err.message ?? 'Verification failed' }, { status: 500 });
  }
}
