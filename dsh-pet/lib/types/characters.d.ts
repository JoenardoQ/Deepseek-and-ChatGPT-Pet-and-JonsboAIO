import { type CharacterId } from '../shared/characters';
export declare class CharacterStore {
    private values;
    private file;
    constructor(file: string);
    get(petId: string): CharacterId;
    set(petId: string, id: unknown): CharacterId;
    decorate(cfg: Record<string, Record<string, unknown>>): Record<string, Record<string, unknown>>;
}
