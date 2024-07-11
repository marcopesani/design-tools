export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ]
    : [0, 0, 0];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function adjustBrightness(r: number, g: number, b: number, amount: number): [number, number, number] {
  return [
    Math.max(0, Math.min(255, r + amount)),
    Math.max(0, Math.min(255, g + amount)),
    Math.max(0, Math.min(255, b + amount))
  ];
}

export function adjustSaturation(r: number, g: number, b: number, amount: number): [number, number, number] {
  const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
  return [
    Math.max(0, Math.min(255, gray + (r - gray) * (1 + amount / 100))),
    Math.max(0, Math.min(255, gray + (g - gray) * (1 + amount / 100))),
    Math.max(0, Math.min(255, gray + (b - gray) * (1 + amount / 100)))
  ];
}

export function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const l1 = getLuminance(...rgb1);
  const l2 = getLuminance(...rgb2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

export function adjustColor(color: string, amount: number): string {
  const [r, g, b] = hexToRgb(color);
  return rgbToHex(
    Math.max(0, Math.min(255, r + amount)),
    Math.max(0, Math.min(255, g + amount)),
    Math.max(0, Math.min(255, b + amount))
  );
}

export function getComplementaryColor(color: string): string {
  const [r, g, b] = hexToRgb(color);
  return rgbToHex(255 - r, 255 - g, 255 - b);
}

export function getAnalogousColor(color: string, angle: number): string {
  const [r, g, b] = hexToRgb(color);
  const hsl = rgbToHsl(r, g, b);
  hsl[0] = (hsl[0] + angle) % 360;
  const [r2, g2, b2] = hslToRgb(hsl[0], hsl[1], hsl[2]);
  return rgbToHex(r2, g2, b2);
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function getContrastColor(color: string): string {
  let contrastColor = getComplementaryColor(color);
  let contrastRatio = getContrastRatio(color, contrastColor);

  if (contrastRatio < 4.5) {
    // Try analogous colors
    const analogous1 = getAnalogousColor(color, 30);
    const analogous2 = getAnalogousColor(color, -30);
    const ratio1 = getContrastRatio(color, analogous1);
    const ratio2 = getContrastRatio(color, analogous2);

    if (ratio1 > contrastRatio && ratio1 > ratio2) {
      contrastColor = analogous1;
      contrastRatio = ratio1;
    } else if (ratio2 > contrastRatio) {
      contrastColor = analogous2;
      contrastRatio = ratio2;
    }
  }

  // If still not enough contrast, adjust brightness
  while (contrastRatio < 4.5) {
    contrastColor = adjustColor(contrastColor, contrastColor < color ? 10 : -10);
    contrastRatio = getContrastRatio(color, contrastColor);
  }

  return contrastColor;
}