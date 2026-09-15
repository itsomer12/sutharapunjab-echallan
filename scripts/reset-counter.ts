import 'dotenv/config';
import pg from 'pg';

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const r = await pool.query('UPDATE notice_counter SET value = 0 WHERE id = 1 RETURNING value');
  console.log('Counter reset to:', r.rows[0].value);
  await pool.end();
}

main();
