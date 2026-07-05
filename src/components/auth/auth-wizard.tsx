'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, Phone, KeyRound, Lock, ArrowLeft, ArrowRight, QrCode } from 'lucide-react';
import { CloudgramLogo } from '@/components/cloudgram-logo';

type Step = 'credentials' | 'phone' | 'code' | 'password' | 'qr';

export function AuthWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('credentials');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrPolling, setQrPolling] = useState(false);

  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState('');
  const [password, setPassword] = useState('');

  async function handleConnect() {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiId: parseInt(apiId), apiHash }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSessionId(data.data.sessionId);
      setStep('phone');
    } catch (err: any) {
      toast.error(err.message ?? 'Connection failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleSendCode() {
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/code?sessionId=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setPhoneCodeHash(data.data.phoneCodeHash);
      setStep('code');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send code');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignIn() {
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/sign-in?sessionId=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, code, phoneCodeHash }),
      });
      const data = await res.json();
      if (data.needsPassword) {
        setStep('password');
        return;
      }
      if (!data.success) throw new Error(data.error);
      toast.success('Signed in successfully');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message ?? 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  async function handlePassword() {
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/password?sessionId=${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success('Signed in successfully');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message ?? 'Password verification failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleQrStart() {
    if (!apiId || !apiHash) {
      toast.error('Please enter your API ID and API Hash first');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiId: parseInt(apiId), apiHash }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSessionId(data.data.sessionId);

      const qrRes = await fetch(`/api/auth/qr/start?sessionId=${data.data.sessionId}`, {
        method: 'POST',
      });
      const qrData = await qrRes.json();
      if (!qrData.success) throw new Error(qrData.error);
      setQrToken(qrData.data.token);
      setStep('qr');
      pollQr(data.data.sessionId);
    } catch (err: any) {
      toast.error(err.message ?? 'QR login failed');
    } finally {
      setLoading(false);
    }
  }

  async function pollQr(sid: string) {
    setQrPolling(true);
    const poll = async () => {
      try {
        const res = await fetch(`/api/auth/qr/poll?sessionId=${sid}`, {
          method: 'POST',
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Signed in successfully');
          router.push('/dashboard');
          return;
        }
        if (data.needsPassword) {
          setStep('password');
          return;
        }
        if (data.pending) {
          setTimeout(poll, 2000);
        }
      } catch {
        setTimeout(poll, 3000);
      }
    };
    poll();
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex flex-col items-center mb-8">
        <CloudgramLogo className="w-16 h-16 text-primary mb-4" />
        <h1 className="text-2xl font-bold">Cloudgram</h1>
        <p className="text-muted-foreground text-sm mt-1">Cloud storage powered by Telegram</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        {step === 'credentials' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">API Credentials</h2>
            <p className="text-sm text-muted-foreground">
              Get your API credentials from{' '}
              <a href="https://my.telegram.org/auth" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                my.telegram.org
              </a>
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">API ID</label>
                <input
                  type="number"
                  value={apiId}
                  onChange={(e) => setApiId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-input focus:ring-2 focus:ring-ring outline-none"
                  placeholder="1234567"
                />
              </div>
              <div>
                <label className="text-sm font-medium">API Hash</label>
                <input
                  type="text"
                  value={apiHash}
                  onChange={(e) => setApiHash(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-input focus:ring-2 focus:ring-ring outline-none font-mono text-sm"
                  placeholder="abcdef1234567890abcdef1234567890"
                />
              </div>
            </div>
            <button
              onClick={handleConnect}
              disabled={loading || !apiId || !apiHash}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Connect <ArrowRight className="w-4 h-4" /></>}
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>
            <button
              onClick={handleQrStart}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-secondary text-secondary-foreground font-medium hover:opacity-90 flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" /> Login with QR Code
            </button>
          </div>
        )}

        {step === 'phone' && (
          <div className="space-y-4">
            <button onClick={() => setStep('credentials')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h2 className="text-lg font-semibold">Phone Number</h2>
            <div>
              <label className="text-sm font-medium">Enter your phone number</label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-lg bg-background border border-input focus:ring-2 focus:ring-ring outline-none"
                  placeholder="+1234567890"
                />
              </div>
            </div>
            <button
              onClick={handleSendCode}
              disabled={loading || !phone}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send Code <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}

        {step === 'code' && (
          <div className="space-y-4">
            <button onClick={() => setStep('phone')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h2 className="text-lg font-semibold">Verification Code</h2>
            <p className="text-sm text-muted-foreground">Enter the code sent to {phone}</p>
            <div>
              <label className="text-sm font-medium">Code</label>
              <div className="relative mt-1">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-lg bg-background border border-input focus:ring-2 focus:ring-ring outline-none text-center text-lg tracking-widest"
                  placeholder="12345"
                  maxLength={8}
                />
              </div>
            </div>
            <button
              onClick={handleSignIn}
              disabled={loading || !code}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
            </button>
          </div>
        )}

        {step === 'password' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
            <p className="text-sm text-muted-foreground">Enter your cloud password</p>
            <div>
              <label className="text-sm font-medium">Password</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 rounded-lg bg-background border border-input focus:ring-2 focus:ring-ring outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              onClick={handlePassword}
              disabled={loading || !password}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
            </button>
          </div>
        )}

        {step === 'qr' && qrToken && (
          <div className="space-y-4 flex flex-col items-center">
            <h2 className="text-lg font-semibold">Scan QR Code</h2>
            <p className="text-sm text-muted-foreground text-center">
              Open Telegram on your phone, go to Settings → Devices → Scan QR
            </p>
            <div className="p-4 bg-white rounded-xl">
              <QRCodeSVG value={`tg://login?token=${qrToken}`} size={200} />
            </div>
            {qrPolling && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Waiting for scan...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
