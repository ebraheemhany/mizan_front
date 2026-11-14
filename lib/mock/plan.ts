// lib/mock/plans.ts

export type PlanId = 'free' | 'pro' | 'business';

export type Plan = {
  id: PlanId;
  price: number; // شهرياً
  users: number;
  invoicesLimit: number | null; // null = غير محدود
  features: string[];
};

// TODO: الباقات والأسعار من الـ API
export const PLANS: Plan[] = [
  { id: 'free', price: 0, users: 1, invoicesLimit: 10, features: ['users', 'invoices10', 'basicReports'] },
  { id: 'pro', price: 1200, users: 10, invoicesLimit: null, features: ['users', 'invoicesUnlimited', 'fullReports', 'recurring'] },
  { id: 'business', price: 2500, users: 50, invoicesLimit: null, features: ['users', 'allPro', 'advancedPermissions', 'prioritySupport'] },
];