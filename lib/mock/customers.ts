// lib/mock/customers.ts
export type CustomerStatus = 'active' | 'overdue' | 'inactive';
export type Owner = { id: string; name: string };

export type Customer = {
  id: string;
  name: string;
  city: string;
  contact: string;
  phone: string;
  email: string;
  ownerId: string;
  balance: number;
  lastActivityDaysAgo: number;
  status: CustomerStatus;
  taxNumber?: string;
  notes?: string;
};

export const OWNERS: Owner[] = [
  { id: 'o1', name: 'محمد أحمد' },
  { id: 'o2', name: 'سلمى عمر' },
  { id: 'o3', name: 'خالد حسن' },
];

const BASE: Customer[] = [
  { id: 'c1', name: 'شركة النيل للتجارة', city: 'الجيزة', contact: 'أحمد سمير', phone: '010 1234 5678', email: 'info@alnile.example.com', ownerId: 'o1', balance: 8200, lastActivityDaysAgo: 0, status: 'active' },
  { id: 'c2', name: 'مكتب الأمل للاستشارات', city: 'القاهرة', contact: 'منى خالد', phone: '011 2345 6789', email: 'office@alamal.example.com', ownerId: 'o2', balance: 18000, lastActivityDaysAgo: 1, status: 'active' },
  { id: 'c3', name: 'شركة الرواد', city: 'الإسكندرية', contact: 'كريم عادل', phone: '012 3456 7890', email: 'hello@alrowad.example.com', ownerId: 'o1', balance: 27500, lastActivityDaysAgo: 3, status: 'active' },
  { id: 'c4', name: 'مطعم السلام', city: 'الجيزة', contact: 'هاني فتحي', phone: '010 6557 8901', email: 'contact@alsalam.example.com', ownerId: 'o3', balance: 6000, lastActivityDaysAgo: 20, status: 'overdue' },
  { id: 'c5', name: 'عيادة الشفاء', city: 'القاهرة', contact: 'د. سارة محمود', phone: '015 5678 9012', email: 'clinic@alshifa.example.com', ownerId: 'o2', balance: 0, lastActivityDaysAgo: 7, status: 'active' },
  { id: 'c6', name: 'مخبز الصباح', city: 'الجيزة', contact: 'إبراهيم نعيم', phone: '010 6789 0123', email: 'bakery@alsabah.example.com', ownerId: 'o3', balance: 4200, lastActivityDaysAgo: 5, status: 'active' },
  { id: 'c7', name: 'متجر الأناقة', city: 'المنصورة', contact: 'ليلى حسن', phone: '012 7890 1234', email: 'shop@alaqa.example.com', ownerId: 'o1', balance: 0, lastActivityDaysAgo: 14, status: 'active' },
  { id: 'c8', name: 'أكاديمية المستقبل', city: 'طنطا', contact: 'عمر يوسف', phone: '010 8901 2345', email: 'info@mostaqbal.example.com', ownerId: 'o2', balance: 0, lastActivityDaysAgo: 30, status: 'inactive' },
];

// 86 عميل علشان نجرّب الترقيم (البيانات دي مؤقتة لحد ما نربط الـ API)
export const CUSTOMERS: Customer[] = Array.from({ length: 86 }, (_, i) => {
  const base = BASE[i % BASE.length];
  const round = Math.floor(i / BASE.length);

  return {
    ...base,
    id: `c${i + 1}`,
    name: round ? `${base.name} ${round + 1}` : base.name,
  };
});