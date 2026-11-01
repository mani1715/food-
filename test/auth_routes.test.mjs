import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
function loadComponent(file, mocks) {
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true,
  } });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', outputText)(name => mocks[name] ?? require(name), module, module.exports);
  return module.exports;
}

for (const [label, state, expected] of [
  ['initial session cannot render private content', { authLoading: true, supabaseUser: null }, 'Checking your session'],
  ['refreshing session cannot render private content', { authLoading: true, supabaseUser: { id: 'a' } }, 'Checking your session'],
  ['signed-out visitor returns to requested page after login', { authLoading: false, supabaseUser: null }, '/login?next=%2Forders%3Fstatus%3Dactive'],
  ['authenticated visitor can render protected content', { authLoading: false, supabaseUser: { id: 'a' } }, 'Private content'],
]) {
  test(label, () => {
    const { ProtectedRoute } = loadComponent('src/components/ProtectedRoute.tsx', {
      '../context/AppContext': { useApp: () => state },
      'react-router-dom': {
        useLocation: () => ({ pathname: '/orders', search: '?status=active' }),
        Navigate: ({ to }) => React.createElement('span', null, to),
        Outlet: () => React.createElement('span', null, 'Private content'),
      },
    });
    const html = renderToStaticMarkup(React.createElement(ProtectedRoute));
    assert.ok(html.includes(expected));
    if (state.authLoading || !state.supabaseUser) assert.ok(!html.includes('Private content'));
  });
}

for (const destination of ['https://evil.example', '//evil.example', '/admin', '/orders?status=active']) {
  test(`login return destination is constrained: ${destination}`, () => {
    const { AuthPage } = loadComponent('src/pages/customer/AuthPage.tsx', {
      '../../context/AppContext': { useApp: () => ({ authLoading: false, supabaseUser: { id: 'a' } }) },
      '../../lib/supabase/client': {},
      '../../lib/supabase/auth': {},
      'react-router-dom': {
        useSearchParams: () => [new URLSearchParams({ next: destination })],
        Navigate: ({ to }) => React.createElement('span', null, to),
      },
    });
    const html = renderToStaticMarkup(React.createElement(AuthPage));
    assert.equal(html, `<span>${destination.startsWith('/orders?') ? destination : '/profile'}</span>`);
  });
}
