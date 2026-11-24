import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

// Execute the real component event handlers with isolated React hook state and
// a synthetic Supabase adapter. No account, message, or hosted service is used.
const require = createRequire(import.meta.url);
const source = ts.transpileModule(readFileSync('components/AdminFeedbackClient.tsx', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
function harness(save) {
  const state = [];
  let cursor = 0;
  let calls = 0;
  const hooks = {
    useState(value) {
      const index = cursor++;
      if (!(index in state)) state[index] = value;
      return [state[index], next => { state[index] = typeof next === 'function' ? next(state[index]) : next; }];
    },
    useRef(value) {
      const index = cursor++;
      if (!(index in state)) state[index] = { current: value };
      return state[index];
    },
  };
  const adapter = { from(table) {
    assert.equal(table, 'feedback_messages');
    return { update({ status }) { return { eq(key, id) {
      assert.equal(key, 'id');
      return { select() { return { single() { calls++; return save(id, status); } }; } };
    } }; } };
  } };
  const compiledModule = { exports: {} };
  vm.runInNewContext(source, { exports: compiledModule.exports, module: compiledModule, require(name) {
    if (name === 'react') return hooks;
    if (name === '@/lib/supabase/client') return { createClient: () => adapter };
    return require(name);
  } });
  const messages = [{ id: 'synthetic-1', name: 'Test Member', email: 'member@example.test', message: 'Please improve the menu', status: 'new', created_at: '2026-11-12T12:00:00Z' }];
  function render() { cursor = 0; return compiledModule.exports.default({ messages }); }
  function nodes(node, predicate) {
    if (Array.isArray(node)) return node.flatMap(child => nodes(child, predicate));
    if (!node || typeof node !== 'object') return [];
    return [...(predicate(node) ? [node] : []), ...nodes(node.props?.children, predicate)];
  }
  return { render, calls: () => calls,
    find: (tree, predicate) => nodes(tree, predicate),
    review: tree => nodes(tree, node => node.props?.['aria-label']?.startsWith('Mark feedback'))[0].props.onClick(),
  };
}

test('failed saves and denied/empty updates retain the unread message and allow retry', async () => {
  for (const response of [{ error: { message: 'denied' }, data: null }, { error: null, data: null }, { error: null, data: { id: 'synthetic-1', status: 'new' } }, new Error('offline')]) {
    const app = harness(async () => { if (response instanceof Error) throw response; return response; });
    await app.review(app.render());
    const tree = app.render();
    assert.equal(app.find(tree, n => n.props?.role === 'alert').length, 1);
    assert.equal(app.find(tree, n => n.props?.['aria-label']?.startsWith('Mark feedback')).length, 1);
    await app.review(tree);
    assert.equal(app.calls(), 2);
  }
});

test('save waits for confirmation, blocks duplicate clicks, then updates the queue', async () => {
  let finish;
  const app = harness((id, status) => new Promise(resolve => { finish = () => resolve({ data: { id, status }, error: null }); }));
  const initial = app.render();
  const first = app.review(initial);
  await app.review(initial);
  assert.equal(app.calls(), 1);
  const busy = app.render();
  assert.equal(app.find(busy, n => n.props?.['aria-busy'] === true).length, 1);
  assert.ok(app.find(busy, n => n.type === 'button' && n.props?.disabled).length >= 2);
  finish();
  await first;
  const done = app.render();
  assert.equal(app.find(done, n => n.props?.role === 'alert').length, 0);
  assert.equal(app.find(done, n => n.props?.['aria-label']?.startsWith('Mark feedback')).length, 0);
  assert.ok(app.find(done, n => n.props?.role === 'status' && String(n.props.children).includes('Feedback marked reviewed.')).length);
});

test('search combines with status and show all restores access to hidden messages', () => {
  const app = harness(async () => ({}));
  let tree = app.render();
  app.find(tree, n => n.props?.id === 'feedback-search')[0].props.onChange({ target: { value: 'no match' } });
  tree = app.render();
  assert.equal(app.find(tree, n => n.props?.['aria-label']?.startsWith('Mark feedback')).length, 0);
  app.find(tree, n => n.type === 'button' && n.props?.children === 'Show all feedback')[0].props.onClick();
  tree = app.render();
  assert.equal(app.find(tree, n => n.props?.id === 'feedback-search')[0].props.value, '');
  assert.equal(app.find(tree, n => n.props?.['aria-label']?.startsWith('Mark feedback')).length, 1);
});
