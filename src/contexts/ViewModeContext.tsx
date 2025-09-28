import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ViewModeContextType {
  defaultDisplayMode: 'tasks' | 'projects';
  setDefaultDisplayMode: (mode: 'tasks' | 'projects') => void;
  resetToDefault: () => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export const useViewMode = () => {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
};

interface ViewModeProviderProps {
  children: ReactNode;
}

export const ViewModeProvider: React.FC<ViewModeProviderProps> = ({ children }) => {
  const [defaultDisplayMode, setDefaultDisplayMode] = useState<'tasks' | 'projects'>('tasks');

  const resetToDefault = () => {
    setDefaultDisplayMode('tasks');
  };

  return (
    <ViewModeContext.Provider value={{
      defaultDisplayMode,
      setDefaultDisplayMode,
      resetToDefault
    }}>
      {children}
    </ViewModeContext.Provider>
  );
};
