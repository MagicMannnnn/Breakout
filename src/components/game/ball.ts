export default class Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alive: boolean = true;
  damage: number;
  colour: string;
  static radius: number = 8;
  static maxDamage: number = 2;

  constructor(x: number, y: number, vx: number = 0, vy: number = 0, damage: number = 1) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    if (this.damage >= Ball.maxDamage) {
      Ball.maxDamage++;
    }
    console.log(damage);
    this.colour = `rgba(255, ${Math.max(0,255 - 255 * (this.damage == 1 ? this.damage - 1 : this.damage) / (Ball.maxDamage - 1))}, ${Math.max(0, 255 - 255 * (this.damage == 1 ? this.damage - 1 : this.damage) / (Ball.maxDamage - 1))}, 1)`
    console.log(this.colour);
  }

  move(dt: number): void {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  collideBounds(width: number, height: number): void {
    if (this.x < Ball.radius) {
      this.x = Ball.radius;
      this.vx *= -1;
    } else if (this.x > width - Ball.radius) {
      this.x = width - Ball.radius;
      this.vx *= -1;
    }

    if (this.y < Ball.radius) {
      this.y = Ball.radius;
      this.vy *= -1;
    } else if (this.y > height + Ball.radius) {
      this.alive = false;
    }
  }

  /** 
   * 🔹 Ball–Ball Collision using Verlet-like resolution 
   * 
   * - Separates overlapping balls
   * - Adjusts velocities along the collision normal
   */
  collideBall(other: Ball): void {
    const dx = other.x - this.x;
    const dy = other.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = Ball.radius * 2;

    // no collision
    if (dist === 0 || dist >= minDist) return;

    const overlap = 0.5 * (minDist - dist);

    const nx = dx / dist;
    const ny = dy / dist;

    this.x -= nx * overlap;
    this.y -= ny * overlap;
    other.x += nx * overlap;
    other.y += ny * overlap;

    // 🔸 Compute relative velocity
    const dvx = other.vx - this.vx;
    const dvy = other.vy - this.vy;
    const relVelAlongNormal = dvx * nx + dvy * ny;

    // If moving apart, do nothing
    if (relVelAlongNormal > 0) return;

    // 🔸 Compute simple elastic bounce (equal mass)
    const restitution = 1.0; // perfectly elastic
    const impulse = -(1 + restitution) * relVelAlongNormal / 2; // divide by 2 for equal mass

    // Apply impulse
    const ix = impulse * nx;
    const iy = impulse * ny;

    this.vx -= ix;
    this.vy -= iy;
    other.vx += ix;
    other.vy += iy;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    //this.colour = `rgb(255, ${Math.max(0, 255 - (this.damage-1) / (Ball.maxDamage - 1))}, ${Math.max(0, 255 - (this.damage-1) / (Ball.maxDamage - 1))})`
    ctx.beginPath();
    ctx.arc(this.x, this.y, Ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.colour;
    ctx.fill();
    ctx.closePath();
  }
}
