export interface TelegramSession {
  userId: string;
  telegramId: number;
  sessionString: string;
}

export interface TelegramPeer {
  channelId: number;
  accessHash: string;
  username?: string | null;
}
