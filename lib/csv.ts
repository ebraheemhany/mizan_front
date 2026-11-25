// lib/csv.ts
import { saveFile } from '@/lib/files';

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

function cell(v: string | number | null | undefined) {
  if (v === null || v === undefined) return '';
  let s = String(v);

  // لو النص بيبدأ برمز معادلة، Excel ممكن ينفذه. بنحط قبله علامة ' علشان يتعامل معاه كنص
  if (typeof v === 'string' && /^[=+\-@]/.test(s)) s = `'${s}`;

  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv<T>(filename: string, columns: CsvColumn<T>[], rows: T[]) {
  const lines = [
    columns.map((c) => cell(c.header)).join(','),
    ...rows.map((r) => columns.map((c) => cell(c.value(r))).join(',')),
  ];

  // \uFEFF علشان Excel يقرا العربي UTF-8 صح
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  void saveFile(blob, filename);
}

export function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, '');
  const delimiters = [',', ';', '\t'] as const;
  let firstRowEnd = text.length;
  let inFirstRowQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '"' && text[i + 1] === '"' && inFirstRowQuotes) {
      i += 1;
    } else if (text[i] === '"') {
      inFirstRowQuotes = !inFirstRowQuotes;
    } else if (!inFirstRowQuotes && (text[i] === '\r' || text[i] === '\n')) {
      firstRowEnd = i;
      break;
    }
  }

  const firstRow = text.slice(0, firstRowEnd);
  let delimiter: (typeof delimiters)[number] = ',';
  let maxSeparators = 0;
  for (const candidate of delimiters) {
    let count = 0;
    let quoted = false;
    for (let i = 0; i < firstRow.length; i += 1) {
      if (firstRow[i] === '"' && firstRow[i + 1] === '"' && quoted) {
        i += 1;
      } else if (firstRow[i] === '"') {
        quoted = !quoted;
      } else if (!quoted && firstRow[i] === candidate) {
        count += 1;
      }
    }
    if (count > maxSeparators) {
      maxSeparators = count;
      delimiter = candidate;
    }
  }

  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && char === delimiter) {
      record.push(field);
      field = '';
    } else if (!quoted && (char === '\r' || char === '\n')) {
      record.push(field);
      if (record.some((value) => value.trim() !== '')) records.push(record);
      record = [];
      field = '';
      if (char === '\r' && text[i + 1] === '\n') i += 1;
    } else {
      field += char;
    }
  }

  if (quoted) throw new Error('CSV contains an unclosed quoted field');
  if (field !== '' || record.length > 0) {
    record.push(field);
    if (record.some((value) => value.trim() !== '')) records.push(record);
  }

  return records;
}