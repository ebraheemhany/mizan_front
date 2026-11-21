// components/app/nav-config.ts
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CreditCard,
  FileSignature,
  History,
  Home,
  Kanban,
  Package,
  Receipt,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

export type NavKey =
  | 'dashboard' | 'customers' | 'deals' | 'quotes' | 'invoices' | 'expenses'
  | 'reports' | 'products' | 'payments' | 'tasks' | 'settings' | 'accounts' | 'auditLog';

export type NavItem = {
  key: NavKey;
  href: string;
  icon: LucideIcon;
  // Fixed badges only; the invoices, tasks and deals counts are set live in SidebarNav.
  badge?: { count: number; tone: 'brand' | 'danger' };
};

export const NAV_GROUPS: NavItem[][] = [
  [
    { key: 'dashboard', href: '/dashboard', icon: Home },
    { key: 'customers', href: '/customers', icon: Users },
    { key: 'deals', href: '/deals', icon: Kanban },
    { key: 'quotes', href: '/quotes', icon: FileSignature },
    { key: 'invoices', href: '/invoices', icon: Receipt },
    { key: 'expenses', href: '/expenses', icon: Wallet },
    { key: 'reports', href: '/reports', icon: BarChart3 },
    { key: 'products', href: '/products', icon: Package },
    { key: 'payments', href: '/payments', icon: CreditCard },
    { key: 'tasks', href: '/tasks', icon: CalendarCheck },
  ],
  [
    { key: 'settings', href: '/settings', icon: Settings },
    { key: 'accounts', href: '/accounts', icon: BookOpen },
    { key: 'auditLog', href: '/audit-log', icon: History },
  ],
];