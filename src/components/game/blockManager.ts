import Block from "./block";
import Ball from "./ball";
import PowerUpManager from "./powerUpManager";

export default class BlockManager {
  blocks: Block[] = [];

  hardness: number = 1;
  canvasWidth: number;
  canvasHeight: number;
  finished: boolean = false;

  // layout settings
  private baseCols: number = 8;
  private minSpacing: number = 1;
  private rowHeight: number = 55;
  private blockHeight: number = 40;

  constructor(canvasWidth: number = 1200, canvasHeight: number = 800) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  setCanvasWidth(width: number): void {
    this.canvasWidth = width;
  }

  addBlock(x: number, y: number, width: number, height: number, hits: number = 1): void {
    this.blocks.push(new Block(x, y, width, height, hits));
  }

  update(balls: Ball[], ctx: CanvasRenderingContext2D, powerUpManager: PowerUpManager): void {
    for (let i = this.blocks.length - 1; i >= 0; i--) {
      const block = this.blocks[i];

      for (let b of balls) {
        const hit = block.collideBall(b);
        if (hit && block.isDestroyed()) {
          this.blocks.splice(i, 1);
          powerUpManager.maybeSpawn(block.x + block.width / 2, block.y + block.height / 2);
          break;
        }
      }
    }

    this.draw(ctx);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const block of this.blocks) {
      block.draw(ctx);
    }
  }

  clear(): void {
    this.blocks = [];
  }

  /**
   * Moves existing blocks down and spawns a new harder row.
   */
  nextRound(powerUpManager: PowerUpManager): void {
    this.hardness += 1;

    // ramp up global difficulty faster
    Block.maxHits = Math.max(Block.maxHits, 8 + Math.floor(this.hardness * 2.5));

    // move all blocks down one row
    for (const block of this.blocks) {
      block.y += this.rowHeight;
      if (block.y + block.height + this.rowHeight > this.canvasHeight) {
        this.finished = true;
      }
    }

    for (const powerup of powerUpManager.powerUps) {
      powerup.y += this.rowHeight;
    }

    this.spawnRow();
  }

  /**
   * Creates a new, randomized row of blocks that spans the full width.
   */
  private spawnRow(): void {
    const y = this.minSpacing + 50;

    // columns increase with difficulty
    const numCols = this.baseCols + Math.floor(this.hardness / 2);

    // spacing slightly random per round
    const spacing = this.minSpacing + Math.random() * 10;

    // block width fills the entire width across numCols + spacing gaps
    const blockWidth = (this.canvasWidth - spacing * (numCols + 1)) / numCols;

    // difficulty scaling
    const baseChance = 0.1 + Math.min(this.hardness * 0.02, 0.4);
    const maxHits = Math.ceil(2 + this.hardness * 1.5);

    var spawned: number = 0;

    while (spawned == 0) {
      for (let i = 0; i < numCols; i++) {
        if (Math.random() < baseChance) {
          spawned++;
          // make placement a little imperfect for visual variety
          //const jitter = (Math.random() - 0.5) * spacing * 0.8;
          const jitter = 0;
          const x = spacing + i * (blockWidth + spacing) + jitter;
          const hits = Math.ceil(1 + Math.random() * maxHits);
          this.addBlock(x, y, blockWidth, this.blockHeight, hits);
        }
      }
    }
    
  }
}
