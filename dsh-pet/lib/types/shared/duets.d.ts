import type { MenuNode } from './menu';
export declare const DUET_SCENES: {
    id: string;
    label: string;
    participants: string[];
    file: string;
    kind: string;
    durationMs: number;
    cell: {
        columns: number;
        rows: number;
        index: number;
    };
}[];
export declare const DUET_ACTIONS: (readonly [string, string])[];
export declare function duetMenu(): MenuNode;
