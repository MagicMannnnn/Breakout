import Ball from "./ball";

export default class BallManager {
  balls: Ball[] = [];
  width: number;
  height: number;
  ctx: CanvasRenderingContext2D;

  private maxVel = 1100;
  private minVel = 200;

  constructor(width: number, height: number, ctx: CanvasRenderingContext2D) {
    this.width = width;
    this.height = height;
    this.ctx = ctx;
  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  addBall(x: number, y: number, vx: number, vy: number, damage: number = 1): void {
    this.balls.push(new Ball(x, y, vx, vy, damage));
  }

  computeSpeed(clampedDist: number, maxDist: number): number {
    const strength = clampedDist / maxDist;
    const eased = Math.pow(strength, 1.5);
    return this.minVel + (this.maxVel - this.minVel) * eased;
  }

  update(dt: number): void {
    var nextBalls: Ball[] = [];
    for (let b of this.balls) {
      b.move(dt);
      b.collideBounds(this.width, this.height);
      if (b.alive) {
        nextBalls.push(b);
      }
    }
    this.balls = nextBalls;

    // Ball-ball collisions
    for (let i = 0; i < this.balls.length; i++) {
      for (let j = i + 1; j < this.balls.length; j++) {
        this.balls[i].collideBall(this.balls[j]);
      }
    }
  }

  draw(): void {
    for (let b of this.balls) {
      b.draw(this.ctx);
    }
  }
}
