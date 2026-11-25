// app/[locale]/(pages)/(dashboard)/admin/page.tsx
// Platform admin (Mizan's own staff, PLATFORM_ADMIN_EMAILS on the backend).
import { setRequestLocale } from 'next-intl/server';

import AdminView from '@/component/admin/AdminView';

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  return <AdminView />;
}
