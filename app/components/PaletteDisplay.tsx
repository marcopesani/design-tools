import React from 'react';
import { usePalette } from '../contexts/PaletteContext';

const PaletteDisplay: React.FC = () => {
  const { palette, selectedColor, handleColorSelection } = usePalette();

  return (
    <section className="h-1/2">
      <div className="flex h-full">
        {palette.map((color, index) => (
          <div 
            key={index} 
            role="button"
            tabIndex={0}
            className={`flex-1 cursor-pointer ${color === selectedColor ? 'border-4 border-white' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorSelection(color)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleColorSelection(color);
              }
            }}
          ></div>
        ))}
      </div>
    </section>
  );
};

export default PaletteDisplay;