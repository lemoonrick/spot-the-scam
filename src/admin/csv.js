// ============================================================
//  Spreadsheet export
//
//  Turns rows into a CSV file that opens cleanly in Excel and Google
//  Sheets. Pure: no browser needed, so it is tested directly.
// ============================================================

/**
 * Quote a value only when it needs it. A comma, quote or line break
 * inside a value would otherwise split it across columns or rows.
 *
 * A value starting with = + - or @ is also prefixed with a quote mark,
 * so a spreadsheet shows it as text instead of running it as a formula.
 * None of our own data starts that way, but a room name typed by hand
 * could, and opening a download should never run anything.
 */
export function cell(value) {
  if (value == null) return '';
  // Real numbers go through untouched: an improvement of -20 must stay
  // a number the spreadsheet can add up, not become text.
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  let s = String(value);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * @param {Array<{ key: string, label: string, value?: (row) => any }>} columns
 * @param {object[]} rows
 */
export function toCsv(columns, rows) {
  const head = columns.map((c) => cell(c.label)).join(',');
  const body = rows.map((row) =>
    columns.map((c) => cell(c.value ? c.value(row) : row[c.key])).join(','),
  );
  return [head, ...body].join('\r\n');
}

/**
 * Hand a CSV to the browser as a download. The byte-order mark at the
 * start tells Excel the file is UTF-8, without which it garbles ₹ and
 * any name that isn't plain English letters.
 */
export function downloadCsv(filename, csv) {
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
