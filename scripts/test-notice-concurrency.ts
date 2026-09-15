/**
 * Concurrency test for getNextNoticeNumber()
 *
 * Fires N concurrent calls to the atomic counter and verifies:
 *   1. Every returned notice number is unique (no duplicates)
 *   2. The numbers form a contiguous sequence with no gaps
 *   3. The final counter value matches the number of calls made
 *
 * Usage:  npx tsx scripts/test-notice-concurrency.ts
 */
import 'dotenv/config';
import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const CONCURRENCY = 50; // Number of simultaneous calls

async function main() {
  // Create a dedicated pool for this test (separate from the app pool)
  const pool = new pg.Pool({ connectionString: DATABASE_URL });

  // Read the current counter value before the test
  const before = await pool.query<{ value: number }>(
    'SELECT value FROM notice_counter WHERE id = 1'
  );
  if (before.rows.length === 0) {
    console.error('❌ notice_counter row not found. Run `npm run db:seed` first.');
    await pool.end();
    process.exit(1);
  }
  const startValue = before.rows[0].value;
  console.log(`📊 Starting counter value: ${startValue}`);
  console.log(`🚀 Firing ${CONCURRENCY} concurrent UPDATE...RETURNING calls...\n`);

  // Fire all increments concurrently — each is its own UPDATE ... RETURNING
  const promises: Promise<string>[] = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    promises.push(
      pool
        .query<{ value: number }>(
          'UPDATE notice_counter SET value = value + 1 WHERE id = 1 RETURNING value'
        )
        .then((result) => {
          const counter = result.rows[0].value;
          return `SPA-${String(counter).padStart(3, '0')}`;
        })
    );
  }

  const results = await Promise.all(promises);

  // Read the counter value after all calls
  const after = await pool.query<{ value: number }>(
    'SELECT value FROM notice_counter WHERE id = 1'
  );
  const endValue = after.rows[0].value;

  // ─── Verification ───────────────────────────────────────────────

  // 1. Check uniqueness
  const unique = new Set(results);
  const allUnique = unique.size === results.length;

  // 2. Extract numeric values and check for contiguous sequence
  const numbers = results
    .map((r) => parseInt(r.replace('SPA-', ''), 10))
    .sort((a, b) => a - b);

  const expectedStart = startValue + 1;
  const expectedEnd = startValue + CONCURRENCY;
  const expectedSequence = Array.from(
    { length: CONCURRENCY },
    (_, i) => expectedStart + i
  );

  const isContiguous =
    JSON.stringify(numbers) === JSON.stringify(expectedSequence);

  // 3. Check final counter value
  const counterCorrect = endValue === expectedEnd;

  // ─── Output ─────────────────────────────────────────────────────

  console.log('─── Results ───────────────────────────────────────');
  console.log(`Returned notice numbers (sorted):`);
  // Show them in a compact format
  const sorted = [...results].sort((a, b) => {
    const na = parseInt(a.replace('SPA-', ''), 10);
    const nb = parseInt(b.replace('SPA-', ''), 10);
    return na - nb;
  });
  for (const num of sorted) {
    console.log(`  ${num}`);
  }

  console.log('\n─── Checks ────────────────────────────────────────');
  console.log(
    `${allUnique ? '✅' : '❌'} All ${results.length} notice numbers are unique (${unique.size} distinct)`
  );
  console.log(
    `${isContiguous ? '✅' : '❌'} Numbers form a contiguous sequence: ${expectedStart}..${expectedEnd}`
  );
  console.log(
    `${counterCorrect ? '✅' : '❌'} Final counter value: ${endValue} (expected ${expectedEnd})`
  );

  if (allUnique && isContiguous && counterCorrect) {
    console.log('\n🎉 ALL CHECKS PASSED — concurrency-safe!');
  } else {
    console.log('\n💥 SOME CHECKS FAILED — see above');
    if (!allUnique) {
      // Find duplicates
      const seen = new Map<string, number>();
      for (const r of results) {
        seen.set(r, (seen.get(r) ?? 0) + 1);
      }
      for (const [k, v] of Array.from(seen.entries())) {
        if (v > 1) console.log(`   Duplicate: ${k} appeared ${v} times`);
      }
    }
    if (!isContiguous) {
      // Find gaps
      const numSet = new Set(numbers);
      const gaps: number[] = [];
      for (let i = expectedStart; i <= expectedEnd; i++) {
        if (!numSet.has(i)) gaps.push(i);
      }
      if (gaps.length > 0) {
        console.log(`   Gaps at positions: ${gaps.join(', ')}`);
      }
    }
  }

  await pool.end();
}

main().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
