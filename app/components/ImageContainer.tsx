import React, { useCallback, useRef, useState } from 'react';
import ImageCanvas from './ImageCanvas';

function ImageContainer() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
    };
    reader.readAsDataURL(file);
  }, []);

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

  return (
    <section 
      className="h-1/2 border-b border-gray-700 flex flex-col"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="flex-grow flex items-center justify-center overflow-hidden relative">
        {imageSrc ? (
          <ImageCanvas imageSrc={imageSrc} />
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
  );
}

export default ImageContainer;