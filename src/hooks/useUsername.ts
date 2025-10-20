import { useGameContext } from '../context/GameContext';

export const useUsername = () => {
  const { username, setUsername } = useGameContext();
  return { username, setUsername };
};
