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

export type Role = 'owner' | 'accountant' | 'sales' | 'viewer'

export type Member = {
  id: string
  name: string
  email: string
  role: Role
  status: 'active' | 'pending'
}

// TODO: تيجي من الـ API لما نربط
export const mockMembers: Member[] = [
  { id: 'm1', name: 'محمد أحمد', email: 'owner@mizan.eg', role: 'owner', status: 'active' },
  { id: 'm2', name: 'سارة علي', email: 'sara@mizan.eg', role: 'sales', status: 'active' },
  { id: 'm3', name: 'كريم حسن', email: 'karim@mizan.eg', role: 'accountant', status: 'active' },
  { id: 'm4', name: 'نور خالد', email: 'nour@mizan.eg', role: 'sales', status: 'pending' },
]

export const ROLES: Role[] = ['owner', 'accountant', 'sales', 'viewer']

// الأدوار اللي تتدعى (المالك واحد بس)
export const INVITE_ROLES: Role[] = ['accountant', 'sales', 'viewer']

export const PERMISSIONS: { key: string; roles: Role[] }[] = [
  { key: 'viewCustomers', roles: ['owner', 'accountant', 'sales', 'viewer'] },
  { key: 'editCustomers', roles: ['owner', 'sales'] },
  { key: 'issueInvoices', roles: ['owner', 'accountant'] },
  { key: 'recordPayments', roles: ['owner', 'accountant'] },
  { key: 'expenses', roles: ['owner', 'accountant'] },
  { key: 'reports', roles: ['owner', 'accountant'] },
  { key: 'settings', roles: ['owner'] },
  { key: 'deleteData', roles: ['owner'] },
]


