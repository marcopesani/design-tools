import {
  rgbToHex,
} from "~/utils/colorUtils";

export function generatePalette(img: HTMLImageElement): {
  palette: string[];
  markers: { x: number; y: number; color: string }[];
} {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { palette: [], markers: [] };

  // Resize image for faster processing
  const maxSize = 400;
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // Sample pixels more efficiently
  const sampleSize = Math.min(20000, pixels.length / 4);
  const sampledPixels: number[][] = [];
  for (let i = 0; i < sampleSize; i++) {
    const randomIndex = Math.floor((Math.random() * pixels.length) / 4) * 4;
    sampledPixels.push([
      pixels[randomIndex],
      pixels[randomIndex + 1],
      pixels[randomIndex + 2]
    ]);
  }

  // K-means clustering
  const k = 5; // Number of colors in the palette
  const centroids = kMeansClustering(sampledPixels, k);

  // Convert centroids to hex colors and find their positions
  const newPalette: string[] = new Array(k);
  const newMarkers: { x: number; y: number; color: string }[] = new Array(k);

  for (let i = 0; i < k; i++) {
    const centroid = centroids[i];
    const hexColor = rgbToHex(Math.round(centroid[0]), Math.round(centroid[1]), Math.round(centroid[2]));
    newPalette[i] = hexColor;

    // Find the pixel closest to this centroid
    let minDistance = Infinity;
    let closestPixelIndex = -1;

    for (let j = 0; j < pixels.length; j += 4) {
      const dist = distance([pixels[j], pixels[j + 1], pixels[j + 2]], centroid);
      if (dist < minDistance) {
        minDistance = dist;
        closestPixelIndex = j;
      }
    }

    const x = (closestPixelIndex / 4) % canvas.width;
    const y = Math.floor(closestPixelIndex / 4 / canvas.width);
    newMarkers[i] = { x: x / scale, y: y / scale, color: hexColor };
  }

  return { palette: newPalette, markers: newMarkers };
}

function kMeansClustering(pixels: number[][], k: number, maxIterations: number = 10): number[][] {
  if (pixels.length === 0 || k <= 0) {
    return [];
  }

  const numChannels = pixels[0].length;

  // Initialize centroids randomly
  let centroids = Array.from({ length: k }, () => 
    pixels[Math.floor(Math.random() * pixels.length)].slice()
  );

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Assign pixels to clusters
    const clusters: number[][][] = Array.from({ length: k }, () => []);
    for (const pixel of pixels) {
      const closestCentroidIndex = centroids.reduce(
        (minIndex, centroid, index, arr) => 
          distance(pixel, centroid) < distance(pixel, arr[minIndex]) ? index : minIndex,
        0
      );
      clusters[closestCentroidIndex].push(pixel);
    }

    // Update centroids
    const newCentroids = clusters.map(cluster => {
      if (cluster.length === 0) {
        // If a cluster is empty, initialize with a random pixel
        return pixels[Math.floor(Math.random() * pixels.length)].slice();
      }
      const sum = new Array(numChannels).fill(0);
      for (const pixel of cluster) {
        for (let i = 0; i < numChannels; i++) {
          sum[i] += pixel[i];
        }
      }
      return sum.map(s => s / cluster.length);
    });

    // Check for convergence
    if (centroids.every((centroid, i) => distance(centroid, newCentroids[i]) < 1)) {
      break;
    }

    centroids = newCentroids;
  }

  return centroids;
}

function distance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0));
}
