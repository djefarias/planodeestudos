import AppShellWrapper from '@/components/app-shell-wrapper';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShellWrapper userName="Jefferson" userEmail="dje.reis.17@gmail.com">{children}</AppShellWrapper>;
}
