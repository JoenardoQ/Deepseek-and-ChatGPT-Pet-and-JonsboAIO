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
    persona: {
        prompt: string;
        work: string[][];
    };
    /** All media stays inside this pack; aliases preserve old host animation events. */
    actions: PetAction[];
    states: Record<string, string>;
    aliases: Record<string, string>;
    menu: 'actions' | 'upstream';
    dialogue: 'original' | 'translated';
}
export declare function validatePetPack(value: unknown): PetPack;
/** Register before constructing menus, stores or renderers. Duplicate IDs are errors. */
export declare function registerPetPack(value: unknown): PetPack;
export declare function petPacks(): readonly PetPack[];
export declare function getPetPack(id: string): PetPack;
export declare function hasPetPack(id: string): boolean;
export declare function resolvePackAction(id: string, name: string, state?: string): PetAction;
