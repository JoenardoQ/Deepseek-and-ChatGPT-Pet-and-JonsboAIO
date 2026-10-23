import { versionedAsset } from './asset-version';
import { buildMenuTree, type MenuNode, type MenuLeaf } from './menu';
import type { Animations } from './types';
import { DUET_ACTIONS, DUET_SCENES } from './duets';
import { getPetPack, petPacks, hasPetPack, resolvePackAction, type CharacterId, type AtlasCell } from './pet-pack';
export type { CharacterId } from './pet-pack';
export const CHARACTERS = petPacks().map(({ id, label }) => ({ id, label }));
export const CHARACTER_PERSONAS = Object.fromEntries(petPacks().map((p) => [p.id, p.persona]));
export const PRINCESS_ACTIONS = getPetPack('chatgpt').actions;
export function readCharacter(storage: Pick<Storage, 'getItem'>, petId: string): CharacterId {
  try {
    const id = storage.getItem('dsh-pet:character:' + petId);
    return id && hasPetPack(id) ? id : 'fish';
  } catch {
    return 'fish';
  }
}
export const characterState = function state(name: string): string {
  for (const [id, re] of [
    ['drag', /拖拽|提起|抓起|甩/],
    ['waiting', /等待|确认|审批/],
    ['review', /归档|整理|记录|核对/],
    ['balance', /余额|钱袋|金袋|金库|金币|数金|账本/],
    ['wake', /睡醒|揉眼/],
    ['sleeping', /睡|小憩|沉眠|瞌睡/],
    ['stretch', /伸懒腰|伸展/],
    ['wave', /挥手|问候|回应|互动/],
    ['blink', /blink|眨眼/],
    ['shy', /害羞|脸红|夸奖/],
    ['error', /叹气|皱眉|生气|失败|error|failure|低落|伤心/],
    ['thinking', /思考|张望|think/],
    ['working', /代码|忙碌|点按|敲击|work|tool/],
    ['success', /庆祝|开心|雀跃|成功|success/],
    ['tea', /茶|咖啡|喝水/],
    ['snack', /吃|零食|白饭|月饼|粽|饮食/],
    ['reading', /书|阅读/],
    ['garden', /花|浇水/],
    ['bow', /行礼|舞/],
    ['run', /跑|冲刺/],
    ['walk', /走|散步|转身|转向|移动/],
    ['magic', /魔法|星光|法杖/],
    ['play', /游戏|魔方|球|棋|玩/],
  ] as const)
    if (re.test(name)) return id;
  return 'idle';
};
export function characterAnimation(id: CharacterId, name: string): string {
  if (getPetPack(id).menu === 'upstream' && !name.startsWith('__pack-')) return name;
  return resolvePackAction(id, name, characterState(name)).id;
}
export function characterLabel(id: CharacterId): string {
  return getPetPack(id).label;
}
export function characterMenu(selected: CharacterId): MenuNode {
  return {
    label: '切换桌宠',
    children: petPacks().map((p) => ({
      label: (p.id === selected ? '✓ ' : '') + p.label,
      action: ('skin-' + p.id) as MenuLeaf['action'],
    })),
  };
}
export function characterAction(action: unknown): CharacterId | undefined {
  return petPacks().find((p) => action === 'skin-' + p.id)?.id;
}
export const DIALOGUE_IMAGES = [
  { original: '吃白饭的大肥鱼', name: '一起吃饭吧', description: '端着饭碗，邀请一起吃饭' },
  { original: 'token给妈妈保管', name: 'Token交给我保管', description: '拿着发光的Token金币，认真保管' },
  { original: '假如给我三天多模态', name: '想看见更多', description: '蒙着眼睛，期待看见更多' },
  { original: '先养着吧', name: '我会照顾你的', description: '温柔照看身边的小助手' },
  { original: '厉害了我的鲸', name: '做得很棒', description: '竖起大拇指，夸奖与认可' },
  { original: '压力一只大肥鱼', name: '压力有点大', description: '面对文件与任务，紧张冒汗' },
  { original: '可爱', name: '你好呀', description: '温柔微笑的正面问候' },
  { original: '吃饱饱摸肚子', name: '吃饱好满足', description: '满足地摸肚子，吃饱休息' },
  { original: '哦鲸鲸', name: '无语凝望', description: '平静无语的凝视' },
  { original: '哪来的电脑病毒', name: '拒绝恶意程序', description: '伸手制止恶意软件' },
  { original: '大师这个区是什么意思', name: '这个符号什么意思', description: '看着纸上符号，困惑求教' },
  { original: '大烧货', name: '认真思考中', description: '认真看代码，努力思考' },
  { original: '大的要来啦', name: '好消息来了', description: '举起小喇叭，宣布好消息' },
  { original: '大的药来了', name: '惊喜送达', description: '捧着巨大的胶囊状惊喜道具' },
  { original: '完蛋了把黄油删了', name: '不小心删错了', description: '误删文件后心虚与抱歉' },
  { original: '就一碗', name: '就吃一碗', description: '抱着一只大饭碗，开心蹭饭' },
  { original: '就骚了怎么滴吧', name: '理直气壮', description: '叉腰站好，理直气壮' },
  { original: '我不更新你们用什么', name: '该更新啦', description: '指着日历，提醒更新' },
  { original: '死掉了', name: '累得灵魂出窍', description: '疲惫趴下，小小灵魂飘出' },
  { original: '深度睡眠', name: '安静睡一会', description: '闭眼熟睡，安静休息' },
  { original: '电死你', name: '静电小警告', description: '拿着小静电棒，俏皮提醒' },
  { original: '要不直接骂他', name: '替你抱不平', description: '生气指向前方，替用户抱不平' },
  { original: '誓死践行开源精神', name: '认真践行开源', description: '庄重敬礼，认真表态' },
  { original: '除了调情没啥用', name: '陪你轻松聊聊', description: '手托脸颊，轻松俏皮地陪聊' },
  { original: '鱼片有资源吗', name: '可以分享资源吗', description: '期待地请求分享文件' },
  { original: '黎曼猜想没证明喵', name: '这道题有点难', description: '面对满纸算式，困惑但继续努力' },
  { original: 'Ciallo', name: '元气问候', description: '比耶眨眼，元气打招呼' },
] as const;

