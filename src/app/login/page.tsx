import { AuthWizard } from '@/components/auth/auth-wizard';

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 min-h-screen">
      <AuthWizard />
    </div>
  );
}
