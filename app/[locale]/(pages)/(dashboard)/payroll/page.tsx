// app/[locale]/(pages)/(dashboard)/payroll/page.tsx
import { setRequestLocale } from 'next-intl/server';
import PayrollView from '@/component/dashbord/payroll/PayrollView';

export default async function PayrollPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PayrollView />;
}
