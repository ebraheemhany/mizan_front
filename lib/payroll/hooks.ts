// lib/payroll/hooks.ts
// Employees and payroll (backend /api/employees and /api/payroll) as TanStack Query
// hooks. For the paid plans and the "payroll" permission (owner + accountant): the API
// answers 402 PLAN_FEATURE on the free plan, which the pages show as an upgrade card.
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, apiBlob, apiUpload } from '@/lib/api/client';
import { queryKeys } from '@/lib/query/keys';

export type PayAccount = 'bank' | 'cashbox' | 'wallet';
export type AttendanceKind = 'absence' | 'annualLeave' | 'casualLeave' | 'sickLeave' | 'unpaidLeave';
export type PayrollStatus = 'draft' | 'approved' | 'paid';

/** Money from the API: 2-decimal strings. */
export type PayFigures = { gross: string; deductions?: string; net: string; cost: string };

export type Employee = {
  id: string;
  number: number;
  /** EMP-001 */
  ref: string;
  name: string;
  jobTitle: string | null;
  department: string | null;
  phone: string | null;
  email: string | null;
  nationalId: string | null;
  address: string | null;
  hireDate: string;
  status: 'active' | 'ended';
  endDate: string | null;
  endReason: string | null;
  pay: PayFigures & {
    baseSalary: string;
    allowances: string;
    insurance: string;
    employerInsurance: string;
    incomeTax: string;
  };
  payAccount: PayAccount;
  bankName: string | null;
  bankAccount: string | null;
  walletNumber: string | null;
  leaveDays: number;
  notes: string | null;
  createdAt: string;
};

export type EmployeeRow = Employee & { advancesOutstanding: string };

export type Advance = {
  id: string;
  amount: string;
  installment: string;
  date: string;
  paidFrom: PayAccount;
  note: string | null;
  repaid: string;
  remaining: string;
};

export type AttendanceEntry = {
  id: string;
  kind: AttendanceKind;
  from: string;
  to: string;
  days: string;
  note: string | null;
  createdAt: string;
};

export type EmployeeDocument = {
  id: string;
  title: string;
  name: string | null;
  contentType: string;
  size: number;
  createdAt: string;
};

export type EmployeeDetail = Employee & {
  advances: { outstanding: string; items: Advance[] };
  attendance: {
    year: number;
    summary: { allowed: number; used: string; remaining: string; sick: string; unpaid: string; absence: string };
    items: AttendanceEntry[];
  };
  documents: EmployeeDocument[];
  payslips: (PayFigures & { itemId: string; month: string; status: PayrollStatus; paidOn: string | null })[];
};

export type EmployeeStats = {
  active: number;
  monthlyNet: string;
  monthlyCost: string;
  advancesOutstanding: string;
  onLeaveToday: number;
  absentToday: number;
  lastPayroll: { month: string; status: PayrollStatus } | null;
};

export type EmployeeInput = {
  name: string;
  jobTitle: string;
  department: string;
  phone: string;
  email: string;
  nationalId: string;
  address: string;
  hireDate: string;
  baseSalary: string;
  allowances: string;
  insurance: string;
  employerInsurance: string;
  incomeTax: string;
  payAccount: PayAccount;
  bankName: string;
  bankAccount: string;
  walletNumber: string;
  leaveDays: number;
  notes: string;
};

export type PayrollItem = PayFigures & {
  id: string;
  employee: {
    id: string;
    ref: string;
    department: string | null;
    email: string | null;
    phone: string | null;
    bankName: string | null;
    bankAccount: string | null;
    walletNumber: string | null;
  };
  name: string;
  jobTitle: string | null;
  baseSalary: string;
  allowances: string;
  bonus: string;
  overtime: string;
  absenceDays: string;
  absenceDeduction: string;
  otherDeductions: string;
  deductionNote: string | null;
  insurance: string;
  employerInsurance: string;
  incomeTax: string;
  advanceDeduction: string;
  payAccount: PayAccount;
  note: string | null;
  deductions: string;
};

export type PayrollRun = {
  id: string;
  /** YYYY-MM */
  month: string;
  status: PayrollStatus;
  paidOn: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  /** The day it counts in the books. */
  accrualDate: string;
  totals: PayFigures & { deductions: string; insurance: string; incomeTax: string; advances: string };
  byAccount: Record<PayAccount, string>;
  items: PayrollItem[];
  /** Employees who could be in a draft month but aren't. */
  missing: { id: string; name: string; ref: string }[];
};

export type PayrollRunSummary = PayFigures & {
  id: string;
  month: string;
  status: PayrollStatus;
  paidOn: string | null;
  employees: number;
  deductions: string;
};

export type ItemEdits = Partial<{
  bonus: string;
  overtime: string;
  otherDeductions: string;
  deductionNote: string;
  advanceDeduction: string;
  payAccount: PayAccount;
  note: string;
}>;

