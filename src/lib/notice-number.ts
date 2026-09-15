import type { Prisma } from '../../prisma/generated/client/client';

/**
 * Atomically increments the notice_counter and returns the new notice number
 * formatted as "SPA-XXX" (zero-padded to at least 3 digits).
 *
 * ## Why this is race-condition safe
 *
 * This uses a single SQL statement:
 *
 *   UPDATE notice_counter SET value = value + 1 WHERE id = 1 RETURNING value
 *
 * PostgreSQL guarantees that UPDATE is atomic at the row level. When two
 * concurrent transactions both execute this UPDATE on the same row, PostgreSQL's
 * MVCC system ensures they are serialized: one transaction acquires a row-level
 * lock, increments the value, and returns it. The second transaction then waits
 * for the lock, reads the already-incremented value, increments it again, and
 * returns that. There is no window where two callers can read the same value.
 *
 * Because the increment and the read happen in a single atomic statement
 * (UPDATE ... RETURNING), there is no TOCTOU race — no separate SELECT + UPDATE
 * pair that could interleave. This is strictly safer than "SELECT MAX(id) + 1".
 *
 * The result is:
 * - Every call returns a unique, monotonically increasing number
 * - No gaps (unless a transaction is explicitly rolled back)
 * - No duplicates, even with hundreds of concurrent callers
 *
 * @returns The formatted notice number, e.g. "SPA-001", "SPA-042", "SPA-1000"
 */
export async function getNextNoticeNumber(
  tx: Prisma.TransactionClient
): Promise<string> {
  const result = await tx.$queryRaw<{ value: number }[]>`
    UPDATE notice_counter SET value = value + 1 WHERE id = 1 RETURNING value
  `;

  if (result.length === 0) {
    throw new Error(
      'notice_counter row not found. Run the database seed first.'
    );
  }

  const counter = result[0].value;
  // Zero-pad to at least 3 digits, naturally expand past 999
  const padded = String(counter).padStart(3, '0');
  return `SPA-${padded}`;
}

/**
 * Formats a raw counter value into the SPA-XXX notice number format.
 * Useful for display purposes when you already have the number.
 */
export function formatNoticeNumber(value: number): string {
  return `SPA-${String(value).padStart(3, '0')}`;
}
