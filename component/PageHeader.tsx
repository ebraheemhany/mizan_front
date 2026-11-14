// components/app/PageHeader.tsx
export default function PageHeader({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-ink text-2xl font-extrabold sm:text-3xl">
          {title}
        </h1>
        {description && (
          <div className="text-muted mt-1 text-xs">{description}</div>
        )}
      </div>
      {actions && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
