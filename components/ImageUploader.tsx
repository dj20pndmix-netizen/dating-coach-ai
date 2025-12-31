
import React, { useState, useCallback, useRef } from 'react';
import { fileToBase64 } from '../utils';

interface ImageUploaderProps {
  onAnalyze: (imageBase64: string, imageFile: File) => void;
  error: string | null;
}

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);


export const ImageUploader: React.FC<ImageUploaderProps> = ({ onAnalyze, error }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  }, []);
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const handleAnalyzeClick = async () => {
    if (imageFile) {
      const base64 = await fileToBase64(imageFile);
      onAnalyze(base64, imageFile);
    }
  };
  
  const triggerFileSelect = () => fileInputRef.current?.click();

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl transition-all duration-300">
      {imagePreview ? (
        <div className="text-center">
          <img src={imagePreview} alt="Conversation preview" className="max-h-96 w-auto mx-auto rounded-lg mb-4 object-contain" />
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
              }}
              className="px-6 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition-colors"
            >
              Change Image
            </button>
            <button
              onClick={handleAnalyzeClick}
              className="px-8 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-md hover:opacity-90 transition-opacity shadow-lg"
            >
              Analyze
            </button>
          </div>
        </div>
      ) : (
        <div 
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-purple-400 bg-gray-700' : 'border-gray-600 hover:border-gray-500'}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerFileSelect}
        >
            <UploadIcon />
            <p className="mt-4 text-lg font-semibold text-gray-300">Drag & drop your screenshot here</p>
            <p className="text-gray-500">or click to select a file</p>
            <input 
                type="file" 
                accept="image/*"
                ref={fileInputRef}
                onChange={(e) => handleFileChange(e.target.files)} 
                className="hidden" 
            />
        </div>
      )}
      {error && <p className="text-red-400 text-center mt-4">{error}</p>}
    </div>
  );
};
