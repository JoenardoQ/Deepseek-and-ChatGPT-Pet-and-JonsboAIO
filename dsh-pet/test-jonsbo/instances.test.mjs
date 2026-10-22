import test from 'node:test';
import assert from 'node:assert/strict';
import { Sources, sourceKey } from '../bridge/sources.mjs';
import { Projection } from '../bridge/projection.mjs';
import { Duets } from '../bridge/duets.mjs';
import { createBridge } from '../bridge/server.mjs';
const presence = (instanceId, character = 'fish') => ({
  instanceId,
  character,
  desktop: true,
  build: 'test',
  name: 'test pet',
  ready: true,
  error: null,
});

test('same-host windows retain frames and selection across interleaved heartbeats and capture gaps', () => {
  let now = 0;
  const s = new Sources(() => now);
  s.touch('dsh', presence('one'));
  s.touch('dsh', presence('two', 'whale'));
  s.put('dsh', { instanceId: 'one', png: 'first' });
  s.put('dsh', { instanceId: 'two', png: 'second' });
  assert.equal(s.frames.size, 2);
  assert.equal(s.current().png, 'first');
  s.select('dsh:two');
  s.put('dsh', { instanceId: 'one', png: 'new first' });
  assert.equal(s.current().png, 'second');
  now = 3500;
  s.touch('dsh', presence('two', 'whale'));
  s.put('dsh', { instanceId: 'one', png: 'first again' });
  assert.equal(s.selected().key, 'dsh:two');
  assert.equal(s.current(), undefined, 'do not silently show another pet during capture gaps');
  now = 10000;
  s.touch('dsh', presence('one'));
  assert.equal(s.selected().key, 'dsh:one');
  assert.throws(() => sourceKey('dsh', ''));
  assert.throws(() => sourceKey('dsh', {}));
});

test('projection intent is per instance; preview demand expires and each retry has a generation', () => {
  let now = 100;
  const s = new Sources(() => now),
    p = new Projection(s, () => now);
  s.touch('dsh', presence('one'));
  s.touch('dsh', presence('two'));
  p.set('dsh:one', false);
  assert.equal(p.selected().key, 'dsh:two');
  assert.equal(p.capture('dsh:one', [], true).enabled, false);
  p.preview('dsh:one');
  assert.equal(p.capture('dsh:one', [], false).enabled, true);
  now += 2501;
  assert.equal(p.capture('dsh:one', [], false).enabled, false);
  p.set('dsh:one', true);
  p.set('dsh:one', false);
  p.set('dsh:one', true);
  assert.equal(p.generation, 4);
  assert.equal(p.capture('dsh:one', [], true).enabled, true);
});

test('duet selects one eligible stable pair, even with unrelated pets in the same hosts', () => {
  const s = new Sources(),
    d = new Duets();
  s.touch('dsh', presence('whale', 'whale'));
  s.touch('dsh', presence('fish'));
  s.touch('chatgpt', presence('first', 'chatgpt'));
  s.touch('chatgpt', presence('second', 'chatgpt'));
  const control = { visible: true, desktop: true };
  let pair = d.snapshot(s, control);
  assert.equal(pair.active, true);
  assert.equal(pair.participants.dsh.key, 'dsh:fish');
  assert.equal(pair.participants.chatgpt.key, 'chatgpt:first');
  s.put('chatgpt', { instanceId: 'second', character: 'chatgpt' });
  pair = d.snapshot(s, control);
  assert.equal(pair.participants.chatgpt.key, 'chatgpt:first');
  s.removeSource('chatgpt');
  assert.equal(d.snapshot(s, control).active, false);
  assert.equal(s.instances().size, 2);
});

test('HTTP selection, capture demand and connection changes target the exact pet', async (t) => {
  const server = createBridge({ launch: false });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  t.after(() => new Promise((r) => server.close(r)));
  const base = 'http://127.0.0.1:' + server.address().port;
  const post = async (route, body) => {
    const r = await fetch(base + route, {
      method: 'POST',
      headers: { 'X-Pet-Client': '1', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: r.status, value: await r.json() };
  };
  for (const id of ['one', 'two']) await post('/presence', { source: 'dsh', ...presence(id) });
  let result = await post('/device/source', { source: 'dsh', instanceId: 'two' });
  assert.equal(result.value.screenInstance, 'dsh:two');
  assert.equal(result.value.pets.length, 2);
  result = await post('/device/connection', { source: 'dsh', instanceId: 'two', enabled: false });
  assert.equal(result.value.screenInstance, 'dsh:one');
  assert.equal(result.value.pets.find((p) => p.instanceId === 'two').screen, false);
  const generation = result.value.generation;
  result = await post('/device/connection', { source: 'dsh', instanceId: 'two', enabled: true });
  assert.ok(result.value.generation > generation);
  assert.equal(result.value.screenInstance, 'dsh:two');
  assert.equal((await post('/device/source', { source: 'dsh', instanceId: 'missing' })).status, 409);
  assert.equal((await post('/device/source', { source: 'dsh', instanceId: '../../' })).status, 400);
  assert.equal((await post('/device/options', { rotation: 45 })).status, 400);
  assert.equal((await post('/device/options', { rotation: 180 })).value.screenOptions.rotation, 180);
  assert.equal((await post('/presence', { source: 'dsh', ...presence('one') })).value.capture.enabled, false);
  await fetch(base + '/frame.png?source=dsh%3Aone');
  assert.equal((await post('/presence', { source: 'dsh', ...presence('one') })).value.capture.enabled, true);
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
  await post('/frame', { source: 'dsh', instanceId: 'two', png, animation: 'idle' });
  result = await post('/presence', { source: 'dsh', ...presence('two') });
  assert.equal(result.value.pets.length, 2, 'no ghost legacy instance');
  assert.equal(JSON.stringify(result.value).includes(png), false, 'state must not repeat PNG payloads');
});
