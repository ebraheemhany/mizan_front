// lib/print.ts

// Chrome وFirefox بيستخدموا عنوان الصفحة كاسم افتراضي للملف في "حفظ كـ PDF"
export function printWithTitle(title: string) {
  const previous = document.title;

  const restore = () => {
    document.title = previous;
    window.removeEventListener('afterprint', restore);
  };

  window.addEventListener('afterprint', restore);
  document.title = title;
  window.print();
}