// component/dashbord/reports/useReportMoney.ts
import { useFormatter } from 'next-intl';

// TODO: نستبدلها بـ useMoney() لما أشوف الملف بتاعه
export function useReportMoney() {
  const format = useFormatter();
  return (value: number) =>
    format.number(value, {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
      numberingSystem: 'latn',
    });
}