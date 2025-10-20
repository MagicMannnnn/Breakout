import { useNavigate } from 'react-router-dom';
import { useUsername } from '../hooks/useUsername';
import { useState } from 'react';

const Menu = () => {
  const { username, setUsername } = useUsername();
  const [tempName, setTempName] = useState(username);
  const navigate = useNavigate();

  const handlePlay = () => {
    setUsername(tempName || 'Player');
    navigate('/play');
  };

  return (
    <div style={styles.container}>
      <h1>🎮 Breakout Game</h1>
      <input
        type="text"
        placeholder="Enter username"
        value={tempName}
        onChange={(e) => setTempName(e.target.value)}
        style={styles.input}
      />
      <button onClick={handlePlay} style={styles.button}>Play</button>
      <button onClick={() => navigate('/leaderboard')} style={styles.button}>
        Leaderboard
      </button>
      <h3>left click and drag to fire balls. right click to reset the arrow.</h3>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '4rem',
  },
  input: {
    padding: '0.5rem',
    fontSize: '1rem',
  },
  button: {
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    cursor: 'pointer',
  },
};

export default Menu;
