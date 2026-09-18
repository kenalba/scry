export {};
declare global {
  var WzrdzStarfield: {
    geometry(
      width: number,
      height: number,
      count?: number,
    ): { x: number; y: number; angle: number; duration: number; delay: number }[];
    mount(
      root: HTMLElement,
      options?: { fast?: boolean; paused?: boolean },
    ): { setFast(value: boolean): void; setPaused(value: boolean): void; destroy(): void };
  };
}
