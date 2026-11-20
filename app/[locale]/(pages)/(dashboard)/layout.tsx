// app/[locale]/(pages)/(dashboard)/layout.tsx
import { setRequestLocale } from 'next-intl/server';
import AppSidebar from '@/component/dashbord/AppSidebar';
import MobileHeader from '@/component/dashbord/MobileHeader';
import TopBar from '@/component/dashbord/TopBar';
import { SessionProvider } from '@/lib/auth/session';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Static rendering: the locale comes from the URL, not from reading the request.
  setRequestLocale((await params).locale);
  return (
    // Loads the logged-in user first; sends visitors without a session to /login.
    <SessionProvider>
      <div className="bg-canvas min-h-dvh lg:flex">
        <AppSidebar />
        <div className="min-w-0 flex-1">
          <MobileHeader />
          <TopBar />
          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
