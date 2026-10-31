import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

for (const [role, permissions, allowed] of [
  ['sub_admin', [], false], ['sub_admin', ['*'], false],
  ['sub_admin', ['orders.cleanup'], true], ['admin', [], true], ['super_admin', [], true],
]) test(`cleanup authorization: ${role} ${JSON.stringify(permissions)}`, async () => {
  let handler, calls = 0;
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'staff' } } }) },
    from: () => ({ select(columns) {
      assert.ok(columns.includes('permissions'));
      return { eq() { return this; }, single: async () => ({ data: { role, status: 'active', permissions } }) };
    } }),
    rpc: async () => { calls++; return { data: { success: true }, error: null }; },
  };
  const source = fs.readFileSync(new URL('../supabase/functions/cleanup-unpaid-orders/index.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const mocks = name => name.includes('server.ts') ? { serve: fn => { handler = fn; } }
    : name.includes('supabase-js') ? { createClient: () => client }
    : { jsonResponse: body => Response.json(body), errorResponse: (error, status = 400) => Response.json({ error }, { status }) };
  new Function('require', 'Deno', 'exports', outputText)(mocks, { env: { get: name => name === 'SUPABASE_SERVICE_ROLE_KEY' ? 'service-test' : 'https://test.invalid' } }, {});
  const response = await handler(new Request('https://test.invalid', { method: 'POST', headers: { Authorization: 'Bearer staff-token' } }));
  assert.equal(response.status, allowed ? 200 : 403);
  assert.equal(calls, allowed ? 1 : 0);
});
