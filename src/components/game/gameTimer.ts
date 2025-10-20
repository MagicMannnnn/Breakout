

export default class GameTimer {
  private lastTime: number = 0;
  private running: boolean = false;

  start(callback: (dt: number) => void) {
    this.running = true;
    this.lastTime = performance.now();

    const loop = (time: number) => {
      if (!this.running) return;

      const dt = (time - this.lastTime) / 1000; // seconds
      this.lastTime = time;

      callback(dt); // your game update logic

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
  }
}
