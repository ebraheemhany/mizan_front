// app/[locale]/(pages)/(dashboard)/employees/page.tsx
import { setRequestLocale } from 'next-intl/server';
import EmployeesView from '@/component/dashbord/employees/EmployeesView';

export default async function EmployeesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <EmployeesView />;
}
