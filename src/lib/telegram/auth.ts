import { TelegramClient } from 'telegram';
import { Api } from 'telegram';

export async function requestCode(
  client: TelegramClient,
  phone: string
): Promise<{ phoneCodeHash: string }> {
  const result = await client.sendCode({
    apiId: client.apiId,
    apiHash: client.apiHash,
  }, phone);
  return { phoneCodeHash: result.phoneCodeHash };
}

export async function signInWithCode(
  client: TelegramClient,
  phone: string,
  code: string,
  phoneCodeHash: string
): Promise<{ success: boolean; needsPassword?: boolean; user?: any }> {
  try {
    const result = await client.signInUser(
      { apiId: client.apiId, apiHash: client.apiHash },
      {
        phoneNumber: phone,
        phoneCode: async () => code,
        onError: (err: Error) => {
          throw err;
        },
      }
    );
    return { success: true, user: result };
  } catch (err: any) {
    if (err.errorMessage === 'SESSION_PASSWORD_NEEDED' || err.message?.includes('SESSION_PASSWORD_NEEDED')) {
      return { success: false, needsPassword: true };
    }
    throw err;
  }
}

export async function checkPassword(
  client: TelegramClient,
  password: string
): Promise<{ success: boolean; user?: any }> {
  const result = await client.signInWithPassword(
    { apiId: client.apiId, apiHash: client.apiHash },
    {
      password: async () => password,
      onError: (err: Error) => {
        throw err;
      },
    }
  );
  return { success: true, user: result };
}

export async function startQrLogin(
  client: TelegramClient
): Promise<{ token: Buffer; qrPromise: Promise<any> }> {
  let resolveToken: (token: Buffer) => void;
  const tokenPromise = new Promise<Buffer>((resolve) => {
    resolveToken = resolve;
  });

  const qrPromise = client.signInUserWithQrCode(
    { apiId: client.apiId, apiHash: client.apiHash },
    {
      qrCode: async (qrCode: { token: Buffer; expires: number }) => {
        resolveToken(qrCode.token);
      },
      password: async () => {
        throw new Error('SESSION_PASSWORD_NEEDED');
      },
      onError: (err: Error) => {
        throw err;
      },
    }
  );

  const token = await tokenPromise;
  return { token, qrPromise };
}

export async function pollQrLogin(
  qrPromise: Promise<any>
): Promise<{ success: boolean; needsPassword?: boolean; pending?: boolean; user?: any }> {
  try {
    const user = await Promise.race([
      qrPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PENDING')), 3000)
      ),
    ]);
    return { success: true, user };
  } catch (err: any) {
    if (err.message === 'SESSION_PASSWORD_NEEDED') {
      return { success: false, needsPassword: true };
    }
    if (err.message === 'PENDING') {
      return { success: false, pending: true };
    }
    return { success: false, pending: true };
  }
}

export async function logout(client: TelegramClient): Promise<void> {
  try {
    await client.invoke(new Api.auth.LogOut());
  } catch {
    // Ignore logout errors
  }
  await client.disconnect();
}
