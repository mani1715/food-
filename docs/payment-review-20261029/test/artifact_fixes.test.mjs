import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('financial table privilege block appears after refund operation table creation', async () => {
  const sql = await readFile(new URL('supabase/migrations/20261029110000_aishu_payment_lifecycle_hardening.sql', root), 'utf8');
  const table = sql.indexOf('CREATE TABLE IF NOT EXISTS public.payment_refund_operations');
  const privileges = sql.indexOf('-- Explicit least-privilege table privileges');
  assert.notEqual(table, -1);
  assert.notEqual(privileges, -1);
  assert.ok(privileges > table, 'privilege statements must not reference payment_refund_operations before it exists');
});

test('read-only preflight uses usage_privileges object columns and namespace lookup', async () => {
  const sql = await readFile(new URL('preflight_read_only.sql', root), 'utf8');
  assert.match(sql, /SELECT object_schema, object_name, grantee, privilege_type\s+FROM information_schema\.usage_privileges/);
  assert.match(sql, /object_type='SEQUENCE' AND object_schema='public'/);
  assert.match(sql, /object_name IN \('order_number_seq','tracking_code_seq'\)/);
  assert.match(sql, /to_regnamespace\('supabase_migrations'\) AS migration_schema/);
  assert.doesNotMatch(sql, /to_regclass\('supabase_migrations'\) AS migration_schema/);
});