export type Payslip = {
  month: string;
  status: PayrollStatus;
  paidOn: string | null;
  company: { name: string; currency: string };
  item: PayrollItem;
};

/** The free plan: the API refuses employees and payroll with 402 PLAN_FEATURE. */
export const needsPaidPlan = (error: unknown) => error instanceof ApiError && error.code === 'PLAN_FEATURE';

// ---------------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------------

export type EmployeeListParams = { q?: string; status: 'active' | 'ended' | 'all'; department?: string };

const search = (params: Record<string, string | undefined>) => {
  const s = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1]));
  const q = s.toString();
  return q ? `?${q}` : '';
};

export function useEmployees(params: EmployeeListParams) {
  return useQuery({
    queryKey: queryKeys.employees.list(params),
    queryFn: () =>
      api<{ items: EmployeeRow[]; counts: { active: number; ended: number; all: number }; departments: string[] }>(
        `/api/employees${search(params)}`,
      ),
    placeholderData: (previous) => previous,
    retry: (count, error) => !needsPaidPlan(error) && count < 2,
  });
}

export function useEmployeeStats(enabled = true) {
  return useQuery({
    queryKey: queryKeys.employees.stats,
    queryFn: async () => (await api<{ stats: EmployeeStats }>('/api/employees/stats')).stats,
    enabled,
    retry: (count, error) => !needsPaidPlan(error) && count < 2,
  });
}

export function useEmployee(id: string, year?: number) {
  return useQuery({
    queryKey: queryKeys.employees.detail(id, year ?? null),
    queryFn: async () => (await api<{ employee: EmployeeDetail }>(`/api/employees/${id}${year ? `?year=${year}` : ''}`)).employee,
    placeholderData: (previous) => previous,
    retry: (count, error) => !needsPaidPlan(error) && !(error instanceof ApiError && error.status === 404) && count < 2,
  });
}

/** After any change to employees: lists, stats, the employee, and payroll months that copy them. */
function useEmployeeMutation<TInput, TResult>(call: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: call,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.payroll.all });
    },
  });
}

/** Empty text is sent as null (cleared); numbers as strings. */
const employeeBody = (input: Partial<EmployeeInput>) =>
  Object.fromEntries(
    Object.entries(input).map(([k, v]) => [k, typeof v === 'string' && v.trim() === '' && !['allowances', 'insurance', 'employerInsurance', 'incomeTax'].includes(k) ? null : v]),
  );

export const useCreateEmployee = () =>
  useEmployeeMutation(async (input: EmployeeInput) =>
    (await api<{ employee: Employee }>('/api/employees', { method: 'POST', body: employeeBody(input) })).employee,
  );

export const useUpdateEmployee = () =>
  useEmployeeMutation(async ({ id, input }: { id: string; input: Partial<EmployeeInput> }) =>
    (await api<{ employee: Employee }>(`/api/employees/${id}`, { method: 'PATCH', body: employeeBody(input) })).employee,
  );

export const useEndEmployee = () =>
  useEmployeeMutation(async ({ id, endDate, reason }: { id: string; endDate: string; reason: string }) =>
    (await api<{ employee: Employee }>(`/api/employees/${id}/end`, { method: 'POST', body: { endDate, reason: reason || null } })).employee,
  );

export const useReactivateEmployee = () =>
  useEmployeeMutation(async (id: string) =>
    (await api<{ employee: Employee }>(`/api/employees/${id}/reactivate`, { method: 'POST' })).employee,
  );

export const useDeleteEmployee = () =>
  useEmployeeMutation((id: string) => api<void>(`/api/employees/${id}`, { method: 'DELETE' }));

export type AdvanceInput = { amount: string; installment: string; date: string; paidFrom: PayAccount; note: string };

export const useAddAdvance = () =>
  useEmployeeMutation(({ id, input }: { id: string; input: AdvanceInput }) =>
    api(`/api/employees/${id}/advances`, { method: 'POST', body: { ...input, note: input.note || null } }),
  );

export const useDeleteAdvance = () =>
  useEmployeeMutation(({ id, advanceId }: { id: string; advanceId: string }) =>
    api<void>(`/api/employees/${id}/advances/${advanceId}`, { method: 'DELETE' }),
  );

export type AttendanceInput = { kind: AttendanceKind; from: string; to: string; days: string; note: string };

export const useAddAttendance = () =>
  useEmployeeMutation(({ id, input }: { id: string; input: AttendanceInput }) =>
    api(`/api/employees/${id}/attendance`, {
      method: 'POST',
      body: { kind: input.kind, from: input.from, to: input.to, ...(input.days ? { days: input.days } : {}), note: input.note || null },
    }),
  );

