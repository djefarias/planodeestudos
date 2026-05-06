import AppShellWrapper from '@/components/app-shell-wrapper';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShellWrapper userName="Jefferson">{children}</AppShellWrapper>;
}
