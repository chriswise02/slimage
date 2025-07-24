import React from 'react';
import { QUALITY_PRESETS, TRANSPARENCY_FILTERS } from '../constants/appConstants';

const QualityControls = ({ 
  qualityValue, 
  selectedFilter, 
  onQualityChange 
}) => {
  // Inline output format logic (previously in getOutputFormat)
  const getOutputFormat = () => {
    const needsTransparency = TRANSPARENCY_FILTERS.includes(selectedFilter);
    return needsTransparency ? 'PNG' : 'JPEG';
  };

  const outputFormat = getOutputFormat();

  return (
    <div className="bg-[#F0F0F0] p-5 rounded-xl mb-6">
      <div className="quality-controls">
        <div className="flex items-center justify-between mb-4">
          <label htmlFor="qualitySlider" className="font-medium text-[#333333]">Optimization Level:</label>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-white px-2 py-1 rounded text-[#333333]">{outputFormat}</span>
            {outputFormat === 'PNG' && (
              <span className="text-xs text-[#333333] opacity-60">• Preserves transparency</span>
            )}
          </div>
        </div>
        <div className="mb-4">
          <div className="relative">
            <input 
              type="range" 
              id="qualitySlider"
              min="10" 
              max="100" 
              value={qualityValue}
              onChange={(e) => onQualityChange(Number(e.target.value))}
              step="5"
              className="w-full h-2 bg-[#E7E7E7] rounded-full appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #FF3008 0%, #FF3008 ${(qualityValue - 10) / 0.9}%, #E7E7E7 ${(qualityValue - 10) / 0.9}%, #E7E7E7 100%)`
              }}
            />
          </div>
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-[#333333] opacity-60">10%</span>
            <span className="font-medium text-[#333333]">{qualityValue}%</span>
            <span className="text-xs text-[#333333] opacity-60">100%</span>
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <button 
            onClick={() => onQualityChange(QUALITY_PRESETS.HIGH_COMPRESSION)}
            className="px-3 py-1 text-xs bg-white text-[#333333] rounded hover:bg-[#E7E7E7] transition-all"
          >
            High Compression ({QUALITY_PRESETS.HIGH_COMPRESSION}%)
          </button>
          <button 
            onClick={() => onQualityChange(QUALITY_PRESETS.BALANCED)}
            className="px-3 py-1 text-xs bg-white text-[#333333] rounded hover:bg-[#E7E7E7] transition-all"
          >
            Balanced ({QUALITY_PRESETS.BALANCED}%)
          </button>
          <button 
            onClick={() => onQualityChange(QUALITY_PRESETS.HIGH_QUALITY)}
            className="px-3 py-1 text-xs bg-white text-[#333333] rounded hover:bg-[#E7E7E7] transition-all"
          >
            High Quality ({QUALITY_PRESETS.HIGH_QUALITY}%)
          </button>
        </div>
        <p className="text-xs text-[#333333] opacity-40">
          Max width: 1400px • {outputFormat} optimization • Auto size-capped
        </p>
      </div>
    </div>
  );
};

export default QualityControls; 