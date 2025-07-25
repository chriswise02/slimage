import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { ROUNDED_CORNER_PRESETS } from '../constants/appConstants';

const RoundedCornersModal = ({
  isOpen,
  onClose,
  roundedCorners,
  setRoundedCorners,
  roundedPreviewCanvas,
  onApply
}) => {
  const updateCorner = (corner, value) => {
    setRoundedCorners(prev => ({
      ...prev,
      [corner]: parseInt(value)
    }));
  };

  const applyPreset = (preset) => {
    setRoundedCorners(preset.values);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Rounded Corners"
      maxWidth="max-w-lg"
    >
      {/* Scrollable Content */}
      <div className="space-y-6 pb-4">
        {/* Preview */}
        <div>
          <label className="block text-sm font-medium mb-3 text-[#333333]">Preview:</label>
          <div className="w-full">
            {roundedPreviewCanvas && (
              <canvas
                ref={(canvas) => {
                  if (canvas && roundedPreviewCanvas) {
                    canvas.width = roundedPreviewCanvas.width;
                    canvas.height = roundedPreviewCanvas.height;
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(roundedPreviewCanvas, 0, 0);
                  }
                }}
                className="w-full h-auto max-h-64 object-contain"
              />
            )}
            {!roundedPreviewCanvas && (
              <div className="w-full h-32 bg-[#F0F0F0] rounded-lg flex items-center justify-center">
                <span className="text-sm text-[#999999]">Preview will appear here</span>
              </div>
            )}
          </div>
        </div>

        {/* Corner Controls Grid */}
        <div className="grid grid-cols-2 gap-4">
          {Object.entries({
            topLeft: 'Top Left',
            topRight: 'Top Right',
            bottomLeft: 'Bottom Left',
            bottomRight: 'Bottom Right'
          }).map(([corner, label]) => (
            <div key={corner} className="space-y-2">
              <label className="text-sm font-medium text-[#333333]">{label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={roundedCorners[corner]}
                  onChange={(e) => updateCorner(corner, e.target.value)}
                  className="flex-1 h-2 bg-[#E7E7E7] rounded-full appearance-none cursor-pointer slider"
                />
                <span className="text-sm font-medium text-[#333333] w-10 text-right">
                  {roundedCorners[corner]}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Presets */}
        <div className="pt-2 border-t border-[#E7E7E7]">
          <label className="block text-sm font-medium mb-3 text-[#333333]">Quick Presets:</label>
          <div className="flex gap-2 flex-wrap">
            {ROUNDED_CORNER_PRESETS.map((preset) => (
              <Button
                key={preset.name}
                variant="preset"
                size="small"
                onClick={() => applyPreset(preset)}
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Action Buttons */}
      <div className="border-t border-[#E7E7E7] pt-4 text-center space-x-3 bg-white">
        <Button variant="primary" onClick={onApply}>
          Apply Rounded Corners
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

export default RoundedCornersModal; 