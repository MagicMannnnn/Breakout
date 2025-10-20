import Ball from "./ball";

export default class Block {
  static maxHits: number = 10; // highest number of hits for color scaling

  x: number;
  y: number;
  width: number;
  height: number;
  hits: number;
  startHits: number;
  color: string;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    hits: number = 1
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.hits = hits;
    this.startHits = hits;
    this.color = this.getColor();
  }

  private getColor(): string {
    // clamp ratio between 0 (min) and 1 (max)
    const ratio = Math.min(this.hits / Block.maxHits, 1);

    // Interpolate between green (low) → purple (high)
    // green = (0, 255, 0)
    // purple = (128, 0, 128)
    const r = Math.round(0 + (128 - 0) * ratio);
    const g = Math.round(255 - 255 * ratio);
    const b = Math.round(0 + (128 - 0) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.color = this.getColor();
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    ctx.fillStyle = "#fff";
    ctx.font = `${Math.floor(this.height * 0.5)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      this.hits.toString(),
      this.x + this.width / 2,
      this.y + this.height / 2
    );
  }

  collideBall(
    ball: Ball,
    restitution: number = 1.0,
    tangentialDamp: number = 0.0
  ): boolean {
    const r = (ball.constructor as typeof Ball).radius;

    // 1) Find closest point on the rect to the ball center (circle–AABB)
    const closestX = Math.max(this.x, Math.min(ball.x, this.x + this.width));
    const closestY = Math.max(this.y, Math.min(ball.y, this.y + this.height));

    // Vector from closest point to circle center
    let nx = ball.x - closestX;
    let ny = ball.y - closestY;

    let distSq = nx * nx + ny * ny;

    // No overlap?
    if (distSq >= r * r) return false;

    let dist = Math.sqrt(distSq);

    // 2) Compute a safe collision normal
    // If dist == 0, the center is exactly on the closest point (e.g., the circle center is inside the rect,
    // or numerically identical to a corner). Derive a normal using minimum penetration to sides.
    if (dist === 0) {
      // Overlaps to each rect face from the ball center
      const leftOverlap = Math.abs(ball.x - this.x);
      const rightOverlap = Math.abs(this.x + this.width - ball.x);
      const topOverlap = Math.abs(ball.y - this.y);
      const bottomOverlap = Math.abs(this.y + this.height - ball.y);
      const minOverlap = Math.min(
        leftOverlap,
        rightOverlap,
        topOverlap,
        bottomOverlap
      );

      if (minOverlap === leftOverlap) {
        nx = -1;
        ny = 0;
      } else if (minOverlap === rightOverlap) {
        nx = 1;
        ny = 0;
      } else if (minOverlap === topOverlap) {
        nx = 0;
        ny = -1;
      } else {
        nx = 0;
        ny = 1;
      }

      dist = 0; // keep for penetration calc below
    } else {
      // Normalize (corner normals come out naturally here)
      nx /= dist;
      ny /= dist;
    }

    // 3) Positional correction to resolve penetration
    // Penetration depth is how far the circle needs to move along the normal to clear the rect.
    // If dist == 0, treat penetration as full radius.
    const penetration = dist > 0 ? r - dist : r;

    // A tiny slop avoids sticky oscillations due to numeric error.
    const slop = 0.5;
    ball.x += (penetration + slop) * nx;
    ball.y += (penetration + slop) * ny;

    // 4) Reflect velocity across the collision normal
    // Only reflect if moving INTO the surface (negative normal component).
    const vn = ball.vx * nx + ball.vy * ny; // normal component
    if (vn < 0) {
      // Perfect elastic reflection would be v' = v - 2*vn*n
      // With restitution e: v' = v - (1 + e) * vn * n
      ball.vx = ball.vx - (1 + restitution) * vn * nx;
      ball.vy = ball.vy - (1 + restitution) * vn * ny;

      // Optional tangential damping (simple model for friction/spin loss):
      // Remove a fraction of the tangential component.
      if (tangentialDamp > 0) {
        // Tangential component: vt = v - (v·n)n
        const vAfterN = ball.vx * nx + ball.vy * ny; // recompute after normal reflection
        const tx = ball.vx - vAfterN * nx;
        const ty = ball.vy - vAfterN * ny;
        const scale = Math.max(0, 1 - tangentialDamp); // clamp
        ball.vx = vAfterN * nx + tx * scale;
        ball.vy = vAfterN * ny + ty * scale;
      }
    }

    // 5) Bookkeeping for your block/brick
    this.hits -= ball.damage;
    this.color = this.getColor();

    return true;
  }

  isDestroyed(): boolean {
    return this.hits <= 0;
  }
}
