const HOSTS = ['dsh', 'chatgpt'];

export function sourceKey(source, instanceId) {
  if (!HOSTS.includes(source)) throw Error('Invalid source');
  if (instanceId === undefined) return source; // Protocol 4 legacy clients.
  if (typeof instanceId !== 'string' || !/^[\w:.-]{1,120}$/.test(instanceId)) throw Error('Invalid instance identity');
  return `${source}:${instanceId}`;
}

/** Independent leases for each window. A capture gap must not switch its screen owner. */
export class Sources {
  constructor(now = Date.now) {
    this.now = now;
    this.frames = new Map();
    this.presence = new Map();
    this.preferred = null;
  }
  prune() {
    for (const [key, frame] of this.frames) if (this.now() - frame.at > 3000) this.frames.delete(key);
    for (const [key, info] of this.presence) if (this.now() - info.at > 6000) this.presence.delete(key);
  }
  touch(source, info) {
    const key = sourceKey(source, info.instanceId);
    this.presence.set(key, { ...info, source, key, at: this.now() });
    if (!this.preferred) this.preferred = key;
  }
  put(source, frame) {
    const key = sourceKey(source, frame.instanceId);
    this.prune();
    if (!this.preferred) this.preferred = key;
    this.frames.set(key, { ...frame, source, key, at: this.now() });
  }
  instances() {
    this.prune();
    const result = new Map([...this.frames].map(([key, frame]) => [key, { desktop: true, ...frame }]));
    for (const [key, info] of this.presence) {
      const frame = result.get(key);
      result.set(key, { ...frame, ...info, character: frame?.at > info.at ? frame.character : info.character });
    }
    return result;
  }
  // Keep host summaries for installed protocol 4 clients; new clients use instances().
  connected() {
    const result = new Map();
    for (const info of this.instances().values()) if (!result.has(info.source)) result.set(info.source, info);
    return result;
  }
  resolve(target) {
    const online = this.instances();
    return online.get(target) || [...online.values()].find((info) => info.source === target);
  }
  select(target) {
    const info = this.resolve(target);
    if (!info) return false;
    this.preferred = info.key;
    return true;
  }
  selected(excluded = []) {
    const available = [...this.instances().values()].filter(
      (info) => !excluded.includes(info.source) && !excluded.includes(info.key),
    );
    const chosen =
      available.find((info) => info.key === this.preferred) ||
      available.find((info) => info.source === this.preferred) ||
      available[0];
    if (!excluded.length && chosen) this.preferred = chosen.key;
    return chosen;
  }
  current(excluded = []) {
    return this.frames.get(this.selected(excluded)?.key);
  }
  removeSource(source) {
    for (const records of [this.frames, this.presence])
      for (const [key, info] of records) if (info.source === source) records.delete(key);
  }
}
