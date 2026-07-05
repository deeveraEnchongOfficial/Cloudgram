export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthConnectRequest {
  apiId: number;
  apiHash: string;
}

export interface AuthCodeRequest {
  phoneNumber: string;
}

export interface AuthSignInRequest {
  phoneNumber: string;
  code: string;
  phoneCodeHash: string;
}

export interface AuthPasswordRequest {
  password: string;
}

export interface AuthSession {
  userId: string;
  telegramId: number;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export interface CreateShareRequest {
  messageId: number;
  folderId?: string;
  fileName: string;
  fileSize: number;
  password?: string;
  expiryHours?: number;
}

export interface ProxySettings {
  enabled: boolean;
  proxyType: 'socks5' | 'mtproto';
  host: string;
  port: number;
  username?: string;
  password?: string;
  secret?: string;
}
