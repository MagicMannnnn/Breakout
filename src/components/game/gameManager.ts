import { UploadHandler } from "../uploadHandler";
import BallManager from "./ballManager";
import BlockManager from "./blockManager";
import GameTimer from "./gameTimer";
import PowerUpManager from "./powerUpManager";

export default class GameManager {
  ballManager: BallManager;
  blockManager: BlockManager;
  powerUpManager: PowerUpManager;
  timer: GameTimer;
  username: string;

  width: number;
  height: number;
  ctx: CanvasRenderingContext2D;

  score: number = -1;
  private iterations: number = 1;

  // React is the source of truth, but we keep mirrors here
  ballsAmount: number = 1;
  coins: number = -1;

  // NEW: base damage passed to every newly spawned ball
  private ballDamage: number = 1;
  private damages: number[] = [1];

  private roundBallTarget: number = 1;
  private spawnedThisRound: number = 0;

  private onScoreChange?: (score: number) => void;
  onBallsChange?: (balls: number) => void; // public so external code can call if needed
  private onCoinsChange?: (coins: number) => void;

  private spawnCounter: number = 0;

  private mouseDown = false;
  private justClicked = false;
  private justReleased = false;
  private mouseX = 0;
  private mouseY = 0;
  private clickStartX = 0;

  private arrowColor = "#ffffff";
  private arrowHeadLength = 12;
  private arrowBaseThickness = 4;
  private arrowMaxDistanceFraction = 0.5;
  private uploadedScore = false;

  private fired: boolean = true;

