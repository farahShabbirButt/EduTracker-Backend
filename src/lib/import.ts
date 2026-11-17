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

export const importBody = <T extends z.ZodRawShape>(row: T) =>
  z.object({
    body: z.object({
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
