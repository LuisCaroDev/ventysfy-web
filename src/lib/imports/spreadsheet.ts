import * as XLSX from 'xlsx';
import type { ParsedSheet, ParsedWorkbook } from '$lib/imports/types';

const SUPPORTED_EXTENSIONS = new Set(['csv', 'xlsx', 'xls']);

function getExtension(fileName: string): ParsedWorkbook['extension'] {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension || !SUPPORTED_EXTENSIONS.has(extension)) {
    throw new Error('Solo se permiten archivos CSV, XLSX o XLS.');
  }

  return extension as ParsedWorkbook['extension'];
}

function normalizeHeader(value: string, index: number, seen: Set<string>) {
  const base = value.trim() || `Columna ${index + 1}`;
  let candidate = base;
  let suffix = 2;

  while (seen.has(candidate.toLowerCase())) {
    candidate = `${base} (${suffix})`;
    suffix += 1;
  }

  seen.add(candidate.toLowerCase());
  return candidate;
}

function toCellString(value: unknown) {
  if (value == null) return '';
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    const hours = `${value.getHours()}`.padStart(2, '0');
    const minutes = `${value.getMinutes()}`.padStart(2, '0');
    const seconds = `${value.getSeconds()}`.padStart(2, '0');
    const milliseconds = `${value.getMilliseconds()}`.padStart(3, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
  }
  if (typeof value === 'string') return value.trim();
  return String(value).trim();
}

function buildSheet(name: string, matrix: unknown[][]): ParsedSheet | null {
  const nonEmptyRows = matrix
    .map((row) => row.map(toCellString))
    .filter((row) => row.some((value) => value.length > 0));

  if (nonEmptyRows.length === 0) return null;

  const seenHeaders = new Set<string>();
  const headers = nonEmptyRows[0].map((value, index) => normalizeHeader(value, index, seenHeaders));

  if (headers.length === 0) return null;

  const rows = nonEmptyRows.slice(1).map((row) => {
    return headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = row[index] ?? '';
      return acc;
    }, {});
  });

  const samples = headers.reduce<Record<string, string[]>>((acc, header) => {
    acc[header] = rows
      .map((row) => row[header]?.trim() ?? '')
      .filter(Boolean)
      .slice(0, 3);
    return acc;
  }, {});

  return {
    name,
    headers,
    rows,
    samples,
  };
}

export async function parseSpreadsheet(file: File): Promise<ParsedWorkbook> {
  const extension = getExtension(file.name);
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: 'array',
    raw: false,
    cellDates: true,
    dense: true,
  });

  console.info('[imports-spreadsheet] workbook', {
    fileName: file.name,
    extension,
    sheetNames: workbook.SheetNames,
  });

  const sheets = workbook.SheetNames.map((sheetName, index) => {
    const sheet = workbook.Sheets[sheetName];
    const matrix = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      raw: false,
      blankrows: false,
    }) as unknown[][];

    const parsedSheet = buildSheet(sheetName, matrix);

    console.info('[imports-spreadsheet] parsed sheet', {
      index,
      originalName: sheetName,
      parsedSheet,
      rowsInMatrix: matrix.length,
    });

    return parsedSheet;
  }).filter((sheet): sheet is ParsedSheet => {
    return (
      !!sheet &&
      typeof sheet.name === 'string' &&
      Array.isArray(sheet.headers) &&
      Array.isArray(sheet.rows)
    );
  });

  console.info('[imports-spreadsheet] normalized sheets', {
    fileName: file.name,
    sheets,
  });

  if (sheets.length === 0) {
    throw new Error('No se encontraron hojas con encabezados y datos para importar.');
  }

  return {
    fileName: file.name,
    extension,
    sheets,
  };
}

export function normalizeSourceKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
