import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameContext } from "../context/GameContext";
import "../App.css";
import GameManager from "./game/gameManager";
import Shop from "./Shop";
import { useUsername } from "../hooks/useUsername";

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep the instance in *state* so children reliably re-render when it's set
  const [manager, setManager] = useState<GameManager | null>(null);

  const { username, width, height } = useGameContext();
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [balls, setBalls] = useState(1);

  const navigate = useNavigate();

  // Create GameManager on first mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gm = new GameManager(
      username,
      width,
      height,
      ctx,
      (newScore) => setScore(newScore),
      (newBalls) => setBalls(newBalls),
      (newCoins) => setCoins(newCoins)
    );

    setManager(gm); // trigger re-render so Shop gets a non-null manager
    gm.start();

    return () => gm.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // Update GameManager when dimensions change
  useEffect(() => {
    if (!manager) return;
    manager.setSize(width, height);
  }, [manager, width, height]);

  // Optional: redraw background on update
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#494949ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [username, width, height]);

  // Guard route if no username
  useEffect(() => {
    if (!username) navigate("/");
  }, [username, navigate]);

  return (
    <div className="game-wrapper">
      {/* LEFT: Sidebar */}
      <div className="sidebar">
        <button onClick={() => navigate("/")} className="nav-btn">
          🏠Home
        </button>
        <button onClick={() => navigate("/leaderboard")} className="nav-btn">
          Leaderboard
        </button>
        <button onClick={() => manager?.increaseBallSpeed()} className="nav-btn">
          🏎Speed up
        </button>
      </div>

      {/* CENTER: Canvas + score */}
      <div className="game-center">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="game-canvas"
        />
        <h2>
          Score: {score}, Balls: {balls}
        </h2>
      </div>

      {/* RIGHT: Shop */}
      <div className="shop">
        <Shop
          coins={coins}
          setCoins={setCoins}
          balls={balls}
          setBalls={setBalls}
          gameManager={manager}
        />
      </div>
    </div>
  );
};

export default Game;
