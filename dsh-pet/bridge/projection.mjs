/** Screen intent and preview demand are independent of desktop visibility. */
export class Projection {
  constructor(sources, now = Date.now) {
    this.sources = sources;
    this.now = now;
    this.enabled = new Map();
    this.previews = new Map();
    this.generation = 0;
  }
  set(key, enabled) {
    this.enabled.set(key, enabled);
    this.generation++;
  }
  excluded(hosts = []) {
    const online = this.sources.instances();
    for (const key of this.enabled.keys()) if (!online.has(key)) this.enabled.delete(key);
    // Explicit per-window intent overrides a previous legacy host-wide switch.
    return [...online.values()]
      .filter((p) => this.enabled.get(p.key) === false || (!this.enabled.has(p.key) && hosts.includes(p.source)))
      .map((p) => p.key);
  }
  selected(hosts = []) {
    return this.sources.selected(this.excluded(hosts));
  }
  preview(key) {
    const pet = this.sources.resolve(key);
    if (pet) this.previews.set(pet.key, this.now() + 2500);
  }
  capture(key, hosts, usb) {
    for (const [id, expires] of this.previews) if (expires <= this.now()) this.previews.delete(id);
    const screen = usb && this.selected(hosts)?.key === key;
    return { enabled: !!screen || this.previews.has(key), fps: screen ? 24 : 8 };
  }
}
