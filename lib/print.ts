// lib/print.ts
import { printPage } from '@/lib/desktop';

// Chrome وFirefox بيستخدموا عنوان الصفحة كاسم افتراضي للملف في "حفظ كـ PDF"
export function printWithTitle(title: string) {
  const previous = document.title;

  const restore = () => {
    document.title = previous;
    window.removeEventListener('afterprint', restore);
  };

  window.addEventListener('afterprint', restore);
  document.title = title;
  printPage();
}
