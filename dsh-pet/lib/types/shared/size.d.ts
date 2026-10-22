import type { MenuBranch } from './menu';
export type SizeAction = 'size-up' | 'size-down' | 'size-reset';
export declare function isSizeAction(value: unknown): value is SizeAction;
export declare function nextSizePercent(current: number, action: SizeAction): number;
export declare function sizeMenu(percent?: number): MenuBranch;
export declare function resizePet(base: string, petId: string, action: SizeAction): Promise<void>;
