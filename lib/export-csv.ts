type CsvValue = string | number | null | undefined;

export function downloadCsv(fileName: string, rows: CsvValue[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => {
          if (value == null) return '';

          const text =
            typeof value === 'string' && /^[\t\r ]*[=+\-@]/.test(value)
              ? `'${value}`
              : String(value);

          return `"${text.replaceAll('"', '""')}"`;
        })
        .join(','),
    )
    .join('\r\n');
  const blob = new Blob(['\uFEFF', csv], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
