// components/app/nav-config.ts
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CreditCard,
  FileSignature,
  History,
  Home,
  IdCard,
  Kanban,
  Package,
  Receipt,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

import type { Permission } from '@/lib/auth/permissions';

export type NavKey =
  | 'dashboard' | 'customers' | 'deals' | 'quotes' | 'invoices' | 'expenses'
  | 'reports' | 'products' | 'payments' | 'tasks' | 'employees' | 'settings' | 'accounts' | 'auditLog';

export type NavItem = {
  key: NavKey;
  href: string;
  icon: LucideIcon;
  // Fixed badges only; the invoices, tasks and deals counts are set live in SidebarNav.
  badge?: { count: number; tone: 'brand' | 'danger' };
  /** Pages closed to roles without this permission are left out of the menu. */
  permission?: Permission;
};

export const NAV_GROUPS: NavItem[][] = [
  [
    { key: 'dashboard', href: '/dashboard', icon: Home },
    { key: 'customers', href: '/customers', icon: Users },
    { key: 'deals', href: '/deals', icon: Kanban },
    { key: 'quotes', href: '/quotes', icon: FileSignature },
    { key: 'invoices', href: '/invoices', icon: Receipt },
    { key: 'expenses', href: '/expenses', icon: Wallet, permission: 'expenses' },
    { key: 'reports', href: '/reports', icon: BarChart3, permission: 'reports' },
    { key: 'products', href: '/products', icon: Package },
    { key: 'payments', href: '/payments', icon: CreditCard },
    { key: 'tasks', href: '/tasks', icon: CalendarCheck },
    { key: 'employees', href: '/employees', icon: IdCard, permission: 'payroll' },
  ],
  [
    { key: 'settings', href: '/settings', icon: Settings },
    { key: 'accounts', href: '/accounts', icon: BookOpen, permission: 'ledger' },
    { key: 'auditLog', href: '/audit-log', icon: History, permission: 'auditLog' },
  ],
];