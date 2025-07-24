import React, { useState } from 'react';
import { ACCEPTED_FILE_TYPES } from '../constants/appConstants';

const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7,10 12,15 17,10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

const UploadSection = ({ fileInputRef, onFileSelect }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Check if it's an image file
      if (file.type.startsWith('image/')) {
        // Create a synthetic event object that matches what onFileSelect expects
        const syntheticEvent = {
          target: {
            files: [file]
          }
        };
        onFileSelect(syntheticEvent);
      } else {
        alert('Please drop an image file (JPG, PNG, WebP).');
      }
    }
  };

  return (
    <div className="upload-section mb-12">
      <div 
        className={`transition-colors p-12 text-center rounded-xl cursor-pointer border-2 border-dashed ${
          isDragOver 
            ? 'bg-[#E7E7E7] border-[#FF3008] border-solid' 
            : 'bg-[#F0F0F0] hover:bg-[#E7E7E7] border-transparent'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={onFileSelect}
          accept={ACCEPTED_FILE_TYPES}
          className="hidden"
        />
        <div className="flex flex-col items-center">
          <div className="text-[#FF3008] mb-4">
            <UploadIcon />
          </div>
          <div className="text-base font-medium mb-2 text-[#333333]">
            Upload Image
          </div>
          <p className="text-sm text-[#333333] opacity-60 mb-1">Drop an image here or click to upload</p>
          <span className="text-xs text-[#333333] opacity-60">Supports JPG, PNG, WebP files</span>
        </div>
      </div>
    </div>
  );
};

export default UploadSection; 