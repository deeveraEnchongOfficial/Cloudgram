import { TelegramClient, Api } from 'telegram';
import bigInt from 'big-integer';
import { prisma } from '@/lib/db/prisma';
import { TELEGRAM_FOLDER_PREFIX } from '@/lib/constants';
import type { FolderInfo } from '@/types/file';

export async function createFolder(
  client: TelegramClient,
  folderName: string
): Promise<FolderInfo> {
  const channelName = `${TELEGRAM_FOLDER_PREFIX} ${folderName}`;
  const result = await client.invoke(
    new Api.channels.CreateChannel({
      title: channelName,
      about: 'Cloudgram folder',
      megagroup: false,
      broadcast: true,
    })
  );

  const resultAny = result as any;
  const channel = resultAny.updates?.chats?.[0] ?? resultAny.chats?.[0] ?? resultAny.user;
  if (!channel) throw new Error('Failed to create channel: no channel in response');

  const channelId = channel.id?.toString?.() ?? String(channel.id);
  const accessHash = channel.accessHash?.toString?.() ?? '';

  return {
    id: '',
    name: folderName,
    channelId,
    accessHash,
    channelUsername: channel.username ?? null,
  };
}

export async function listFolders(client: TelegramClient): Promise<FolderInfo[]> {
  const dialogs = await client.getDialogs({});
  return dialogs
    .filter((d: any) => d.isChannel && d.title?.startsWith?.(TELEGRAM_FOLDER_PREFIX))
    .map((d: any) => {
      const id = d.entity?.id ?? d.id;
      const channelId = id?.toString?.() ?? String(id);
      const accessHash = d.entity?.accessHash?.toString?.() ?? '';
      return {
        id: '',
        name: d.title.replace(TELEGRAM_FOLDER_PREFIX, '').trim(),
        channelId,
        accessHash,
        channelUsername: d.entity?.username ?? null,
      };
    });
}

export async function resolvePeer(
  client: TelegramClient,
  userId: string,
  folderId: string
): Promise<any> {
  const folder = await prisma.folderMapping.findFirst({
    where: { userId, id: folderId },
  });

  if (!folder) throw new Error('Folder not found');

  return new Api.InputPeerChannel({
    channelId: bigInt(folder.channelId),
    accessHash: bigInt(folder.accessHash),
  });
}

export async function resolvePeerByChannelId(
  client: TelegramClient,
  channelId: string,
  accessHash: string
): Promise<any> {
  return new Api.InputPeerChannel({
    channelId: bigInt(channelId),
    accessHash: bigInt(accessHash),
  });
}

export function mapDialogToFolder(dialog: any): FolderInfo {
  return {
    id: '',
    name: dialog.title.replace(TELEGRAM_FOLDER_PREFIX, '').trim(),
    channelId: dialog.id,
    accessHash: dialog.entity?.accessHash?.toString() ?? '',
    channelUsername: dialog.entity?.username ?? null,
  };
}