export const useDeleteAttendance = () =>
  useEmployeeMutation(({ id, entryId }: { id: string; entryId: string }) =>
    api<void>(`/api/employees/${id}/attendance/${entryId}`, { method: 'DELETE' }),
  );

/** What an employee document may be (the server checks the file itself too). */
export const DOCUMENT_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
export const DOCUMENT_MAX_BYTES = 5 * 1024 * 1024;

export const useAddDocument = () =>
  useEmployeeMutation(({ id, file, title }: { id: string; file: File; title: string }) =>
    apiUpload(`/api/employees/${id}/documents${title ? `?title=${encodeURIComponent(title)}` : ''}`, file, file.name),
  );

export const useDeleteDocument = () =>
  useEmployeeMutation(({ id, documentId }: { id: string; documentId: string }) =>
    api<void>(`/api/employees/${id}/documents/${documentId}`, { method: 'DELETE' }),
  );

/** Opens a document in a new tab (opened inside the click so popup blockers allow it). */
export async function openDocument(id: string, documentId: string) {
  const tab = window.open('', '_blank');
  try {
    const url = URL.createObjectURL(await apiBlob(`/api/employees/${id}/documents/${documentId}`));
    if (tab) tab.location.href = url;
    else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    tab?.close();
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Payroll
// ---------------------------------------------------------------------------

export function usePayrollRuns() {
  return useQuery({
    queryKey: queryKeys.payroll.list,
    queryFn: async () => (await api<{ items: PayrollRunSummary[] }>('/api/payroll')).items,
    retry: (count, error) => !needsPaidPlan(error) && count < 2,
  });
}

export function usePayrollRun(month: string) {
  return useQuery({
    queryKey: queryKeys.payroll.detail(month),
    queryFn: async () => (await api<{ payroll: PayrollRun }>(`/api/payroll/${month}`)).payroll,
    retry: (count, error) => !needsPaidPlan(error) && !(error instanceof ApiError && error.status === 404) && count < 2,
  });
}

/** A payroll change: the month (from the answer), the list, employees (advances, payslips), and the books. */
function usePayrollMutation<TInput>(call: (input: TInput) => Promise<{ payroll: PayrollRun } | void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: call,
    onSuccess: (result) => {
      if (result && 'payroll' in result) queryClient.setQueryData(queryKeys.payroll.detail(result.payroll.month), result.payroll);
    },
    onSettled: () => {
      for (const key of [queryKeys.payroll.all, queryKeys.employees.all, queryKeys.dashboard, queryKeys.reports.all, queryKeys.ledger.all]) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}

export const useCreatePayroll = () =>
  usePayrollMutation((month: string) => api<{ payroll: PayrollRun }>('/api/payroll', { method: 'POST', body: { month } }));

const runAction = (action: string) => (month: string) =>
  api<{ payroll: PayrollRun }>(`/api/payroll/${month}/${action}`, { method: 'POST' });

export const useRefreshPayroll = () => usePayrollMutation(runAction('refresh'));
export const useApprovePayroll = () => usePayrollMutation(runAction('approve'));
export const useReopenPayroll = () => usePayrollMutation(runAction('reopen'));
export const useUnpayPayroll = () => usePayrollMutation(runAction('unpay'));

export const usePayPayroll = () =>
  usePayrollMutation(({ month, paidOn }: { month: string; paidOn: string }) =>
    api<{ payroll: PayrollRun }>(`/api/payroll/${month}/pay`, { method: 'POST', body: { paidOn } }),
  );

export const useDeletePayroll = () =>
  usePayrollMutation(async (month: string) => {
    await api<void>(`/api/payroll/${month}`, { method: 'DELETE' });
  });

export const useUpdatePayrollItem = () =>
  usePayrollMutation(({ month, itemId, edits }: { month: string; itemId: string; edits: ItemEdits }) =>
    api<{ payroll: PayrollRun }>(`/api/payroll/${month}/items/${itemId}`, { method: 'PATCH', body: edits }),
  );

export const useRemovePayrollItem = () =>
  usePayrollMutation(({ month, itemId }: { month: string; itemId: string }) =>
    api<{ payroll: PayrollRun }>(`/api/payroll/${month}/items/${itemId}`, { method: 'DELETE' }),
  );

export function useEmailPayslip() {
  return useMutation({
    mutationFn: ({ month, itemId, locale }: { month: string; itemId: string; locale: 'ar' | 'en' }) =>
      api<{ to: string }>(`/api/payroll/${month}/items/${itemId}/email`, { method: 'POST', body: { locale } }),
  });
}

// ---------------------------------------------------------------------------
// Months
// ---------------------------------------------------------------------------

/** "2026-11" shifted by `by` months. */
export function shiftMonth(month: string, by: number) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Money string -> number, for display only (totals come from the API). */
export const num = (value: string | null | undefined) => Number(value ?? 0);
