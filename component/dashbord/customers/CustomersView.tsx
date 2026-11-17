// components/customers/CustomersView.tsx
'use client';

import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Loader2, Plus, TriangleAlert, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ApiError } from '@/lib/api/client';
import { useApiErrorMessage } from '@/lib/api/use-api-error';
import { can } from '@/lib/auth/permissions';
import { useSession } from '@/lib/auth/session';
import {
  fetchCustomersForExport,
  formToInput,
  toUiCustomer,
  useAssignCustomers,
  useCreateCustomer,
  useCustomers,
  useDeleteCustomers,
  useImportCustomers,
  useTeamDirectory,
  useUpdateCustomer,
  type CustomerInput,
  type CustomerListParams,
} from '@/lib/customers/hooks';
import type { Customer } from '@/lib/mock/customers';
import { downloadCsv, parseCsv, type CsvColumn } from '@/lib/csv';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import {
  createCustomerSchema,
  customerToFormValues,
  type CustomerFormValues,
} from '@/lib/validations/customer';
import AddCustomerSheet from './AddCustomerSheet';
import BulkActionsBar from './BulkActionsBar';
import CustomersTable from './CustomersTable';
import CustomersToolbar from './CustomersToolbar';

import { DEFAULT_FILTERS, PAGE_SIZE, type Filters, type StatusFilter } from './utils';
import PageHeader from '@/component/PageHeader';
import FilterTabs from '../FilterTabs';
import Pagination from '../Pagination';

const outlineBtn =
  'rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-10 gap-2 text-xs font-bold';
const primaryBtn =
  'rounded-btn bg-brand hover:bg-brand/90 h-10 gap-2 text-xs font-bold text-white';

const TAB_KEYS: StatusFilter[] = ['all', 'active', 'overdue', 'inactive'];

