import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GameContextType {
  username: string;
  setUsername: (name: string) => void;
  width: number;
  height: number;
  setDimensions: (w: number, h: number) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState('');
  const [width, setWidth] = useState(window.innerWidth * 0.8);
  const [height, setHeight] = useState(window.innerHeight * 0.8);

  const setDimensions = (w: number, h: number) => {
    setWidth(w);
    setHeight(h);
  };

  // Listen for screen resize
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth * 0.8);
      setHeight(window.innerHeight * 0.8);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <GameContext.Provider value={{ username, setUsername, width, height, setDimensions }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGameContext must be used within a GameProvider');
  return context;
};
