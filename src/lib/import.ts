import { z } from 'zod';
import { ApiError } from '../common/responses/index.js';

// Shared by the Excel/CSV imports (classes, subjects, students, tests). Each import checks
// every row on the server and answers with one result per row, so the preview shows exactly
// what saving will do. Saving checks again and is all or nothing.

export const IMPORT_MAX_ROWS = 1000;

export type ImportStatus = 'new' | 'exists' | 'problem';

export interface IImportRowResult {
  // The row number in the sheet, so messages point at the right line
  row: number;
  // What the row is, e.g. the class name, shown next to its status
  label: string;
  status: ImportStatus;
  messages: string[];
}

export interface IImportResult<T = unknown> {
  dryRun: boolean;
  counts: Record<ImportStatus, number>;
  rows: IImportRowResult[];
  // Only after a save: what was created, in the list's shape
  created?: T[];
}

// Cells are sent as text and checked per row, so a bad cell becomes a message on its row
// instead of failing the whole request. The cap only stops absurd input.
export const importCell = z.string().max(500, 'A cell in the file is too long').optional();

export const importBody = <T extends z.ZodRawShape, E extends z.ZodRawShape = Record<never, never>>(
  row: T,
  extra?: E,
) =>
  z.object({
    body: z.object({
      ...(extra as E),
      dryRun: z.boolean('Say whether this is a preview'),
      rows: z
        .array(z.object({ row: z.number().int().positive(), ...row }))
        .min(1, 'The file has no rows to import')
        .max(IMPORT_MAX_ROWS, `A file can have at most ${IMPORT_MAX_ROWS} rows. Split it and import each part`),
    }),
  });

// Spaces trimmed and runs of spaces made one, as a name is stored
export const cleanText = (value: string | undefined) => (value ?? '').trim().replace(/\s+/g, ' ');

// Names are matched ignoring case and extra spaces
export const nameKey = (value: string | undefined) => cleanText(value).toLowerCase();

export const countRows = (rows: IImportRowResult[]): Record<ImportStatus, number> => ({
  new: rows.filter((r) => r.status === 'new').length,
  exists: rows.filter((r) => r.status === 'exists').length,
  problem: rows.filter((r) => r.status === 'problem').length,
});

// The data may have changed since the preview, so a save re-checks and refuses on any problem
export const refuseProblems = (rows: IImportRowResult[], error: IError) => {
  if (rows.some((r) => r.status === 'problem')) throw ApiError.format('', error);
};

export const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

// A date from the file: YYYY-MM-DD (what Excel dates become), or day first as typed in
// Pakistan (D/M/YYYY or D-M-YYYY). Returns YYYY-MM-DD, or null if it isn't a real date.
export const parseDay = (value: string | undefined): string | null => {
  const text = cleanText(value);
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  let [y, m, d] = match ? [match[1], match[2], match[3]] : [];
  if (!match) {
    match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text);
    if (!match) return null;
    [d, m, y] = [match[1], match[2], match[3]];
  }
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  if (date.getUTCFullYear() !== Number(y) || date.getUTCMonth() !== Number(m) - 1 || date.getUTCDate() !== Number(d)) {
    return null;
  }
  return date.toISOString().slice(0, 10);
};

// The server's midnight on that day, which is how lib/marksDue reads Student.classSince
export const localDay = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// 2026-04-01 → 1 April 2026
export const dayInWords = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};
