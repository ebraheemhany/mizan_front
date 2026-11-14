// lib/mock/products.ts
// بيانات وهمية لصفحة المنتجات والخدمات
// TODO: تتربط بالـ API لما الباك إند يجهز

export type ItemType = 'service' | 'product'

export type ItemCategory =
  | 'software'
  | 'support'
  | 'consulting'
  | 'devices'
  | 'network'
  | 'accessories'

export type CatalogItem = {
  id: string
  name: string
  type: ItemType
  code: string
  price: number
  taxRate: number // نسبة مئوية، 14 = 14%
  category: ItemCategory
  stock?: number // للمنتجات بس
  lowStockAt?: number // حد التنبيه للمنتجات بس
  usageCount: number // TODO: تتحسب من الفواتير والعروض
}

export const mockItems: CatalogItem[] = [
  // خدمات (14)
  { id: 'i1', name: 'تطوير موقع', type: 'service', code: 'SRV-001', price: 25000, taxRate: 14, category: 'software', usageCount: 48 },
  { id: 'i2', name: 'دعم فني شهري', type: 'service', code: 'SRV-002', price: 6000, taxRate: 14, category: 'support', usageCount: 31 },
  { id: 'i3', name: 'زيارة ميدانية', type: 'service', code: 'SRV-003', price: 600, taxRate: 14, category: 'support', usageCount: 27 },
  { id: 'i4', name: 'استضافة سنوية', type: 'service', code: 'SRV-004', price: 3500, taxRate: 14, category: 'software', usageCount: 19 },
  { id: 'i5', name: 'تصميم هوية بصرية', type: 'service', code: 'SRV-005', price: 8000, taxRate: 14, category: 'software', usageCount: 14 },
  { id: 'i6', name: 'استشارة تقنية', type: 'service', code: 'SRV-006', price: 1200, taxRate: 14, category: 'consulting', usageCount: 22 },
  { id: 'i7', name: 'تدريب فريق العمل', type: 'service', code: 'SRV-007', price: 4500, taxRate: 14, category: 'consulting', usageCount: 8 },
  { id: 'i8', name: 'تركيب شبكة', type: 'service', code: 'SRV-008', price: 2800, taxRate: 14, category: 'network', usageCount: 11 },
  { id: 'i9', name: 'صيانة شبكة', type: 'service', code: 'SRV-009', price: 900, taxRate: 14, category: 'network', usageCount: 16 },
  { id: 'i10', name: 'تطبيق موبايل', type: 'service', code: 'SRV-010', price: 40000, taxRate: 14, category: 'software', usageCount: 5 },
  { id: 'i11', name: 'إدارة حسابات التواصل', type: 'service', code: 'SRV-011', price: 3000, taxRate: 14, category: 'consulting', usageCount: 9 },
  { id: 'i12', name: 'نسخ احتياطي سحابي', type: 'service', code: 'SRV-012', price: 1500, taxRate: 14, category: 'software', usageCount: 12 },
  { id: 'i13', name: 'تدقيق أمني', type: 'service', code: 'SRV-013', price: 7500, taxRate: 14, category: 'consulting', usageCount: 4 },
  { id: 'i14', name: 'دعم فني طارئ', type: 'service', code: 'SRV-014', price: 800, taxRate: 14, category: 'support', usageCount: 18 },

  // منتجات (10)
  { id: 'i15', name: 'راوتر WiFi 6', type: 'product', code: 'PRD-014', price: 1850, taxRate: 14, category: 'network', stock: 42, lowStockAt: 10, usageCount: 12 },
  { id: 'i16', name: 'كاميرا مراقبة', type: 'product', code: 'PRD-021', price: 2300, taxRate: 14, category: 'devices', stock: 5, lowStockAt: 8, usageCount: 9 },
  { id: 'i17', name: 'كابل شبكة 50م', type: 'product', code: 'PRD-033', price: 420, taxRate: 14, category: 'accessories', stock: 0, lowStockAt: 20, usageCount: 6 },
  { id: 'i18', name: 'سويتش 24 منفذ', type: 'product', code: 'PRD-040', price: 3200, taxRate: 14, category: 'network', stock: 14, lowStockAt: 5, usageCount: 7 },
  { id: 'i19', name: 'جهاز حضور وانصراف', type: 'product', code: 'PRD-045', price: 4100, taxRate: 14, category: 'devices', stock: 9, lowStockAt: 3, usageCount: 4 },
  { id: 'i20', name: 'طابعة فواتير حرارية', type: 'product', code: 'PRD-052', price: 2750, taxRate: 14, category: 'devices', stock: 18, lowStockAt: 5, usageCount: 10 },
  { id: 'i21', name: 'قارئ باركود', type: 'product', code: 'PRD-058', price: 950, taxRate: 14, category: 'devices', stock: 27, lowStockAt: 10, usageCount: 8 },
  { id: 'i22', name: 'حامل حائط للشاشات', type: 'product', code: 'PRD-063', price: 380, taxRate: 14, category: 'accessories', stock: 3, lowStockAt: 6, usageCount: 3 },
  { id: 'i23', name: 'وحدة تخزين خارجية', type: 'product', code: 'PRD-070', price: 2100, taxRate: 14, category: 'accessories', stock: 11, lowStockAt: 4, usageCount: 5 },
  { id: 'i24', name: 'UPS للأجهزة', type: 'product', code: 'PRD-077', price: 3600, taxRate: 14, category: 'devices', stock: 0, lowStockAt: 3, usageCount: 2 },
]