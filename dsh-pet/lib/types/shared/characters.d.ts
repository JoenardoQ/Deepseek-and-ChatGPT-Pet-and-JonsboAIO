import { type MenuNode } from './menu';
import type { Animations } from './types';
import { type CharacterId, type AtlasCell } from './pet-pack';
export type { CharacterId } from './pet-pack';
export declare const CHARACTERS: {
    id: string;
    label: string;
}[];
export declare const CHARACTER_PERSONAS: {
    [k: string]: {
        prompt: string;
        work: string[][];
    };
};
export declare const PRINCESS_ACTIONS: import("./pet-pack").PetAction[];
export declare function readCharacter(storage: Pick<Storage, 'getItem'>, petId: string): CharacterId;
export declare const characterState: (name: string) => string;
export declare function characterAnimation(id: CharacterId, name: string): string;
export declare function characterLabel(id: CharacterId): string;
export declare function characterMenu(selected: CharacterId): MenuNode;
export declare function characterAction(action: unknown): CharacterId | undefined;
export declare const DIALOGUE_IMAGES: readonly [{
    readonly original: "吃白饭的大肥鱼";
    readonly name: "一起吃饭吧";
    readonly description: "端着饭碗，邀请一起吃饭";
}, {
    readonly original: "token给妈妈保管";
    readonly name: "Token交给我保管";
    readonly description: "拿着发光的Token金币，认真保管";
}, {
    readonly original: "假如给我三天多模态";
    readonly name: "想看见更多";
    readonly description: "蒙着眼睛，期待看见更多";
}, {
    readonly original: "先养着吧";
    readonly name: "我会照顾你的";
    readonly description: "温柔照看身边的小助手";
}, {
    readonly original: "厉害了我的鲸";
    readonly name: "做得很棒";
    readonly description: "竖起大拇指，夸奖与认可";
}, {
    readonly original: "压力一只大肥鱼";
    readonly name: "压力有点大";
    readonly description: "面对文件与任务，紧张冒汗";
}, {
    readonly original: "可爱";
    readonly name: "你好呀";
    readonly description: "温柔微笑的正面问候";
}, {
    readonly original: "吃饱饱摸肚子";
    readonly name: "吃饱好满足";
    readonly description: "满足地摸肚子，吃饱休息";
}, {
    readonly original: "哦鲸鲸";
    readonly name: "无语凝望";
    readonly description: "平静无语的凝视";
}, {
    readonly original: "哪来的电脑病毒";
    readonly name: "拒绝恶意程序";
    readonly description: "伸手制止恶意软件";
}, {
    readonly original: "大师这个区是什么意思";
    readonly name: "这个符号什么意思";
    readonly description: "看着纸上符号，困惑求教";
}, {
    readonly original: "大烧货";
    readonly name: "认真思考中";
    readonly description: "认真看代码，努力思考";
}, {
    readonly original: "大的要来啦";
    readonly name: "好消息来了";
    readonly description: "举起小喇叭，宣布好消息";
}, {
    readonly original: "大的药来了";
    readonly name: "惊喜送达";
    readonly description: "捧着巨大的胶囊状惊喜道具";
}, {
    readonly original: "完蛋了把黄油删了";
    readonly name: "不小心删错了";
    readonly description: "误删文件后心虚与抱歉";
}, {
    readonly original: "就一碗";
    readonly name: "就吃一碗";
    readonly description: "抱着一只大饭碗，开心蹭饭";
}, {
    readonly original: "就骚了怎么滴吧";
    readonly name: "理直气壮";
    readonly description: "叉腰站好，理直气壮";
}, {
    readonly original: "我不更新你们用什么";
    readonly name: "该更新啦";
    readonly description: "指着日历，提醒更新";
}, {
    readonly original: "死掉了";
    readonly name: "累得灵魂出窍";
    readonly description: "疲惫趴下，小小灵魂飘出";
}, {
    readonly original: "深度睡眠";
    readonly name: "安静睡一会";
    readonly description: "闭眼熟睡，安静休息";
}, {
    readonly original: "电死你";
    readonly name: "静电小警告";
    readonly description: "拿着小静电棒，俏皮提醒";
}, {
    readonly original: "要不直接骂他";
    readonly name: "替你抱不平";
    readonly description: "生气指向前方，替用户抱不平";
}, {
    readonly original: "誓死践行开源精神";
    readonly name: "认真践行开源";
    readonly description: "庄重敬礼，认真表态";
}, {
    readonly original: "除了调情没啥用";
    readonly name: "陪你轻松聊聊";
    readonly description: "手托脸颊，轻松俏皮地陪聊";
}, {
    readonly original: "鱼片有资源吗";
    readonly name: "可以分享资源吗";
    readonly description: "期待地请求分享文件";
}, {
    readonly original: "黎曼猜想没证明喵";
    readonly name: "这道题有点难";
    readonly description: "面对满纸算式，困惑但继续努力";
}, {
    readonly original: "Ciallo";
    readonly name: "元气问候";
    readonly description: "比耶眨眼，元气打招呼";
}];
export declare function characterPrompt(id: CharacterId): string;
export declare function characterWorkTexts(id: CharacterId): readonly (readonly string[])[];
export declare function characterMemeRoot(id: CharacterId, original?: string): string;
export declare function characterMemeName(id: CharacterId, name: string): string;
export declare function characterMemeCatalog(): Record<string, string>;
export declare function characterStorageKey(id: CharacterId, petId: string): string;
export declare function saveCharacter(base: string, petId: string, id: CharacterId): Promise<void>;
export declare function characterActionLabel(id: CharacterId, name: string): string;
export declare function characterActionMenu(id: CharacterId, animations: Animations): MenuNode[];
export interface CharacterMedia {
    path: string;
    kind: 'image' | 'video';
    cell?: AtlasCell;
    durationMs: number;
}
export declare function characterMedia(id: CharacterId, name: string, assetRoot?: string, extension?: string): CharacterMedia;
