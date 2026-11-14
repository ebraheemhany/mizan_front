// lib/mock/settings.ts
// إعدادات الشركة (وهمية)
// TODO: تتربط بالـ API لما الباك إند يجهز

export const mockSettings = {
  company: {
    name: 'شركة ميزان للحلول',
    taxNumber: '412-558-903',
    commercialRegister: '88214',
    phone: '01050931447',
    address: 'الجيزة، مصر',
  },
  taxes: {
    vatEnabled: true,
    withholdingEnabled: false,
    currency: 'EGP' as const,
    fiscalStartMonth: '1',
  },
  numbering: {
    invoicePrefix: 'INV-',
    invoiceNext: '1044',
    quotePrefix: 'Q-',
    quoteNext: '213',
    paymentTermsDays: '30' as const,
  },
    template: {
    style: 'classic' as const,
    footer: 'شكراً لتعاملكم معنا. التحويل البنكي على حساب البنك الأهلي.',
  },
    notifications: {
    overdueInvoice: true,
    newPayment: true,
    taskReminder: true,
    weeklyDigest: false,
  },
  integrations: {
    whatsapp: true,
    paymentGateway: false,
    eta: false,
    calendar: false,
  },
}

// الأدوار والصلاحيات اتنقلت لـ lib/auth/permissions.ts، والأعضاء بقوا جايين من الـ API.


