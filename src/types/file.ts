export interface FileMetadata {
  id: number;
  name: string;
  size: number;
  mimeType: string;
  date: Date;
  thumbnail?: string | null;
  messageId: number;
}

export interface FolderInfo {
  id: string;
  name: string;
  channelId: string;
  accessHash: string;
  channelUsername?: string | null;
  parentId?: string | null;
}

export interface UploadItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

export interface DownloadItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'downloading' | 'done' | 'error';
  error?: string;
}

export interface ShareInfo {
  id: string;
  token: string;
  fileName: string;
  fileSize: number;
  mimeType?: string | null;
  expiresAt?: Date | null;
  downloadCount: number;
  createdAt: Date;
  link: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    cursor: number | null;
    limit: number;
    hasMore: boolean;
  };
}
