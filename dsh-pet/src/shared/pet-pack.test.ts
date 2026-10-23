import test from 'node:test';
import assert from 'node:assert/strict';
import { getPetPack, petPacks, validatePetPack, registerPetPack, resolvePackAction } from './pet-pack';
import { characterMedia, characterMenu, characterActionMenu, characterPrompt, characterAnimation } from './characters';
import { decideAnim } from '../host/anim';
test('all three built-in pets use the same validated pack contract', () => {
  assert.equal(petPacks().length, 3);
  assert.equal(getPetPack('fish').actions.length, 106);
  assert.equal(getPetPack('whale').actions.length, 8);
  assert.equal(getPetPack('chatgpt').actions.length, 24);
  for (const pack of petPacks()) assert.equal(validatePetPack(pack), pack);
});
test('all ChatGPT actions and old event aliases resolve to a static PNG', () => {
  const pack = getPetPack('chatgpt');
  for (const name of [...pack.actions.map((a) => '__pack-chatgpt-' + a.id), ...Object.keys(pack.aliases)]) {
    const media = characterMedia('chatgpt', name);
    assert.equal(media.kind, 'image');
    assert.match(media.path, /\.png\?/);
    assert.ok(media.cell);
  }
  assert.equal(resolvePackAction('chatgpt', '__princess-013').id, 'working');
  assert.equal(resolvePackAction('chatgpt', '__pack-chatgpt-garden').id, 'garden');
  assert.equal(characterMedia('fish', '写代码').kind, 'video');
  assert.equal(characterAnimation('fish', '自定义动作'), '自定义动作');
  assert.equal(characterMedia('whale', '写代码').kind, 'video');
});
test('new pack drives menu, persona, media and host action API without engine edits', () => {
  const pack = structuredClone(getPetPack('chatgpt'));
  pack.id = 'test-companion';
  pack.label = 'New pet';
  pack.persona.prompt = 'Independent persona';
  registerPetPack(pack);
  assert.equal(characterPrompt(pack.id), 'Independent persona');
  assert.ok('children' in characterMenu(pack.id));
  assert.match(characterMedia(pack.id, '__pack-test-companion-tea').path, /@test-companion/);
  assert.ok(characterActionMenu(pack.id, {} as never).length);
  const cfg = { main: { pets: [{ id: 'main', character: pack.id }], animations: {} } };
  assert.equal(decideAnim({ cfg, requested: 'main', active: '', name: '__pack-test-companion-tea' }).ok, true);
  assert.equal(decideAnim({ cfg, requested: 'main', active: '', name: '__pack-test-companion-missing' }).ok, false);
  assert.throws(() => registerPetPack(pack), /Duplicate/);
});
test('untrusted manifests cannot traverse paths or reference missing actions/cells', () => {
  for (const file of ['../secret.png', 'images/../../secret.png', 'images/a\\b.png', 'https://host/track.png']) {
    const p = structuredClone(getPetPack('chatgpt'));
    p.actions[0].file = file;
    assert.throws(() => validatePetPack(p));
  }
  const p = structuredClone(getPetPack('chatgpt'));
  p.states.idle = 'missing';
  assert.throws(() => validatePetPack(p));
  p.states.idle = 'idle';
  p.actions[0].cell!.index = 8;
  assert.throws(() => validatePetPack(p));
});