  constructor(
    username: string,
    width: number,
    height: number,
    ctx: CanvasRenderingContext2D,
    onScoreChange?: (score: number) => void,
    onBallsChange?: (balls: number) => void,
    onCoinsChange?: (coins: number) => void
  ) {
    this.username = username;
    this.width = width;
    this.height = height;
    this.ctx = ctx;

    this.timer = new GameTimer();
    this.update = this.update.bind(this);

    this.onScoreChange = onScoreChange;
    this.onBallsChange = onBallsChange;
    this.onCoinsChange = onCoinsChange;

    this.ballManager = new BallManager(width, height, ctx);
    this.blockManager = new BlockManager(width, height);
    this.powerUpManager = new PowerUpManager();

    window.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mouseup", this.handleMouseUp);
    window.addEventListener("mousemove", this.handleMouseMove);
    this.ctx.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  /** Current base damage for new balls. */
  public getBallDamage(): number {
    return this.ballDamage;
  }

  /** Increase base damage; newly spawned balls will use the updated value. */
  public increaseBallDamage(delta: number = 1): void {
    this.ballDamage = Math.max(1, this.ballDamage + delta);
    // If you want to inform React/UI, you could add an onDamageChange callback as well.
  }

  /** Keep GM synced with UI when the shop buys balls */
  public setBallCount(n: number): void {
    this.ballsAmount = n;
    this.onBallsChange?.(n);
    this.damages.push(this.ballDamage);
  }

  /** Award/remove coins and notify React */
  public addCoins(delta: number): void {
    this.coins += delta;
    this.onCoinsChange?.(this.coins);
  }

  private handleMouseDown = (e: MouseEvent) => {
    if (e.button === 2) {
      this.mouseDown = false;
      return;
    }
    if (e.button !== 0) return;

    if (this.blockManager.finished) return;

    this.mouseDown = true;
    this.justClicked = true;

    const rect = this.ctx.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;

    // Map CSS pixels -> canvas pixels
    this.mouseX = (e.clientX - rect.left) * scaleX;
    this.mouseY = (e.clientY - rect.top) * scaleY;
    this.clickStartX = this.mouseX;

    if (this.mouseX < 0 || this.mouseX > this.width) {
      this.mouseDown = false;
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (e.button !== 0) return;
    this.justReleased = this.mouseDown;
    this.mouseDown = false;
  };

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.ctx.canvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;

    // Map CSS pixels -> canvas pixels
    this.mouseX = (e.clientX - rect.left) * scaleX;
    this.mouseY = (e.clientY - rect.top) * scaleY;
  };

  start(): void {
    this.timer.start(this.update);
  }

  stop(): void {
    this.timer.stop();
    window.removeEventListener("mousedown", this.handleMouseDown);
    window.removeEventListener("mouseup", this.handleMouseUp);
    window.removeEventListener("mousemove", this.handleMouseMove);
  }

  increaseBallSpeed(): void {
    this.iterations++;
  }

  update(dt: number): void {
    // Clear / background
    this.ctx.fillStyle = "#494949ff";
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Aim + fire
    if (this.mouseDown && !this.fired) this.drawArrow();
    if (this.justReleased && !this.fired) this.releaseBall();

    this.justClicked = false;
    this.justReleased = false;

    // Spawn burst when fired
    this.spawnCounter++;
    if (
      this.fired &&
      this.spawnedThisRound < this.roundBallTarget &&
      this.spawnCounter % 3 === 0
    ) {
      const baseX = this.clickStartX;
      const baseY = this.height;
      const dx = this.mouseX - baseX;
      const dy = this.mouseY - baseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = this.height * this.arrowMaxDistanceFraction;
      const clampedDist = Math.min(dist, maxDist);
      const nx = dx / (dist || 1);
      const ny = dy / (dist || 1);
      const speed = this.ballManager.computeSpeed(clampedDist, maxDist);
      const vx = nx * speed;
      const vy = ny * speed;

      // NOTE: requires BallManager.addBall to accept (x, y, vx, vy, damage)
      this.ballManager.addBall(baseX, baseY - 10, vx, vy, this.damages[this.ballManager.balls.length]);
      this.spawnedThisRound++;
    }

    for (let i: number = 0; i < this.iterations; i++) {
        // Update world
      this.ballManager.update(dt);
      this.blockManager.update(this.ballManager.balls, this.ctx, this.powerUpManager);
      this.ballManager.draw();

      // Power-ups
      const collected = this.powerUpManager.update(this.ballManager.balls);
      this.powerUpManager.draw(this.ctx);

      // If update() returns a boolean meaning "collected something", award 1 coin.
      // If your PowerUpManager returns a count instead, replace with: this.addCoins(collected);
      if (collected) {
        this.addCoins(1);
      }
    }
    

    // Round / game over
    if (this.fired && this.ballManager.balls.length === 0 && !this.blockManager.finished) {
      this.nextRound();
    } else if (this.blockManager.finished) {
      this.ctx.save();
      this.ctx.fillStyle = "#fff";
      this.ctx.font = "700 128px system-ui, Segoe UI, Roboto, Arial, sans-serif";
      this.ctx.textAlign = "center";
      this.ctx.textBaseline = "middle";
      this.ctx.fillText("Game Over!", this.width / 2, this.height / 2);
      this.ctx.restore();
      if (!this.uploadedScore) {
        this.uploadedScore = true;
        UploadHandler.uploadScore(this.score, this.username);
      }
    }
  }

  private releaseBall(): void {
    this.fired = true;
    this.spawnCounter = 0;
    this.roundBallTarget = this.ballsAmount;
    this.spawnedThisRound = 0;

    const baseX = this.clickStartX;
    const baseY = this.height;
    const dx = this.mouseX - baseX;
    const dy = this.mouseY - baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = this.height * this.arrowMaxDistanceFraction;
    const clampedDist = Math.min(dist, maxDist);
    const nx = dx / (dist || 1);
    const ny = dy / (dist || 1);
    const speed = this.ballManager.computeSpeed(clampedDist, maxDist);
    const vx = nx * speed;
    const vy = ny * speed;

    // Pass damage into the spawned ball
    this.ballManager.addBall(baseX, baseY - 10, vx, vy, this.damages[this.ballManager.balls.length]);
    this.spawnedThisRound = 1;
  }

  private drawArrow(): void {
    const baseX = this.clickStartX;
    const baseY = this.height;
    const dx = this.mouseX - baseX;
    const dy = this.mouseY - baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = this.height * this.arrowMaxDistanceFraction;
    const clampedDist = Math.min(dist, maxDist);
    const nx = dx / (dist || 1);
    const ny = dy / (dist || 1);
    const visualScale = Math.pow(clampedDist / maxDist, 0.8);
    const arrowLength = maxDist * visualScale;
    const endX = baseX + nx * arrowLength;
    const endY = baseY + ny * arrowLength;
    const thickness =
      this.arrowBaseThickness +
      (clampedDist / maxDist) * this.arrowBaseThickness * 2;

    drawArrow(
      this.ctx,
      baseX,
      baseY,
      endX,
      endY,
      this.arrowColor,
      this.arrowHeadLength,
      thickness
    );
  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.ballManager.setSize(width, height);
  }

  nextRound(): void {
    if (!this.fired) return;
    this.score++;
    this.iterations = 1;
    this.addCoins(1);
    this.onScoreChange?.(this.score);
    this.fired = false;
    this.spawnedThisRound = 0;
    this.blockManager.nextRound(this.powerUpManager);
  }
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string = "#ffffff",
  baseHeadLength: number = 15,
  lineWidth: number = 3
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < baseHeadLength * 0.5) return;

  const headLength = baseHeadLength + lineWidth * 1.2;
  const shaftLength = length - headLength;

  const shaftEndX = x1 + Math.cos(angle) * shaftLength;
  const shaftEndY = y1 + Math.sin(angle) * shaftLength;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Shaft
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(shaftEndX, shaftEndY);
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLength * Math.cos(angle - Math.PI / 5),
    y2 - headLength * Math.sin(angle - Math.PI / 5)
  );
  ctx.lineTo(
    x2 - headLength * Math.cos(angle + Math.PI / 5),
    y2 - headLength * Math.sin(angle + Math.PI / 5)
  );
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}
