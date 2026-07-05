import { NextRequest } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { getOrCreateUserSettings, updateNetworkSettings, updateUiSettings } from '@/lib/db/queries/settings';
import { proxySettingsSchema, vpnSettingsSchema, uiSettingsSchema } from '@/lib/security/validation';

export async function GET(request: NextRequest) {
  try {
    const session = requireSession(request);
    const settings = await getOrCreateUserSettings(session.userId);
    return Response.json({ success: true, data: settings });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: err.message ?? 'Failed to get settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = requireSession(request);
    const body = await request.json();
    const { section, ...data } = body;

    if (section === 'proxy') {
      const validated = proxySettingsSchema.parse(data);
      await updateNetworkSettings(session.userId, {
        proxyEnabled: validated.enabled,
        proxyType: validated.proxyType,
        proxyHost: validated.host,
        proxyPort: validated.port,
        proxyUsername: validated.username ?? '',
        proxyPassword: validated.password ?? '',
        proxySecret: validated.secret ?? '',
      });
    } else if (section === 'vpn') {
      const validated = vpnSettingsSchema.parse(data);
      await updateNetworkSettings(session.userId, validated);
    } else if (section === 'ui') {
      const validated = uiSettingsSchema.parse(data);
      await updateUiSettings(session.userId, validated);
    } else {
      return Response.json({ success: false, error: 'Invalid settings section' }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (err: any) {
    if (err instanceof Response) return err;
    return Response.json({ success: false, error: err.message ?? 'Failed to update settings' }, { status: 500 });
  }
}
