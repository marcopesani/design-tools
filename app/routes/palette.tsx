import type { MetaFunction } from "@remix-run/node";
import { useState, useCallback, useRef, useEffect } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "Palette Generator" },
    {
      name: "description",
      content: "Generate a palette from an image using k-means clustering",
    },
  ];
};

export default function Index() {
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [palette, setPalette] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setSelectedImage(img);
        generatePalette(img);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const generatePalette = useCallback((img: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    // Convert centroids to hex colors
    const newPalette = centroids.map(centroid => 
      `#${centroid.map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`
    );

    setPalette(newPalette);
  }, []);

  const kMeansClustering = (pixels: number[][], k: number): number[][] => {
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
  };

  const distance = (a: number[], b: number[]): number => 
    Math.sqrt(a.reduce((sum, _, i) => sum + Math.pow(a[i] - b[i], 2), 0));

  const arraysEqual = (a: number[][], b: number[][]): boolean =>
    a.length === b.length && a.every((row, i) => 
      row.length === b[i].length && row.every((val, j) => val === b[i][j])
    );

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  }, [handleImageUpload]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleSelectImageClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const drawImageOnCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !selectedImage) return;

    const containerWidth = canvas.parentElement?.clientWidth || 0;
    const containerHeight = canvas.parentElement?.clientHeight || 0;

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    const scale = Math.min(
      containerWidth / selectedImage.width,
      containerHeight / selectedImage.height
    );

    const scaledWidth = selectedImage.width * scale;
    const scaledHeight = selectedImage.height * scale;

    const x = (containerWidth - scaledWidth) / 2;
    const y = (containerHeight - scaledHeight) / 2;

    ctx.drawImage(selectedImage, x, y, scaledWidth, scaledHeight);
  }, [selectedImage]);

  useEffect(() => {
    drawImageOnCanvas();
    window.addEventListener('resize', drawImageOnCanvas);
    return () => window.removeEventListener('resize', drawImageOnCanvas);
  }, [drawImageOnCanvas]);

  return (
    <div className="font-sans h-screen flex flex-col bg-gray-900 text-gray-200">
      <header className="bg-gray-800 p-4">
        <h1 className="text-2xl font-bold">Palette Generator</h1>
      </header>
      <main className="flex-grow flex flex-col">
        <section 
          className="h-1/2 border-b border-gray-700 flex flex-col"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="flex-grow flex items-center justify-center overflow-hidden relative">
            {selectedImage ? (
              <canvas ref={canvasRef} className="w-full h-full" />
            ) : (
              <div className="text-center">
                <p className="text-gray-400 mb-2">Drag and drop an image here or click to upload</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file);
                    }
                  }}
                  className="hidden"
                />
                <button 
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                  onClick={handleSelectImageClick}
                >
                  Select Image
                </button>
              </div>
            )}
          </div>
        </section>
        <section className="h-1/2">
          <div className="flex h-full">
            {palette.map((color, index) => (
              <div key={index} className="flex-1" style={{ backgroundColor: color }}></div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
