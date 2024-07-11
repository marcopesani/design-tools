import { rgbToHex } from "~/utils/colorUtils";

const MAX_IMAGE_SIZE = 800;
const BYTES_PER_PIXEL = 4;
const MAX_ITERATIONS = 20;
const CUBE_SIZE = 16;
const TOTAL_CUBES = 4096; // 256 / 16 = 16, 16^3 = 4096
const THR = 10;

export function generatePalette(
  img: HTMLImageElement,
  k = 5,
  baseColor = [0, 0, 0],
  basePosition: [number,number] = [0, 0],
  samplingRate = 0.125
): {
  palette: string[];
  markers: { x: number; y: number; color: string }[];
} {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { palette: [], markers: [] };

  // Resize image for faster processing
  const scale = Math.min(1, MAX_IMAGE_SIZE / Math.max(img.width, img.height));
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // Generate initial palette
  const initialPalette = generateInitialPalette(pixels, k, baseColor);

  // Fast K-means algorithm
  const { palette, markers } = fastKMeans(pixels, initialPalette, k, samplingRate, scale, basePosition, canvas);

  return { palette, markers };
}

function generateInitialPalette(pixels: Uint8ClampedArray, k: number, baseColor: number[]): number[][] {
  const cubes: number[][][] = Array(TOTAL_CUBES).fill(null).map(() => []);
  
  for (let i = 0; i < pixels.length; i += BYTES_PER_PIXEL) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const cubeIndex = Math.floor(r / CUBE_SIZE) * 256 + Math.floor(g / CUBE_SIZE) * 16 + Math.floor(b / CUBE_SIZE);
    cubes[cubeIndex].push([r, g, b]);
  }

  const validCubes = cubes.filter(cube => cube.length >= THR);
  const N = validCubes.length;
  const initialColors: number[][] = [baseColor];

  while (initialColors.length < k) {
    let maxDistN = -1;
    let selectedColor: number[] | null = null;

    for (let i = 0; i < N; i++) {
      if (validCubes[i].length === 0) continue;
      const centerColor = validCubes[i].reduce((sum, color) => [sum[0] + color[0], sum[1] + color[1], sum[2] + color[2]])
        .map(channel => Math.round(channel / validCubes[i].length));
      
      const minDist = Math.min(...initialColors.map(color => colorDistance(centerColor, color)));
      const distN = minDist * Math.sqrt(validCubes[i].length);

      if (distN > maxDistN) {
        maxDistN = distN;
        selectedColor = centerColor;
      }
    }

    if (selectedColor) {
      initialColors.push(selectedColor);
    } else {
      break;
    }
  }

  return initialColors;
}

function fastKMeans(
  pixels: Uint8ClampedArray,
  initialPalette: number[][],
  k: number,
  samplingRate: number,
  scale: number,
  basePosition: [number, number],
  canvas: HTMLCanvasElement // Add this parameter
): { palette: string[]; markers: { x: number; y: number; color: string }[] } {
  let palette = initialPalette;
  let iterations = 0;
  let prevMSE = Infinity;

  while (iterations < MAX_ITERATIONS) {
    const clusters: number[][][] = Array(k).fill(null).map(() => []);
    let mse = 0;
    let sampledPixels = 0;

    for (let i = 0; i < pixels.length; i += BYTES_PER_PIXEL) {
      if (Math.random() > samplingRate) continue;

      const pixel = [pixels[i], pixels[i + 1], pixels[i + 2]];
      let nearestCentroidIndex = 0;
      let minDistance = Infinity;
      
      for (let j = 0; j < palette.length; j++) {
        const distance = colorDistance(pixel, palette[j]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestCentroidIndex = j;
        }
      }
      
      clusters[nearestCentroidIndex].push(pixel);
      mse += minDistance;
      sampledPixels++;
    }

    mse /= sampledPixels;

    if (mse >= prevMSE) break;
    prevMSE = mse;

    // Calculate new centroids
    palette = clusters.map(cluster => 
      cluster.length > 0 
        ? cluster.reduce((sum, pixel) => [sum[0] + pixel[0], sum[1] + pixel[1], sum[2] + pixel[2]])
            .map(channel => Math.round(channel / cluster.length))
        : palette[clusters.indexOf(cluster)]
    );

    iterations++;
  }

  // Convert palette to hex colors and create markers
  const hexPalette = palette.map(color => rgbToHex(color[0], color[1], color[2]));
  const markers = palette.map((color, index) => {
    if (index === 0) {
      return { x: basePosition[0], y: basePosition[1], color: hexPalette[0] };
    } else {
      // Find a pixel close to this centroid for the marker
      let minDistance = Infinity;
      let markerX = 0, markerY = 0;
      
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * BYTES_PER_PIXEL;
          const pixel = [pixels[i], pixels[i + 1], pixels[i + 2]];
          const distance = colorDistance(pixel, color);
          
          if (distance < minDistance) {
            minDistance = distance;
            markerX = x;
            markerY = y;
          }
        }
      }

      return { 
        x: markerX / scale, 
        y: markerY / scale, 
        color: hexPalette[index] 
      };
    }
  });

  return { palette: hexPalette, markers };
}

function colorDistance(color1: number[], color2: number[]): number {
  return Math.sqrt(
    Math.pow(color1[0] - color2[0], 2) +
    Math.pow(color1[1] - color2[1], 2) +
    Math.pow(color1[2] - color2[2], 2)
  );
}
