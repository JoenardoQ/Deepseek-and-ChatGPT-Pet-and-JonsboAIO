/** Pure role contract. No host, DOM, filesystem or output-device dependencies. */
import { builtinPacks } from './generated-packs';
export type CharacterId = string;
export interface AtlasCell {
  columns: number;
  rows: number;
  index: number;
}
export interface PetAction {
  id: string;
  label: string;
  category: string;
  file: string;
  kind: 'image' | 'video';
  durationMs: number;
  cell?: AtlasCell;
}
export interface PetPack {
  schema: 1;
  id: CharacterId;
  label: string;
  persona: { prompt: string; work: string[][] };
  /** All media stays inside this pack; aliases preserve old host animation events. */
  actions: PetAction[];
  states: Record<string, string>;
  aliases: Record<string, string>;
  menu: 'actions' | 'upstream';
  dialogue: 'original' | 'translated';
}
const idPattern = /^[a-z][a-z0-9-]{0,63}$/;
export function validatePetPack(value: unknown): PetPack {
  const p = value as PetPack;
  if (!p || p.schema !== 1 || !idPattern.test(p.id) || !p.label?.trim()) throw Error('Invalid PetPack identity');
  if (
    !p.persona?.prompt ||
    !Array.isArray(p.persona.work) ||
    p.persona.work.length !== 6 ||
    p.persona.work.some((row) => !Array.isArray(row) || !row.length || row.some((t) => typeof t !== 'string'))
  )
    throw Error(`Invalid persona: ${p.id}`);
  if (!['actions', 'upstream'].includes(p.menu) || !['original', 'translated'].includes(p.dialogue))
    throw Error('Invalid pack behavior');
  if (!Array.isArray(p.actions) || !p.actions.length) throw Error('Pack has no actions');
  const ids = new Set<string>();
  for (const a of p.actions) {
    if (!idPattern.test(a.id) || ids.has(a.id) || !a.label || !a.category)
      throw Error(`Invalid or duplicate action: ${a.id}`);
    ids.add(a.id);
    // Reject Windows control characters in manifest filenames as well as traversal.
    // eslint-disable-next-line no-control-regex
    if (!/^(images|webm)\/[^\\/:*?"<>|\x00-\x1f]+\.(png|webp|webm)$/.test(a.file) || a.file.includes('..'))
      throw Error('Unsafe pack asset path');
    if (!(a.durationMs >= 100 && a.durationMs <= 60000)) throw Error('Invalid action duration');
    if (a.kind !== 'image' && a.kind !== 'video') throw Error('Unsupported media kind');
    if ((a.kind === 'video') !== a.file.endsWith('.webm')) throw Error('Media type does not match file');
    if (
      a.cell &&
      (a.kind !== 'image' ||
        !Number.isInteger(a.cell.columns) ||
        !Number.isInteger(a.cell.rows) ||
        a.cell.columns < 1 ||
        a.cell.rows < 1 ||
        !Number.isInteger(a.cell.index) ||
        a.cell.index < 0 ||
        a.cell.index >= a.cell.columns * a.cell.rows)
    )
      throw Error('Invalid atlas cell');
  }
  if (!p.states || !ids.has(p.states.idle)) throw Error('Pack requires an idle state');
  for (const target of [...Object.values(p.states), ...Object.values(p.aliases || {})])
    if (!ids.has(target)) throw Error(`Unknown action target: ${target}`);
  return p;
}
const packs = new Map<string, PetPack>();
/** Register before constructing menus, stores or renderers. Duplicate IDs are errors. */
export function registerPetPack(value: unknown): PetPack {
  const p = validatePetPack(value);
  if (packs.has(p.id)) throw Error(`Duplicate PetPack: ${p.id}`);
  packs.set(p.id, p);
  return p;
}
for (const pack of builtinPacks) registerPetPack(pack);
export function petPacks(): readonly PetPack[] {
  return [...packs.values()];
}
export function getPetPack(id: string): PetPack {
  const pack = packs.get(id);
  if (!pack) throw Error(`Unknown PetPack: ${id}`);
  return pack;
}
export function hasPetPack(id: string): boolean {
  return packs.has(id);
}
export function resolvePackAction(id: string, name: string, state = 'idle'): PetAction {
  const pack = getPetPack(id);
  const direct = name.startsWith(`__pack-${id}-`) ? name.slice(id.length + 8) : name;
  const key = pack.aliases[name] || direct;
  return (
    pack.actions.find((a) => a.id === key) ||
    pack.actions.find((a) => a.id === pack.states[state]) ||
    pack.actions.find((a) => a.id === pack.states.idle)!
  );
}
