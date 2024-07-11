import React, {
  useCallback,
  useRef,
  useState,
  useEffect,
  useMemo,
} from "react";
import { usePalette } from "../contexts/PaletteContext";
import { generatePalette } from "../utils/paletteGenerator";

interface ColorMarker {
  x: number;
  y: number;
  color: string;
}

interface ImageCanvasProps {
  imageSrc: string;
}

function ImageCanvas({ imageSrc }: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHoveringMarker, setIsHoveringMarker] = useState(false);
  const { selectedColor, setSelectedColor, setPalette } = usePalette();
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(
    null
  );
  const [colorMarkers, setColorMarkers] = useState<ColorMarker[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const devicePixelRatio = useMemo(() => window.devicePixelRatio || 1, []);

  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      setCanvasSize({
        width: canvas.clientWidth,
        height: canvas.clientHeight,
      });
    }
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [updateCanvasSize]);

  const generateNewPalette = useCallback(
    (img: HTMLImageElement, startX: number, startY: number) => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, img.width, img.height);
      const imageData = ctx.getImageData(startX, startY, 1, 1).data;
      const baseColor = [imageData[0], imageData[1], imageData[2]];
      const basePosition: [number, number] = [startX, startY];
      const { palette, markers } = generatePalette(
        img,
        5,
        baseColor,
        basePosition
      );
      setPalette(palette);
      setColorMarkers(markers);
      setSelectedColor(palette[0]);
    },
    [setPalette, setSelectedColor]
  );

  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.onload = () => {
        setSelectedImage(img);
        const randomX = Math.floor(Math.random() * img.width);
        const randomY = Math.floor(Math.random() * img.height);
        generateNewPalette(img, randomX, randomY);
      };
      img.src = imageSrc;
    }
  }, [imageSrc, generateNewPalette]);

  const { drawWidth, drawHeight, offsetX, offsetY } = useMemo(() => {
    if (!selectedImage || !canvasSize.width || !canvasSize.height) {
      return { drawWidth: 0, drawHeight: 0, offsetX: 0, offsetY: 0 };
    }

    const imgAspectRatio = selectedImage.width / selectedImage.height;
    const containerAspectRatio = canvasSize.width / canvasSize.height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgAspectRatio > containerAspectRatio) {
      drawWidth = canvasSize.width;
      drawHeight = canvasSize.width / imgAspectRatio;
      offsetX = 0;
      offsetY = (canvasSize.height - drawHeight) / 2;
    } else {
      drawHeight = canvasSize.height;
      drawWidth = canvasSize.height * imgAspectRatio;
      offsetX = (canvasSize.width - drawWidth) / 2;
      offsetY = 0;
    }

    return { drawWidth, drawHeight, offsetX, offsetY };
  }, [selectedImage, canvasSize]);

  const drawImageOnCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !selectedImage) return;

    canvas.width = canvasSize.width * devicePixelRatio;
    canvas.height = canvasSize.height * devicePixelRatio;
    canvas.style.width = `${canvasSize.width}px`;
    canvas.style.height = `${canvasSize.height}px`;

    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.drawImage(selectedImage, offsetX, offsetY, drawWidth, drawHeight);

    // Draw color markers
    const markerSize = 10;
    ctx.save();
    colorMarkers.forEach((marker) => {
      const x = (marker.x / selectedImage.width) * drawWidth + offsetX;
      const y = (marker.y / selectedImage.height) * drawHeight + offsetY;

      ctx.beginPath();
      ctx.arc(x, y, markerSize, 0, 2 * Math.PI);
      ctx.fillStyle = marker.color;
      ctx.fill();
      ctx.strokeStyle = marker.color === selectedColor ? "black" : "white";
      ctx.lineWidth = marker.color === selectedColor ? 3 : 2;
      ctx.stroke();

      if (marker.color === selectedColor) {
        ctx.beginPath();
        ctx.arc(x, y, markerSize + 5, 0, 2 * Math.PI);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
    ctx.restore();
  }, [
    selectedImage,
    colorMarkers,
    selectedColor,
    devicePixelRatio,
    canvasSize,
    drawWidth,
    drawHeight,
    offsetX,
    offsetY,
  ]);

  useEffect(() => {
    drawImageOnCanvas();
  }, [drawImageOnCanvas]);

  const handleCanvasInteraction = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>, isClick: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas || !selectedImage) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const imgX = Math.round(
        ((x - offsetX) / drawWidth) * selectedImage.width
      );
      const imgY = Math.round(
        ((y - offsetY) / drawHeight) * selectedImage.height
      );

      const interactedMarker = colorMarkers.find((marker) => {
        const markerX = (marker.x / selectedImage.width) * drawWidth + offsetX;
        const markerY =
          (marker.y / selectedImage.height) * drawHeight + offsetY;
        return Math.hypot(x - markerX, y - markerY) <= 10;
      });

      if (isClick) {
        if (interactedMarker) {
          setSelectedColor(interactedMarker.color);
        } else {
          generateNewPalette(selectedImage, imgX, imgY);
        }
      } else {
        setIsHoveringMarker(!!interactedMarker);
      }
    },
    [
      colorMarkers,
      selectedImage,
      setSelectedColor,
      drawWidth,
      drawHeight,
      offsetX,
      offsetY,
      generateNewPalette,
    ]
  );

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${isHoveringMarker ? "cursor-pointer" : ""}`}
      onClick={(e) => handleCanvasInteraction(e, true)}
      onMouseMove={(e) => handleCanvasInteraction(e, false)}
    />
  );
}

export default ImageCanvas;
