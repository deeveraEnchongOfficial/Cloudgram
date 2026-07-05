import { NextRequest } from 'next/server';
import { ZipArchive } from 'archiver';
import { requireSession } from '@/lib/auth/session';
import { getClient } from '@/lib/telegram/client';
import { resolvePeer } from '@/lib/telegram/folders';
import { getMimeType } from '@/lib/telegram/files';
import { trackDownloadBytes } from '@/lib/db/queries/bandwidth';

export async function POST(request: NextRequest) {
  try {
    const session = requireSession(request);
    const body = await request.json();
    const { messageIds, folderId } = body as { messageIds: number[]; folderId?: string };

    if (!messageIds?.length) {
      return Response.json({ success: false, error: 'No file IDs provided' }, { status: 400 });
    }
    if (!folderId) {
      return Response.json({ success: false, error: 'Missing folderId' }, { status: 400 });
    }

    const client = await getClient(session.userId);
    const peer = await resolvePeer(client, session.userId, folderId);

    const messages = await client.getMessages(peer, { ids: messageIds });
    const validMessages = messages.filter((m: any) => m?.media);
    if (validMessages.length === 0) {
      return Response.json({ success: false, error: 'No files found' }, { status: 404 });
    }

    const archive = new ZipArchive({ zlib: { level: 5 } });
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        archive.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
        archive.on('end', () => controller.close());
        archive.on('error', (err: Error) => controller.error(err));
      },
    });

    const usedNames = new Set<string>();
    function uniqueName(name: string): string {
      if (!usedNames.has(name)) {
        usedNames.add(name);
        return name;
      }
      const dot = name.lastIndexOf('.');
      const base = dot > 0 ? name.slice(0, dot) : name;
      const ext = dot > 0 ? name.slice(dot) : '';
      let i = 1;
      let candidate: string;
      do {
        candidate = `${base} (${i})${ext}`;
        i++;
      } while (usedNames.has(candidate));
      usedNames.add(candidate);
      return candidate;
    }

    let totalBytes = 0;

    (async () => {
      for (const message of validMessages) {
        const media = message.media as any;
        const mimeType = getMimeType(media);

        let name = 'Unknown';
        if (media?.document) {
          const fileNameAttr = media.document.attributes?.find(
            (a: any) => a.className === 'DocumentAttributeFilename'
          );
          if (fileNameAttr?.fileName) {
            name = fileNameAttr.fileName;
          } else {
            const ext = mimeType.split('/').pop();
            name = `file_${message.id}.${ext}`;
          }
        } else if (media?.photo) {
          name = `photo_${message.id}.jpg`;
        }

        const buffer = await client.downloadMedia(message);
        if (buffer) {
          const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as unknown as ArrayBuffer);
          totalBytes += buf.length;
          archive.append(buf, { name: uniqueName(name) });
        }
      }
      await trackDownloadBytes(session.userId, totalBytes);
      archive.finalize();
    })().catch(() => {
      (archive as any).destroy();
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="cloudgram-download.zip"',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: err.message ?? 'Bulk download failed' }, { status: 500 });
  }
}
