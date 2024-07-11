import React, { createContext, useState, useContext, useCallback } from 'react';

interface PaletteContextType {
  palette: string[];
  selectedColor: string | null;
  setPalette: (palette: string[]) => void;
  setSelectedColor: (color: string | null) => void;
  handleColorSelection: (color: string) => void;
}

const PaletteContext = createContext<PaletteContextType | undefined>(undefined);

export const PaletteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [palette, setPalette] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const handleColorSelection = useCallback((color: string) => {
    setSelectedColor(prevColor => prevColor === color ? null : color);
  }, []);

  return (
    <PaletteContext.Provider value={{
      palette,
      selectedColor,
      setPalette,
      setSelectedColor,
      handleColorSelection
    }}>
      {children}
    </PaletteContext.Provider>
  );
};

export const usePalette = () => {
  const context = useContext(PaletteContext);
  if (context === undefined) {
    throw new Error('usePalette must be used within a PaletteProvider');
  }
  return context;
};