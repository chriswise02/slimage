import React from 'react';
import Modal from './Modal';
import Button from './Button';
import CropInterface from '../CropInterface';
import { CROP_ASPECT_RATIOS } from '../constants/appConstants';
import { imageProcessor } from '../imageProcessor';

const CropModal = ({
  isOpen,
  onClose,
  cropAspectRatio,
  setCropAspectRatio,
  cropCustomWidth,
  setCropCustomWidth,
  cropCustomHeight,
  setCropCustomHeight,
  onCrop,
  onApply
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Custom Crop"
      maxWidth="max-w-4xl"
    >
      {/* Scrollable Content */}
      <div className="pb-4">
        <div className="bg-[#F0F0F0] p-5 rounded-xl mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-[#333333]">Aspect Ratio:</label>
              <select 
                value={cropAspectRatio}
                onChange={(e) => {
                  setCropAspectRatio(e.target.value);
                  if (e.target.value !== 'free') {
                    setCropCustomWidth('');
                    setCropCustomHeight('');
                  }
                }}
                className="w-full bg-white px-4 py-2 rounded-lg text-[#333333] text-sm"
              >
                {CROP_ASPECT_RATIOS.map(ratio => (
                  <option key={ratio.value} value={ratio.value}>{ratio.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-[#333333]">Custom Size:</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="Width" 
                  min="1" 
                  value={cropCustomWidth}
                  onChange={(e) => setCropCustomWidth(e.target.value)}
                  className="flex-1 bg-white px-3 py-2 rounded-lg text-[#333333] text-sm" 
                />
                <span className="text-[#333333]">×</span>
                <input 
                  type="number" 
                  placeholder="Height" 
                  min="1" 
                  value={cropCustomHeight}
                  onChange={(e) => setCropCustomHeight(e.target.value)}
                  className="flex-1 bg-white px-3 py-2 rounded-lg text-[#333333] text-sm" 
                />
                <span className="text-xs text-[#333333] opacity-60">px</span>
              </div>
            </div>
          </div>

          {imageProcessor.originalImage && (
            <div className="text-center">
              <CropInterface
                originalImage={imageProcessor.originalImage}
                aspectRatio={cropAspectRatio}
                customWidth={cropCustomWidth}
                customHeight={cropCustomHeight}
                onCrop={onCrop}
              />
            </div>
          )}
        </div>
      </div>

      {/* Fixed Action Buttons */}
      <div className="border-t border-[#E7E7E7] pt-4 text-center space-x-3 bg-white">
        <Button variant="primary" onClick={onApply}>
          Apply Crop & Continue
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

export default CropModal; 