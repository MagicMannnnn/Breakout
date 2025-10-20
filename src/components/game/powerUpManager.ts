import Ball from "./ball";

export interface PowerUp {
  x: number;
  y: number;
  radius: number;
  type: string;
  color: string;
  alpha: number;
}

export default class PowerUpManager {
  powerUps: PowerUp[] = [];

  // spawn chance tuning
  private spawnChance = 1.0;
  private baseRadius = 16;
  private counter = 0;

  /**
   * Randomly attempts to spawn a power-up at the given coordinates.
   * Typically called when a block is destroyed or a round is advanced.
   */
  maybeSpawn(x: number, y: number): void {
    if (Math.random() < this.spawnChance) {
      this.spawnPowerUp(x, y, "Extra Ball");
    }
  }

  /**
   * Creates and stores a power-up.
   */
  spawnPowerUp(x: number, y: number, type: string): void {
    const color = "rgba(255, 251, 0, 1)"; // cyan glow
    const radius = this.baseRadius + Math.random() * 4;

    this.powerUps.push({
      x,
      y,
      radius,
      type,
      color,
      alpha: 0.9,
    });
  }

  /**
   * Draw all current power-ups on the canvas.
   */
  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.powerUps) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.radius * Math.abs(Math.cos(this.counter)), p.radius, 0, Math.PI * 2, 0);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Draw label text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      //ctx.fillText(p.type, p.x, p.y);
      ctx.restore();
    }

    this.counter += Math.PI / 60;
    this.counter %= Math.PI * 2;
  }

  /**
   * Update logic — check for ball overlap, handle pickup.
   * Returns true if any power-up was collected.
   */
  update(balls: Ball[]): boolean {
    let collected = false;

    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];

      for (const b of balls) {
        if (this.checkCollision(b, p)) {
          // Power-up collected
          collected = true;
          this.powerUps.splice(i, 1);
          break;
        }
      }
    }

    return collected;
  }

  /**
   * Checks if a ball overlaps a power-up (circle–circle collision).
   */
  private checkCollision(ball: Ball, powerUp: PowerUp): boolean {
    const dx = ball.x - powerUp.x;
    const dy = ball.y - powerUp.y;
    const distSq = dx * dx + dy * dy;
    const combined = powerUp.radius + (ball.constructor as typeof Ball).radius;
    return distSq <= combined * combined;
  }

  clear(): void {
    this.powerUps = [];
  }
}
