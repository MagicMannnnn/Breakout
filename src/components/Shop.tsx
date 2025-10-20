import React, {useState} from "react";
import GameManager from "./game/gameManager";

type ShopProps = {
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  balls: number;
  setBalls: React.Dispatch<React.SetStateAction<number>>;
  gameManager: GameManager | null;
};

export default function Shop({
  coins,
  setCoins,
  balls,
  setBalls,
  gameManager,
}: ShopProps) {


    const [fib1, setFib1] = useState(1);
    const [fib2, setFib2] = useState(1);

  function buyBall() {
    if (!gameManager) return;
    const cost = Math.floor(fib1 + fib2); // pricing rule: cost equals current balls count (adjust as you like)
    if (coins >= cost) {
      setFib1(fib2);
      setFib2(cost);
      setCoins((prev) => prev - cost);
      gameManager.coins -= cost;
      setBalls((prev) => prev + 1);
      gameManager.setBallCount?.(balls + 1);
    }
  }

  function increaseDamage() {
    if (!gameManager) return;
    // simple pricing: same as buyBall; tweak if you want e.g. cost = gameManager.getBallDamage()
    const cost = Math.floor((((gameManager?.getBallDamage() ?? 0) + 1) ** 2) / 2);
    if (coins >= cost) {
      setCoins((prev) => prev - cost);
      gameManager.coins -= cost;
      gameManager.increaseBallDamage(1); // +1 damage to all newly spawned balls
    }
  }

  return (
    <div className="shop">
      <h2>Coins: {coins}</h2>

      <button onClick={buyBall} className="nav-btn">
        New Ball ({Math.floor(fib1 + fib2)}💰)
      </button>

      <button onClick={increaseDamage} className="nav-btn">
        Increase Future Ball Damage ({Math.floor((((gameManager?.getBallDamage() ?? 0) + 1) ** 2) / 2)}💰)
      </button>
    </div>
  );
}
