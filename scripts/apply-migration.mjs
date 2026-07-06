import { readFileSync } from 'fs';
import pg from 'pg';

async function main() {
  const sql = readFileSync(new URL('../prisma/migrations/0008_add_audit_system/migration.sql', import.meta.url), 'utf-8');

  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();
  console.log('Conectado ao banco.');

  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    try {
      await client.query(stmt + ';');
      console.log('OK:', stmt.slice(0, 80) + '...');
    } catch (err) {
      console.log('IGNORADO (pode já existir):', err.message.slice(0, 100));
    }
  }

  await client.end();
  console.log('Migration concluída.');
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
