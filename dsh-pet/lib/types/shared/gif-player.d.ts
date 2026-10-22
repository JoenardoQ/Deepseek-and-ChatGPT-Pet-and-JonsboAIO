export declare class GifPlayer {
    readonly canvas: HTMLCanvasElement;
    ready: boolean;
    private decoder;
    private timer;
    private request;
    private generation;
    private once;
    private url;
    private ended;
    constructor(container: HTMLElement);
    stop(): void;
    play(url: string, once: boolean, ended: () => void): Promise<void>;
    finishLoop(): void;
    dispose(): void;
}
