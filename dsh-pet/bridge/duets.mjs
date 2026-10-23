// One stable pair per bridge. Scene metadata declares the supported characters.
import scenes from '../assets/pets/duo/actions.json' with { type: 'json' };
export const ACTIONS = scenes.map((scene) => scene.id);
export class Duets {
  constructor({ now = Date.now, mode = 'auto', persist = () => {}, catalog = scenes } = {}) {
    this.now = now;
    this.catalog = catalog;
    this.mode = ['auto', 'off', ...catalog.map((s) => s.id)].includes(mode) ? mode : 'auto';
    this.persist = persist;
    this.startedAt = null;
  }
  set(mode) {
    if (!['auto', 'off', ...this.catalog.map((s) => s.id)].includes(mode)) throw Error('Invalid duet action');
    this.persist(mode);
    this.mode = mode;
    this.startedAt = null;
  }
  snapshot(sources, control) {
    const online = [...sources.instances().values()];
    const candidates = this.catalog.filter((s) => this.mode === 'auto' || this.mode === 'off' || s.id === this.mode);
    const matching = (dsh, gpt) =>
      candidates.filter(
        (s) => [...s.participants].sort().join('|') === [dsh?.character, gpt?.character].sort().join('|'),
      );
    const visible = online.filter((p) => p.desktop !== false);
    const pairs = visible
      .filter((p) => p.source === 'dsh')
      .flatMap((dsh) =>
        visible.filter((p) => p.source === 'chatgpt').map((gpt) => ({ dsh, gpt, scenes: matching(dsh, gpt) })),
      )
      .filter((pair) => pair.scenes.length);
    const pair = pairs.find((p) => p.dsh.key === this.dshKey && p.gpt.key === this.gptKey) || pairs[0];
    const dsh = pair?.dsh || online.find((p) => p.source === 'dsh');
    const gpt = pair?.gpt || online.find((p) => p.source === 'chatgpt');
    const selected = pair?.scenes || matching(dsh, gpt);
    const identity = [dsh?.key, dsh?.character, gpt?.key, gpt?.character].join('|');
    if (identity !== this.identity) this.startedAt = null;
    this.identity = identity;
    this.dshKey = dsh?.key;
    this.gptKey = gpt?.key;
    const eligible = !!(pair && control.visible && control.desktop);
    const active = eligible && this.mode !== 'off';
    if (!active) this.startedAt = null;
    else if (this.startedAt === null) this.startedAt = this.now();
    let action = null;
    if (active) {
      let elapsed = (this.now() - this.startedAt) % selected.reduce((sum, s) => sum + s.durationMs, 0);
      action = selected.find((s) => {
        if (elapsed < s.durationMs) return true;
        elapsed -= s.durationMs;
        return false;
      }).id;
    }
    const participant = (p) =>
      p
        ? {
            key: p.key,
            character: p.character,
            build: p.build || null,
            desktop: p.desktop !== false,
            error: p.error || null,
          }
        : null;
    return {
      participants: { dsh: participant(dsh), chatgpt: participant(gpt) },
      active,
      eligible,
      mode: this.mode,
      action,
      owner: 'chatgpt',
      startedAt: this.startedAt,
      reason: eligible
        ? null
        : !dsh
          ? 'DSH 桌宠尚未连接，请开启桌面显示。'
          : !gpt
            ? 'GPT 桌宠尚未连接，请开启桌宠。'
            : !selected.length
              ? '当前角色组合尚未提供所选双人场景。'
              : '请开启双方的桌面显示。',
    };
  }
}