export default function CustomersView() {
  const t = useTranslations('Customers');
  const tApi = useTranslations('CustomersApi');
  const errorMessage = useApiErrorMessage();
  const user = useSession();
  const canEdit = can(user.role, 'editCustomers');
  const canDelete = can(user.role, 'deleteData');

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  // Selected customers by id. Kept as objects so the selection (and its names
  // in the delete dialog) survives moving between pages.
  const [selected, setSelected] = useState<Map<string, Customer>>(new Map());
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  // One customer from a row menu, or several from the bulk actions.
  const [deleting, setDeleting] = useState<Customer[] | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Search waits until typing pauses, so we don't send a request per keystroke.
  const query = useDebouncedValue(filters.query.trim(), 300);
  const params: CustomerListParams = {
    q: query || undefined,
    status: filters.status,
    assignedTo: filters.owner === 'all' ? undefined : filters.owner,
    balance: filters.balance,
    sort: filters.sort,
    page,
    pageSize: PAGE_SIZE,
  };

  const customersQuery = useCustomers(params);
  const directory = useTeamDirectory();
  const owners = useMemo(() => directory.data ?? [], [directory.data]);

  const data = customersQuery.data;
  const rows = useMemo(() => data?.items.map(toUiCustomer) ?? [], [data]);
  const total = data?.total ?? 0;
  const selectedIds = useMemo(() => new Set(selected.keys()), [selected]);
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomers = useDeleteCustomers();
  const assignCustomers = useAssignCustomers();
  const importMutation = useImportCustomers();

  // Any filter change goes back to page 1 and clears the selection.
  const update = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
    setSelected(new Map());
  };

  const tabs = TAB_KEYS.map((key) => ({
    value: key,
    label: t(`tabs.${key}`),
    count: data?.counts[key] ?? 0,
    tone: key === 'overdue' ? ('danger' as const) : undefined,
  }));

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Map(prev);
      const row = rows.find((r) => r.id === id);
      if (next.has(id)) next.delete(id);
      else if (row) next.set(id, row);
      return next;
    });

  const togglePage = (checked: boolean) =>
    setSelected((prev) => {
      const next = new Map(prev);
      for (const r of rows) {
        if (checked) next.set(r.id, r);
        else next.delete(r.id);
      }
      return next;
    });

  const ownerName = (id: string) => owners.find((o) => o.id === id)?.name ?? '';

  // -------------------------------------------------------------------------
  // Create / edit
  // -------------------------------------------------------------------------

  async function addCustomer(values: CustomerFormValues) {
    try {
      await createCustomer.mutateAsync(formToInput(values));
      // Back to the default view so the new customer shows first.
      setFilters(DEFAULT_FILTERS);
      setPage(1);
      setSelected(new Map());
      setAddOpen(false);
      toast.success(t('toasts.added', { name: values.name }));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  function openEdit(customer: Customer) {
    setEditing(customer);
    setEditOpen(true);
  }

  async function saveCustomer(values: CustomerFormValues) {
    if (!editing) return;
    try {
      await updateCustomer.mutateAsync({ id: editing.id, input: formToInput(values) });
      setEditOpen(false);
      toast.success(t('toasts.updated', { name: values.name }));
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  // -------------------------------------------------------------------------
  // Delete / assign
  // -------------------------------------------------------------------------

  function deleteCustomer() {
    if (!deleting?.length) return;
    const victims = deleting;
    const ids = victims.map((c) => c.id);
    setDeleting(null);

    deleteCustomers.mutate(ids, {
      onSuccess: () => {
        setSelected((current) => {
          const next = new Map(current);
          ids.forEach((id) => next.delete(id));
          return next;
        });
        // If that emptied the current page, step back one.
        const leftOnPage = rows.filter((r) => !ids.includes(r.id)).length;
        if (leftOnPage === 0 && page > 1) setPage(page - 1);
        toast.success(
          victims.length === 1
            ? t('toasts.deleted', { name: victims[0].name })
            : t('toasts.deletedMany', { count: victims.length }),
        );
      },
      onError: (error) => toast.error(errorMessage(error)),
    });
  }

  function assignSelected(ownerId: string) {
    const ids = [...selected.keys()];
    assignCustomers.mutate(
      { ids, assignedToId: ownerId },
      {
        onSuccess: () => {
          toast.success(t('toasts.assigned', { count: ids.length, owner: ownerName(ownerId) }));
          setSelected(new Map());
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  }

  // -------------------------------------------------------------------------
  // CSV export / import
  // -------------------------------------------------------------------------

  function downloadCustomers(exportRows: Customer[], filename: string) {
    if (exportRows.length === 0) {
      toast.error(t('importExport.noCustomersToExport'));
      return;
    }

    const columns: CsvColumn<Customer>[] = [
      { header: t('columns.name'), value: (customer) => customer.name },
      { header: t('columns.contact'), value: (customer) => customer.contact },
      { header: t('columns.phone'), value: (customer) => customer.phone },
      { header: t('columns.email'), value: (customer) => customer.email },
      { header: t('columns.city'), value: (customer) => customer.city },
      { header: t('columns.owner'), value: (customer) => ownerName(customer.ownerId) },
      { header: t('columns.balance'), value: (customer) => customer.balance },
      { header: t('columns.status'), value: (customer) => t(`status.${customer.status}`) },
      { header: t('addSheet.taxNumber'), value: (customer) => customer.taxNumber },
      { header: t('addSheet.notes'), value: (customer) => customer.notes },
    ];

    downloadCsv(`${filename}-${new Date().toISOString().slice(0, 10)}.csv`, columns, exportRows);
    toast.success(t('importExport.exported', { count: exportRows.length }));
  }

  async function exportAll() {
    try {
      // Every customer matching the current filters, not just this page.
      const items = await fetchCustomersForExport({
        q: params.q,
        status: params.status,
        assignedTo: params.assignedTo,
        balance: params.balance,
        sort: params.sort,
      });
      downloadCustomers(items.map(toUiCustomer), 'customers');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function importCustomers(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    try {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.error(t('importExport.fileType'));
        return;
      }

      const [headers, ...records] = parseCsv(await file.text());
      if (!headers?.length || records.length === 0) {
        toast.error(t('importExport.emptyFile'));
        return;
      }

      const normalize = (value: string) => value.trim().toLocaleLowerCase().replace(/[_-]+/g, ' ');
      // Balance and status are not imported: the backend works them out from
      // invoices and activity.
      const aliases = {
        name: [t('columns.name'), 'name', 'customer', 'customer name', 'اسم العميل', 'العميل'],
        contact: [t('columns.contact'), 'contact', 'contact person', 'contact details', 'مسؤول التواصل', 'بيانات التواصل'],
        phone: [t('columns.phone'), 'phone', 'phone number', 'الهاتف', 'رقم الهاتف'],
        email: [t('columns.email'), 'email', 'البريد الإلكتروني'],
        city: [t('columns.city'), 'city', 'المدينة'],
        owner: [t('columns.owner'), 'owner', 'account owner', 'المسؤول', 'المسؤول عن العميل'],
        taxNumber: [t('addSheet.taxNumber'), 'tax number', 'taxnumber', 'الرقم الضريبي'],
        notes: [t('addSheet.notes'), 'notes', 'ملاحظات'],
      } satisfies Record<string, string[]>;

      const findIndex = (key: keyof typeof aliases) =>
        headers.findIndex((header) => aliases[key].some((label) => normalize(label) === normalize(header)));
      const indexes = Object.fromEntries(
        (Object.keys(aliases) as (keyof typeof aliases)[]).map((key) => [key, findIndex(key)]),
      ) as Record<keyof typeof aliases, number>;

      if (indexes.name < 0) {
        toast.error(t('importExport.missingNameColumn'));
        return;
      }

      const schema = createCustomerSchema({
        nameRequired: t('addSheet.errors.nameRequired'),
        nameMax: t('addSheet.errors.nameMax'),
        phoneInvalid: t('addSheet.errors.phoneInvalid'),
        emailInvalid: t('addSheet.errors.emailInvalid'),
        notesMax: t('addSheet.errors.notesMax'),
      });
      const read = (record: string[], key: keyof typeof aliases) =>
        indexes[key] < 0 ? '' : (record[indexes[key]] ?? '').trim();

      const valid: CustomerInput[] = [];
      let invalidRows = 0;

      for (const record of records) {
        const ownerCell = read(record, 'owner');
        // A team member's name in the file; anyone else -> the person importing.
        const ownerId = owners.find((o) => o.name === ownerCell)?.id ?? user.id;
        const parsed = schema.safeParse({
          name: read(record, 'name'),
          contact: read(record, 'contact'),
          phone: read(record, 'phone'),
          email: read(record, 'email'),
          city: read(record, 'city'),
          ownerId,
          taxNumber: read(record, 'taxNumber'),
          notes: read(record, 'notes'),
        });
        if (parsed.success) valid.push(formToInput(parsed.data));
        else invalidRows += 1;
      }

      if (valid.length === 0) {
        toast.error(t('importExport.noValidRows'));
        return;
      }

      const { created } = await importMutation.mutateAsync(valid);
      setFilters(DEFAULT_FILTERS);
      setPage(1);
      setSelected(new Map());
      toast.success(t('importExport.imported', { count: created }));
      if (invalidRows > 0) {
        toast.warning(t('importExport.skippedRows', { count: invalidRows }));
      }
    } catch (error) {
      if (error instanceof ApiError && error.code === 'IMPORT_INVALID_ROWS') {
        const count = (error.details as { invalidCount?: number } | undefined)?.invalidCount ?? 1;
        toast.error(tApi('importInvalidRows', { count }));
      } else if (error instanceof ApiError) {
        toast.error(errorMessage(error));
      } else {
        console.error('Failed to import customer CSV', error);
        toast.error(t('importExport.readFailed'));
      }
    } finally {
      input.value = '';
    }
  }

  // -------------------------------------------------------------------------

  return (
    <div className="space-y-5">
      <input ref={importInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={importCustomers} />
      <PageHeader
        title={t('title')}
        description={t('count', { count: data?.counts.all ?? 0 })}
        actions={
          <>
            {canEdit && (
              <Button
                variant="outline"
                className={outlineBtn}
                disabled={importMutation.isPending}
                onClick={() => importInputRef.current?.click()}
              >
                {importMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                {t('import')}
              </Button>
            )}
            <Button variant="outline" className={outlineBtn} onClick={exportAll}>
              <Download className="size-4" />
              {t('export')}
            </Button>
            {canEdit && (
              <Button className={primaryBtn} onClick={() => setAddOpen(true)}>
                <Plus className="size-4" />
                {t('add')}
              </Button>
            )}
          </>
        }
      />

      <FilterTabs value={filters.status} tabs={tabs} onChange={(status) => update({ status })} />

      <div className="rounded-card border-line bg-surface overflow-hidden border shadow-sm">
        <CustomersToolbar filters={filters} owners={owners} onChange={update} />

        {selected.size > 0 && (
          <BulkActionsBar
            count={selected.size}
            owners={owners}
            onRemind={() => toast.info(t('comingSoon'))}
            onAssign={canEdit ? assignSelected : undefined}
            onDelete={canDelete ? () => setDeleting([...selected.values()]) : undefined}
            onExport={() => downloadCustomers([...selected.values()], 'customers-selected')}
          />
        )}

        {customersQuery.isPending ? (
          <div className="border-line text-muted flex justify-center border-t px-4 py-14">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : customersQuery.isError ? (
          <div className="border-line flex flex-col items-center gap-3 border-t px-4 py-14 text-center">
            <p className="text-danger text-sm font-semibold">{tApi('loadError')}</p>
            <Button variant="outline" className={outlineBtn} onClick={() => customersQuery.refetch()}>
              {tApi('retry')}
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <div className="border-line text-muted border-t px-4 py-14 text-center text-sm">{t('empty')}</div>
        ) : (
          // Dimmed while the next page or filter result loads.
          <div className={customersQuery.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
            <CustomersTable
              rows={rows}
              selected={selectedIds}
              allSelected={allSelected}
              onToggleRow={toggleRow}
              onTogglePage={togglePage}
              onEdit={canEdit ? openEdit : undefined}
              onDelete={canDelete ? (customer) => setDeleting([customer]) : undefined}
            />
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>

      {canEdit && (
        <AddCustomerSheet
          open={addOpen}
          onOpenChange={setAddOpen}
          owners={owners}
          defaultOwnerId={user.id}
          onSubmit={addCustomer}
        />
      )}

      {canEdit && editing && (
        <AddCustomerSheet
          key={editing.id}
          mode="edit"
          open={editOpen}
          onOpenChange={setEditOpen}
          owners={owners}
          defaultOwnerId={user.id}
          initial={customerToFormValues(editing)}
          onSubmit={saveCustomer}
        />
      )}

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent className="rounded-card border-line bg-surface text-ink shadow-float gap-0 overflow-hidden border p-0 sm:max-w-sm">
          <div className="flex flex-col items-center px-6 pt-7 pb-6 text-center">
            <span className="bg-danger-soft text-danger flex size-12 items-center justify-center rounded-full">
              <TriangleAlert className="size-5" />
            </span>
            <AlertDialogHeader className="mt-4 min-w-0 place-items-center gap-2 text-center">
              <AlertDialogTitle className="text-ink text-lg font-extrabold">
                {deleting?.length === 1
                  ? t('deleteDialog.title', { name: deleting[0].name })
                  : t('deleteDialog.titleMany', { count: deleting?.length ?? 0 })}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted max-w-xs text-sm leading-6">
                {t('deleteDialog.description')}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="border-line bg-canvas/60 grid grid-cols-2 gap-2 border-t px-5 py-4 sm:gap-2">
            <AlertDialogAction
              onClick={deleteCustomer}
              className="rounded-btn bg-danger hover:bg-danger/90 focus-visible:ring-danger/30 h-11 px-3 font-bold text-white"
            >
              {t('deleteDialog.confirm')}
            </AlertDialogAction>
            <AlertDialogCancel className="rounded-btn border-line-strong bg-surface text-ink hover:bg-canvas h-11 px-3 font-bold">
              {t('deleteDialog.cancel')}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
