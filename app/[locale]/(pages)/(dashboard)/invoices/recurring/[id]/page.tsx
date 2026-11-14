// app/[locale]/(pages)/(dashboard)/invoices/recurring/[id]/page.tsx
import { redirect } from '@/i18n/navigation';

// TODO: مفيش صفحة تفاصيل للفاتورة المتكررة لسه، فبنحوّل على التعديل
export default async function RecurringDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  redirect({ href: `/invoices/recurring/${id}/edit`, locale });
}
