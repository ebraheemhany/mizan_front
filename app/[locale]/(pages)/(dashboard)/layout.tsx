// app/[locale]/(pages)/(dashboard)/layout.tsx
import AppSidebar from '@/component/dashbord/AppSidebar';
import { AppDataProvider } from '@/component/dashbord/AppDataProvider';
import MobileHeader from '@/component/dashbord/MobileHeader';
import TopBar from '@/component/dashbord/TopBar';
import { SessionProvider } from '@/lib/auth/session';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Loads the logged-in user first; sends visitors without a session to /login.
    <SessionProvider>
      <AppDataProvider>
        <div className="bg-canvas min-h-dvh lg:flex">
          <AppSidebar />
          <div className="min-w-0 flex-1">
            <MobileHeader />
            <TopBar />
            <main className="p-4 sm:p-6 lg:p-8">{children}</main>
          </div>
        </div>
      </AppDataProvider>
    </SessionProvider>
  );
}
