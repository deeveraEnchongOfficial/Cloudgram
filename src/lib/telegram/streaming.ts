import { TelegramClient } from 'telegram';
import bigInt from 'big-integer';
import { getFileSize, getMimeType } from '@/lib/telegram/files';

export function parseRange(range: string | null, fileSize: number): { start: number; end: number } {
  if (!range) {
    return { start: 0, end: fileSize - 1 };
  }

  const match = range.match(/bytes=(\d*)-(\d*)/);
  if (!match) {
    return { start: 0, end: fileSize - 1 };
  }

  const start = match[1] ? parseInt(match[1]) : 0;
  const end = match[2] ? parseInt(match[2]) : fileSize - 1;

  return { start, end: Math.min(end, fileSize - 1) };
}

export async function createDownloadStream(
  client: TelegramClient,
  message: any,
  offset?: number,
  limit?: number
): Promise<ReadableStream<Uint8Array>> {
  const media = message.media;
  if (!media) throw new Error('No media in message');

  const fileSize = getFileSize(media);

  if (offset !== undefined && limit !== undefined) {
    const iter = client.iterDownload({
      file: media,
      offset: bigInt(offset),
      limit,
      requestSize: 512 * 1024,
      fileSize: bigInt(fileSize),
    });

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of iter) {
            controller.enqueue(new Uint8Array(chunk));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });
  }

  const buffer = await client.downloadMedia(message);
  if (!buffer) throw new Error('Download failed');

  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as unknown as ArrayBuffer);

  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(buf));
      controller.close();
    },
  });
}
