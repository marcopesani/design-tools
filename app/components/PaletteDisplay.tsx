import React from "react";
import { usePalette } from "../contexts/PaletteContext";

const PaletteDisplay: React.FC = () => {
  const { palette, selectedColor, handleColorSelection } = usePalette();

  const hexToRgb = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const getComplementaryColor = (hex: string): string => {
    const r = 255 - parseInt(hex.slice(1, 3), 16);
    const g = 255 - parseInt(hex.slice(3, 5), 16);
    const b = 255 - parseInt(hex.slice(5, 7), 16);
    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  const calculateContrast = (color1: string, color2: string): number => {
    const getLuminance = (hex: string) => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      const luminance = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return (
        0.2126 * luminance[0] + 0.7152 * luminance[1] + 0.0722 * luminance[2]
      );
    };
    const l1 = getLuminance(color1);
    const l2 = getLuminance(color2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  const getWCAGClassification = (contrast: number): string => {
    if (contrast >= 7) return "AAA";
    if (contrast >= 4.5) return "AA";
    if (contrast >= 3) return "AA Large";
    return "Fail";
  };

  return (
    <section className="h-1/2">
      <div className="flex h-full">
        {palette.map((color, index) => {
          const complementaryColor = getComplementaryColor(color);
          const contrast = calculateContrast(color, complementaryColor);
          const wcagClass = getWCAGClassification(contrast);
          return (
            <div
              key={index}
              className="flex-1 flex flex-col"
              style={{ borderColor: color === selectedColor ? "white" : color }}
            >
              <div
                role="button"
                tabIndex={0}
                className="flex-grow flex flex-col justify-between p-4 cursor-pointer border-4"
                style={{ 
                  backgroundColor: color,
                  borderColor: color === selectedColor ? "white" : color
                }}
                onClick={() => handleColorSelection(color)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleColorSelection(color);
                  }
                }}
              >
                <div className="text-xs" style={{ color: complementaryColor }}>
                  <div>{color}</div>
                  <div>{hexToRgb(color)}</div>
                </div>
                <div className="text-center text-3xl">
                  <div
                    className="font-bold"
                    style={{ color: complementaryColor }}
                  >
                    Aa
                  </div>
                  <div style={{ color: complementaryColor }}>Aa</div>
                </div>

                <div className="text-xs" style={{ color: complementaryColor }}>
                  <div>Contrast: {contrast.toFixed(2)}</div>
                  <div>WCAG: {wcagClass}</div>
                </div>
              </div>
              <div
                className="h-1/4 p-2 text-xs flex items-center justify-center"
                style={{ backgroundColor: complementaryColor, color: color }}
              >
                Complementary: {complementaryColor}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PaletteDisplay;
