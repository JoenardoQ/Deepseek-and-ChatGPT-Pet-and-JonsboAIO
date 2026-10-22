import { type SizeAction } from '../shared/size';
export declare class PetSizeStore {
    private file;
    private values;
    constructor(file: string);
    set(id: string, action: SizeAction): number;
    decorate(cfg: Record<string, Record<string, unknown>>): Record<string, Record<string, unknown>>;
}
