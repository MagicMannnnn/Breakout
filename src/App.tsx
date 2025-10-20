import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Menu from './components/Menu';
import Game from './components/Game';
import Leaderboard from './components/Leaderboard';
import { GameProvider } from './context/GameContext';
import { useUsername } from './hooks/useUsername';

const App = () => {
  return (
    <GameProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/play" element={<Game />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </Router>
    </GameProvider>
  );
};

export default App;
