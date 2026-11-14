// app/[locale]/(pages)/(dashboard)/tasks/page.tsx
import TasksView from '@/component/dashbord/tasks/TasksView';
import { setRequestLocale } from 'next-intl/server';

export default async function TasksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <TasksView />;
}
