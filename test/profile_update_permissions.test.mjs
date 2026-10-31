import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

test('profile update sends only granted columns even with untrusted runtime fields', async () => {
  const source = fs.readFileSync(new URL('../src/lib/supabase/auth.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  let sent;
  const chain = { update(value) { sent = value; return this; }, eq() { return this; }, select() { return this; }, async single() { return { data: sent, error: null }; } };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputText)(() => ({ supabase: { from: () => chain } }), module, module.exports);
  const result = await module.exports.updateCustomerProfile('customer', {
    full_name: 'Customer', phone_number: '123', avatar_url: null,
    role: 'admin', id: 'other', updated_at: 'forged', created_at: 'forged',
  });
  assert.deepEqual(result, { full_name: 'Customer', phone_number: '123', avatar_url: null });
});
