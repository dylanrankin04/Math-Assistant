import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (prompt: string, imageBase64: string) => void;
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({ isOpen, onClose, onSend }) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const drawImage = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (canvas && image) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set canvas size to match image, maintaining aspect ratio
        const maxWidth = window.innerWidth * 0.8;
        const maxHeight = window.innerHeight * 0.6;
        let { width, height } = image;
        if (width > height) {
            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }
        } else {
            if (height > maxHeight) {
                width *= maxHeight / height;
                height = maxHeight;
            }
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(image, 0, 0, width, height);
      }
    }
  }, []);
  
  useEffect(() => {
    if (selectedImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          imageRef.current = img;
          drawImage();
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(selectedImage);
    }
  }, [selectedImage, drawImage]);

  const getCanvasCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const touch = 'touches' in event ? event.touches[0] : event;
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  };

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      setIsDrawing(true);
      const { x, y } = getCanvasCoordinates(event);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)'; // Semi-transparent yellow
      ctx.lineWidth = 20;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      const { x, y } = getCanvasCoordinates(event);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
    setIsDrawing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        setSelectedImage(file);
        setError(null);
    } else {
        setError('Please select a valid image file (PNG, JPG, etc.).');
        setSelectedImage(null);
    }
  };

  const handleSend = () => {
    const canvas = canvasRef.current;
    if (canvas && selectedImage) {
      const imageBase64 = canvas.toDataURL(selectedImage.type);
      onSend(prompt || 'Can you help me with this problem?', imageBase64);
      handleClose();
    }
  };

    const handleClear = () => {
        drawImage(); // Redraws the original image, clearing highlights
    };

  const handleClose = () => {
    setSelectedImage(null);
    setPrompt('');
    setError(null);
    imageRef.current = null;
    if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx?.clearRect(0,0, canvasRef.current.width, canvasRef.current.height);
    }
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <header className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Upload & Highlight</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </header>
        
        <main className="p-4 overflow-y-auto">
          {!selectedImage ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
              <label htmlFor="file-upload" className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                Choose an Image
              </label>
              <input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <p className="mt-2 text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
          ) : (
            <div className="flex flex-col items-center">
                <p className="text-sm text-gray-600 mb-2">Click and drag on the image to highlight important parts.</p>
              <canvas 
                ref={canvasRef} 
                className="border rounded-md cursor-crosshair max-w-full"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
          )}
        </main>
        
        {selectedImage && (
             <footer className="p-4 border-t bg-gray-50">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Add a question (optional)..."
                    className="w-full border border-gray-300 rounded-md p-2 mb-4 focus:ring-2 focus:ring-blue-500"
                    rows={2}
                />
                <div className="flex justify-between items-center">
                    <div>
                        <button onClick={handleClear} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">Clear Highlights</button>
                        <label htmlFor="file-upload-change" className="ml-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 cursor-pointer">
                            Change Image
                        </label>
                         <input id="file-upload-change" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </div>
                    <button onClick={handleSend} className="px-6 py-2 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600 disabled:bg-gray-400" disabled={!selectedImage}>
                        Send
                    </button>
                </div>
            </footer>
        )}
      </div>
    </div>
  );
};

export default ImageUploadModal;
