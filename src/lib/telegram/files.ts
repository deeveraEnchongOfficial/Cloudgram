import { TelegramClient, Api } from 'telegram';
import { CustomFile } from 'telegram/client/uploads';
import bigInt from 'big-integer';
import type { FileMetadata } from '@/types/file';

export async function uploadFile(
  client: TelegramClient,
  channelPeer: any,
  file: { name: string; buffer: Buffer; mimeType: string },
  onProgress?: (progress: number) => void
) {
  const wrappedProgress = onProgress
    ? ((progress: number) => onProgress(Math.round(progress * 100))) as any
    : undefined;

  const result = await client.sendFile(channelPeer, {
    file: new CustomFile(file.name, file.buffer.length, '', file.buffer),
    forceDocument: true,
    attributes: [],
    progressCallback: wrappedProgress,
  });
  return result;
}

export async function listFiles(
  client: TelegramClient,
  channelPeer: any,
  limit: number = 100,
  offsetId?: number
): Promise<FileMetadata[]> {
  const messages = await client.getMessages(channelPeer, {
    limit,
    offsetId,
  });
  return messages.map(mapMessageToFileMetadata).filter(Boolean) as FileMetadata[];
}

export async function downloadFile(
  client: TelegramClient,
  channelPeer: any,
  messageId: number,
  onProgress?: (downloaded: number, total: number) => void
) {
  const messages = await client.getMessages(channelPeer, { ids: messageId });
  const message = messages[0];
  if (!message?.media) throw new Error('No media in message');

  const wrappedProgress = onProgress
    ? (downloaded: bigInt.BigInteger, total: bigInt.BigInteger) =>
        onProgress(downloaded.toJSNumber(), total.toJSNumber())
    : undefined;

  const downloadStream = await client.downloadMedia(message, {
    progressCallback: wrappedProgress,
  });
  return downloadStream;
}

export async function deleteFiles(
  client: TelegramClient,
  channelPeer: any,
  messageIds: number[]
) {
  await client.deleteMessages(channelPeer, messageIds, { revoke: true });
}

export async function moveFile(
  client: TelegramClient,
  fromPeer: any,
  toPeer: any,
  messageId: number
) {
  const forwarded = await client.forwardMessages(toPeer, {
    fromPeer,
    messages: [messageId],
  });
  await client.deleteMessages(fromPeer, [messageId], { revoke: true });
  return forwarded;
}

export function mapMessageToFileMetadata(message: any): FileMetadata | null {
  if (!message?.media) return null;

  const media = message.media;
  let name = 'Unknown';
  let size = 0;
  let mimeType = 'application/octet-stream';

  if (media.document) {
    const doc = media.document;
    size = parseInt(doc.size?.toString() || '0');
    mimeType = doc.mimeType || 'application/octet-stream';

    const fileNameAttr = doc.attributes?.find(
      (a: any) => a.className === 'DocumentAttributeFilename'
    );
    if (fileNameAttr?.fileName) {
      name = fileNameAttr.fileName;
    } else {
      const ext = mimeType.split('/').pop();
      name = `file_${message.id}.${ext}`;
    }
  } else if (media.photo) {
    name = `photo_${message.id}.jpg`;
    mimeType = 'image/jpeg';
    size = 0;
  } else {
    return null;
  }

  return {
    id: message.id,
    name,
    size,
    mimeType,
    date: new Date(message.date * 1000),
    messageId: message.id,
  };
}

export function getFileSize(media: any): number {
  if (media?.document) {
    return parseInt(media.document.size?.toString() || '0');
  }
  return 0;
}

export function getMimeType(media: any): string {
  if (media?.document) {
    return media.document.mimeType || 'application/octet-stream';
  }
  if (media?.photo) {
    return 'image/jpeg';
  }
  return 'application/octet-stream';
}