export function characterPrompt(id: CharacterId): string {
  return getPetPack(id).persona.prompt;
}
export function characterWorkTexts(id: CharacterId): readonly (readonly string[])[] {
  return getPetPack(id).persona.work;
}
export function characterMemeRoot(id: CharacterId, original = 'main'): string {
  return getPetPack(id).dialogue === 'original' ? original : '@' + id;
}
export function characterMemeName(id: CharacterId, name: string): string {
  return getPetPack(id).dialogue === 'original'
    ? name
    : DIALOGUE_IMAGES.find((m) => m.original === name || m.name === name)?.name || '';
}
export function characterMemeCatalog(): Record<string, string> {
  return Object.fromEntries(DIALOGUE_IMAGES.map((m) => [m.name, m.description]));
}
export function characterStorageKey(id: CharacterId, petId: string): string {
  return id + ':' + petId;
}
export async function saveCharacter(base: string, petId: string, id: CharacterId): Promise<void> {
  const response = await fetch(base + '/character', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ petId, character: id }),
  });
  if (!response.ok) throw Error('角色切换未能保存，请重试');
}
export function characterActionLabel(id: CharacterId, name: string): string {
  if (name.startsWith('__duet-'))
    return '双人互动 · ' + (DUET_ACTIONS.find(([key]) => key === name.slice(7))?.[1] || name);
  return resolvePackAction(id, name, characterState(name)).label;
}
export function characterActionMenu(id: CharacterId, animations: Animations): MenuNode[] {
  const pack = getPetPack(id);
  if (pack.menu === 'upstream') return buildMenuTree(animations);
  return [
    {
      label: pack.label + '的动作',
      children: [...new Set(pack.actions.map((a) => a.category))].map((category) => ({
        label: category,
        children: pack.actions
          .filter((a) => a.category === category)
          .map((a) => ({ label: a.label, anim: '__pack-' + id + '-' + a.id })),
      })),
    },
  ];
}
export interface CharacterMedia {
  path: string;
  kind: 'image' | 'video';
  cell?: AtlasCell;
  durationMs: number;
}
export function characterMedia(id: CharacterId, name: string, assetRoot = 'main', extension = '.webm'): CharacterMedia {
  const scene = DUET_SCENES.find((a) => name === '__duet-' + a.id);
  if (scene)
    return {
      path: versionedAsset('/thumb/@duo/' + scene.file.split('/').pop()),
      kind: 'image',
      cell: scene.cell,
      durationMs: scene.durationMs,
    };
  const pack = getPetPack(id);
  // User-authored fish animation directories retain the upstream override behavior.
  if (pack.menu === 'upstream' && !name.startsWith('__pack-'))
    return {
      path: '/thumb/' + encodeURIComponent(assetRoot) + '/' + encodeURIComponent(name) + extension,
      kind: 'video',
      durationMs: 10000,
    };
  const action = resolvePackAction(id, name, characterState(name));
  return {
    path: versionedAsset('/thumb/@' + id + '/' + encodeURIComponent(action.file.split('/').pop()!)),
    kind: action.kind,
    cell: action.cell,
    durationMs: action.durationMs,
  };
}
