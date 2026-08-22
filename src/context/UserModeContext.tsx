import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserMode = 'farmer' | 'agronomist';

interface UserModeContextType {
  mode: UserMode;
  setMode: (mode: UserMode) => void;
  toggleMode: () => void;
  isFarmer: boolean;
  isAgronomist: boolean;
}

const UserModeContext = createContext<UserModeContextType | undefined>(undefined);

export const UserModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<UserMode>(() => {
    const saved = localStorage.getItem('agritwin_user_mode');
    return (saved === 'agronomist' || saved === 'farmer') ? saved : 'farmer';
  });

  const setMode = (newMode: UserMode) => {
    setModeState(newMode);
    localStorage.setItem('agritwin_user_mode', newMode);
  };

  const toggleMode = () => {
    const next = mode === 'farmer' ? 'agronomist' : 'farmer';
    setMode(next);
  };

  return (
    <UserModeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        isFarmer: mode === 'farmer',
        isAgronomist: mode === 'agronomist'
      }}
    >
      {children}
    </UserModeContext.Provider>
  );
};

export const useUserMode = () => {
  const context = useContext(UserModeContext);
  if (!context) {
    throw new Error('useUserMode must be used within a UserModeProvider');
  }
  return context;
};
