// Fails the run when the suite contains skipped or todo tests.
//
// Vitest exits zero for these, so a `.skip` added to silence a failure would
// otherwise pass CI unnoticed. Reads the JSON report written by `pnpm test`.
//
// The summary counters are the source of truth, so a change to the reporter's
// per-test status strings cannot quietly disable this check. The per-test list
// is only used to name the offenders.

import { readFile } from 'node:fs/promises';

const REPORT = new URL('../.vitest-report.json', import.meta.url);
const INACTIVE = new Set(['skipped', 'pending', 'todo']);

let report;
try {
  report = JSON.parse(await readFile(REPORT, 'utf8'));
} catch (cause) {
  console.error(`Could not read the vitest report at ${REPORT.pathname}.`);
  console.error(cause instanceof Error ? cause.message : cause);
  process.exit(1);
}

const count = (report.numPendingTests ?? 0) + (report.numTodoTests ?? 0);

if (count > 0) {
  const named = [];
  for (const file of report.testResults ?? []) {
    for (const test of file.assertionResults ?? []) {
      if (INACTIVE.has(test.status)) {
        named.push(`${test.status}: ${file.name} > ${test.fullName}`);
      }
    }
  }

  console.error(`Found ${count} skipped or todo test(s).`);
  for (const line of named) {
    console.error(`  ${line}`);
  }
  console.error('Delete the test or fix it. Do not leave it skipped.');
  process.exit(1);
}

console.log(`Test health OK: ${report.numTotalTests ?? 0} test(s), none skipped.`);
