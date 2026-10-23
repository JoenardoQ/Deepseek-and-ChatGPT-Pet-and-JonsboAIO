import type { AtlasCell } from './pet-pack';
/** Draw one static pose. The clock only ends an action or drives window motion;
 * no interpolated frames, video decoder, or continuous canvas redraw is used. */
export declare class ImagePosePlayer {
    readonly canvas: HTMLCanvasElement;
    ready: boolean;
    duration: number;
    private startedAt;
    private generation;
    private timer;
    private ended;
    private request;
    private finishRequested;
    get currentTime(): number;
    constructor(container: HTMLElement);
    stop(): void;
    play(url: string, once: boolean, ended: () => void, cell?: AtlasCell, durationMs?: number): Promise<void>;
    finishLoop(): void;
    dispose(): void;
}
