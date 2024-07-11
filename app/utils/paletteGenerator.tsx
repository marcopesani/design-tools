export function generatePalette(img: HTMLImageElement): { palette: string[], markers: { x: number; y: number; color: string }[] } {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { palette: [], markers: [] };

  ctx.drawImage(img, 0, 0, img.width, img.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // Sample pixels
  const sampleSize = 1000;
  const sampledPixels: number[][] = [];
  for (let i = 0; i < sampleSize; i++) {
    const randomIndex = Math.floor(Math.random() * pixels.length / 4) * 4;
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
  const newPalette: string[] = [];
  const newMarkers: { x: number; y: number; color: string }[] = [];

  centroids.forEach(centroid => {
    const hexColor = `#${centroid.map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
    newPalette.push(hexColor);

    // Find the pixel closest to this centroid
    let minDistance = Infinity;
    let closestPixelIndex = -1;

    for (let i = 0; i < pixels.length; i += 4) {
      const pixelColor = [pixels[i], pixels[i + 1], pixels[i + 2]];
      const dist = distance(pixelColor, centroid);
      if (dist < minDistance) {
        minDistance = dist;
        closestPixelIndex = i;
      }
    }

    const x = (closestPixelIndex / 4) % canvas.width;
    const y = Math.floor((closestPixelIndex / 4) / canvas.width);
    newMarkers.push({ x, y, color: hexColor });
  });

  return { palette: newPalette, markers: newMarkers };
}

function kMeansClustering(pixels: number[][], k: number): number[][] {
  // Initialize centroids randomly
  let centroids = pixels.slice(0, k);
  let oldCentroids: number[][] = [];
  let iterations = 0;
  const maxIterations = 50;

  while (!arraysEqual(centroids, oldCentroids) && iterations < maxIterations) {
    oldCentroids = [...centroids];
    iterations++;

    // Assign pixels to centroids
    const assignments = pixels.map(pixel => 
      centroids.reduce((iMin, centroid, i, arr) => 
        distance(pixel, centroid) < distance(pixel, arr[iMin]) ? i : iMin, 0)
    );

    // Move centroids
    centroids = centroids.map((_, i) => {
      const assignedPixels = pixels.filter((_, j) => assignments[j] === i);
      return assignedPixels.length > 0
        ? assignedPixels.reduce((sum, p) => sum.map((s, i) => s + p[i]))
            .map(s => s / assignedPixels.length)
        : centroids[i];
    });
  }

  return centroids;
}

function distance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, _, i) => sum + Math.pow(a[i] - b[i], 2), 0));
}

function arraysEqual(a: number[][], b: number[][]): boolean {
  return a.length === b.length && a.every((row, i) => 
    row.length === b[i].length && row.every((val, j) => val === b[i][j])
  );
}