import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';
import AppShellWrapper from '@/components/app-shell-wrapper';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  const userName = session?.user?.name ?? 'Usuário';
  const userEmail = session?.user?.email ?? '';
  return <AppShellWrapper userName={userName} userEmail={userEmail}>{children}</AppShellWrapper>;
}
