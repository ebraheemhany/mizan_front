// components/customers/CustomersView.tsx
'use client';

import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Download, Plus, TriangleAlert, Upload } from 'lucide-react';
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
import { CUSTOMERS, OWNERS, type Customer } from '@/lib/mock/customers';
import { downloadCsv, parseCsv, type CsvColumn } from '@/lib/csv';
import {
  applyCustomerForm,
  createCustomerSchema,
  customerToFormValues,
  type CustomerFormValues,
} from '@/lib/validations/customer';
import AddCustomerSheet from './AddCustomerSheet';
import BulkActionsBar from './BulkActionsBar';
import CustomersTable from './CustomersTable';
import CustomersToolbar from './CustomersToolbar';

import {
  applyFilters,
  DEFAULT_FILTERS,
  PAGE_SIZE,
  type Filters,
  type StatusFilter,
} from './utils';
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
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [requestedPage, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // TODO: لما نربط الـ API العملاء بتيجي من الباك إند
  const [customers, setCustomers] = useState<Customer[]>(CUSTOMERS);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  // عميل واحد من قايمة الصف، أو أكتر من الإجراءات الجماعية
  const [deleting, setDeleting] = useState<Customer[] | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // أي تغيير في الفلاتر يرجّعك للصفحة الأولى ويلغي التحديد
  const update = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
    setSelected(new Set());
  };

  const rows = useMemo(
    () => applyFilters(customers, filters),
    [customers, filters],
  );
  // لو اتحذف آخر صف في آخر صفحة، نرجع لآخر صفحة موجودة بدل جدول فاضي
  const page = Math.min(
    requestedPage,
    Math.max(1, Math.ceil(rows.length / PAGE_SIZE)),
  );
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allSelected =
    pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  const tabs = useMemo(
    () =>
      TAB_KEYS.map((key) => ({
        value: key,
        label: t(`tabs.${key}`),
        count:
          key === 'all'
            ? customers.length
            : customers.filter((c) => c.status === key).length,
        tone: key === 'overdue' ? ('danger' as const) : undefined,
      })),
    [customers, t],
  );

  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const togglePage = (checked: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      for (const r of pageRows) {
        if (checked) next.add(r.id);
        else next.delete(r.id);
      }
      return next;
    });

  function addCustomer(input: CustomerFormValues) {
    const customer: Customer = {
      id: `c-new-${Date.now()}`,
      name: input.name,
      city: input.city,
      contact: input.contact,
      phone: input.phone,
      email: input.email,
      ownerId:
        OWNERS.find((owner) => owner.name === input.ownerId.trim())?.id ??
        input.ownerId.trim(),
      balance: 0,
      lastActivityDaysAgo: 0,
      status: 'active',
      taxNumber: input.taxNumber || undefined,
      notes: input.notes.trim() || undefined,
    };

    // TODO: POST /customers لما نربط الـ API
    setCustomers((prev) => [customer, ...prev]);

    // نرجّع الفلاتر والصفحة علشان العميل الجديد يظهر في أول الجدول
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    setSelected(new Set());

    setAddOpen(false);
    toast.success(t('toasts.added', { name: input.name }));
  }

  function openEdit(customer: Customer) {
    setEditing(customer);
    setEditOpen(true);
  }

  function saveCustomer(values: CustomerFormValues) {
    if (!editing) return;
    const id = editing.id;

    // نفس معالجة المسؤول في الإضافة: بيقبل id أو اسم
    const ownerId =
      OWNERS.find((owner) => owner.name === values.ownerId.trim())?.id ??
      values.ownerId.trim();

    // TODO: PATCH /customers/:id لما نربط الـ API
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === id ? applyCustomerForm(c, { ...values, ownerId }) : c,
      ),
    );

    setEditOpen(false);
    toast.success(t('toasts.updated', { name: values.name }));
  }

  function deleteCustomer() {
    if (!deleting?.length) return;

    const deletedIds = new Set(deleting.map((customer) => customer.id));
    const nextCustomers = customers.filter(
      (customer) => !deletedIds.has(customer.id),
    );

    // TODO: DELETE /customers/:id لما نربط الـ API
    setCustomers(nextCustomers);
    setSelected((current) => {
      const next = new Set(current);
      deletedIds.forEach((id) => next.delete(id));
      return next;
    });
    setPage((currentPage) =>
      Math.min(
        currentPage,
        Math.max(
          1,
          Math.ceil(applyFilters(nextCustomers, filters).length / PAGE_SIZE),
        ),
      ),
    );
    setDeleting(null);
    toast.success(
      deleting.length === 1
        ? t('toasts.deleted', { name: deleting[0].name })
        : t('toasts.deletedMany', { count: deleting.length }),
    );
  }

  function assignSelected(ownerId: string) {
    const owner = OWNERS.find((o) => o.id === ownerId);
    if (!owner) return;

    // TODO: PATCH /customers لما نربط الـ API
    setCustomers((list) =>
      list.map((c) => (selected.has(c.id) ? { ...c, ownerId } : c)),
    );
    toast.success(
      t('toasts.assigned', { count: selected.size, owner: owner.name }),
    );
    setSelected(new Set());
  }

  function exportCustomers(
    exportRows: Customer[] = rows,
    filename = 'customers',
  ) {
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
      {
        header: t('columns.owner'),
        value: (customer) =>
          OWNERS.find((owner) => owner.id === customer.ownerId)?.name ??
          customer.ownerId,
      },
      { header: t('columns.balance'), value: (customer) => customer.balance },
      {
        header: t('columns.status'),
        value: (customer) => t(`status.${customer.status}`),
      },
      {
        header: t('addSheet.taxNumber'),
        value: (customer) => customer.taxNumber,
      },
      { header: t('addSheet.notes'), value: (customer) => customer.notes },
    ];

    downloadCsv(
      `${filename}-${new Date().toISOString().slice(0, 10)}.csv`,
      columns,
      exportRows,
    );
    toast.success(t('importExport.exported', { count: exportRows.length }));
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

      const normalize = (value: string) =>
        value.trim().toLocaleLowerCase().replace(/[_-]+/g, ' ');
      const aliases = {
        name: [
          t('columns.name'),
          'name',
          'customer',
          'customer name',
          'اسم العميل',
          'العميل',
        ],
        contact: [
          t('columns.contact'),
          'contact',
          'contact person',
          'contact details',
          'مسؤول التواصل',
          'بيانات التواصل',
        ],
        phone: [
          t('columns.phone'),
          'phone',
          'phone number',
          'الهاتف',
          'رقم الهاتف',
        ],
        email: [t('columns.email'), 'email', 'البريد الإلكتروني'],
        city: [t('columns.city'), 'city', 'المدينة'],
        owner: [
          t('columns.owner'),
          'owner',
          'account owner',
          'المسؤول',
          'المسؤول عن العميل',
        ],
        balance: [t('columns.balance'), 'balance', 'الرصيد'],
        status: [t('columns.status'), 'status', 'الحالة'],
        taxNumber: [
          t('addSheet.taxNumber'),
          'tax number',
          'taxnumber',
          'الرقم الضريبي',
        ],
        notes: [t('addSheet.notes'), 'notes', 'ملاحظات'],
      } satisfies Record<string, string[]>;

      const findIndex = (key: keyof typeof aliases) =>
        headers.findIndex((header) =>
          aliases[key].some((label) => normalize(label) === normalize(header)),
        );
      const indexes = {
        name: findIndex('name'),
        contact: findIndex('contact'),
        phone: findIndex('phone'),
        email: findIndex('email'),
        city: findIndex('city'),
        owner: findIndex('owner'),
        balance: findIndex('balance'),
        status: findIndex('status'),
        taxNumber: findIndex('taxNumber'),
        notes: findIndex('notes'),
      };

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
      const statusMap: Record<string, Customer['status']> = {
        active: 'active',
        [normalize(t('status.active'))]: 'active',
        overdue: 'overdue',
        [normalize(t('status.overdue'))]: 'overdue',
        inactive: 'inactive',
        [normalize(t('status.inactive'))]: 'inactive',
        نشط: 'active',
        'متأخر السداد': 'overdue',
        'غير نشط': 'inactive',
      };
      const imported: Customer[] = [];
      let invalidRows = 0;

      for (const record of records) {
        const ownerName = read(record, 'owner');
        const parsed = schema.safeParse({
          name: read(record, 'name'),
          contact: read(record, 'contact'),
          phone: read(record, 'phone'),
          email: read(record, 'email'),
          city: read(record, 'city'),
          ownerId:
            (OWNERS.find((owner) => owner.name === ownerName)?.id ??
              ownerName) ||
            OWNERS[0].id,
          taxNumber: read(record, 'taxNumber'),
          notes: read(record, 'notes'),
        });
        const rawBalance = read(record, 'balance');
        const balance = rawBalance === '' ? 0 : Number(rawBalance);
        const rawStatus = normalize(read(record, 'status'));
        const status = rawStatus ? statusMap[rawStatus] : 'active';

        if (!parsed.success || !Number.isFinite(balance) || !status) {
          invalidRows += 1;
          continue;
        }

        imported.push({
          id: `c-import-${crypto.randomUUID()}`,
          ...parsed.data,
          balance,
          lastActivityDaysAgo: 0,
          status,
        });
      }

      if (imported.length === 0) {
        toast.error(t('importExport.noValidRows'));
        return;
      }

      setCustomers((current) => [...imported, ...current]);
      setFilters(DEFAULT_FILTERS);
      setPage(1);
      setSelected(new Set());
      toast.success(t('importExport.imported', { count: imported.length }));
      if (invalidRows > 0) {
        toast.warning(t('importExport.skippedRows', { count: invalidRows }));
      }
    } catch (error) {
      console.error('Failed to import customer CSV', error);
      toast.error(t('importExport.readFailed'));
    } finally {
      input.value = '';
    }
  }

  return (
    <div className="space-y-5">
      <input
        ref={importInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={importCustomers}
      />
      <PageHeader
        title={t('title')}
        description={t('count', { count: customers.length })}
        actions={
          <>
            <Button
              variant="outline"
              className={outlineBtn}
              onClick={() => importInputRef.current?.click()}
            >
              <Upload className="size-4" />
              {t('import')}
            </Button>
            <Button
              variant="outline"
              className={outlineBtn}
              onClick={() => exportCustomers()}
            >
              <Download className="size-4" />
              {t('export')}
            </Button>
            <Button className={primaryBtn} onClick={() => setAddOpen(true)}>
              <Plus className="size-4" />
              {t('add')}
            </Button>
          </>
        }
      />

      <FilterTabs
        value={filters.status}
        tabs={tabs}
        onChange={(status) => update({ status })}
      />

      <div className="rounded-card border-line bg-surface overflow-hidden border shadow-sm">
        <CustomersToolbar filters={filters} onChange={update} />

        {selected.size > 0 && (
          <BulkActionsBar
            count={selected.size}
            owners={OWNERS}
            onRemind={() => toast.info(t('comingSoon'))}
            onAssign={assignSelected}
            onDelete={() =>
              setDeleting(customers.filter((c) => selected.has(c.id)))
            }
            onExport={() =>
              exportCustomers(
                customers.filter((customer) => selected.has(customer.id)),
                'customers-selected',
              )
            }
          />
        )}

        {rows.length === 0 ? (
          <div className="border-line text-muted border-t px-4 py-14 text-center text-sm">
            {t('empty')}
          </div>
        ) : (
          <>
            <CustomersTable
              rows={pageRows}
              selected={selected}
              allSelected={allSelected}
              onToggleRow={toggleRow}
              onTogglePage={togglePage}
              onEdit={openEdit}
              onDelete={(customer) => setDeleting([customer])}
            />
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={rows.length}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <AddCustomerSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={addCustomer}
      />

      {editing && (
        <AddCustomerSheet
          key={editing.id}
          mode="edit"
          open={editOpen}
          onOpenChange={setEditOpen}
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
          <div className="flex flex-col items-center px-6 pb-6 pt-7 text-center">
            <span className="bg-danger-soft text-danger flex size-12 items-center justify-center rounded-full">
              <TriangleAlert className="size-5" />
            </span>
            <AlertDialogHeader className="mt-4 min-w-0 place-items-center gap-2 text-center">
              <AlertDialogTitle className="text-ink text-lg font-extrabold">
                {deleting?.length === 1
                  ? t('deleteDialog.title', { name: deleting[0].name })
                  : t('deleteDialog.titleMany', {
                      count: deleting?.length ?? 0,
                    })}
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