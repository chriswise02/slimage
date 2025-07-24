import { useState } from 'react';
import { imageProcessor } from '../imageProcessor';
import { createBlobUrl } from '../utils/formatUtils';
import { DEFAULT_QUALITY, QUALITY_DEBOUNCE_MS, MAX_IMAGE_WIDTH } from '../constants/appConstants';

/**
 * Custom hook for managing quality control and preview updates
 */
export const useQualityControl = () => {
  const [qualityValue, setQualityValue] = useState(DEFAULT_QUALITY);
  const [qualityTimeout, setQualityTimeout] = useState(null);

  const handleQualityChange = async (
    newQuality, 
    selectedFilter, 
    currentStep,
    { updateProcessedState }
  ) => {
    setQualityValue(newQuality);
    
    // Clear any existing timeout
    if (qualityTimeout) {
      clearTimeout(qualityTimeout);
    }
    
    // Debounce the actual processing
    const timeoutId = setTimeout(async () => {
      // Re-process with new quality if we have a processed canvas
      if (imageProcessor.currentProcessedCanvas && currentStep === 'preview') {
        try {
          // Create the optimized blob with new quality using the current filter
          const blob = await imageProcessor.optimizeImage(
            imageProcessor.currentProcessedCanvas, 
            newQuality / 100, 
            MAX_IMAGE_WIDTH,
            selectedFilter
          );
          
          // Create a preview image that matches the actual quality
          const previewUrl = createBlobUrl(blob);
          const sizeInfo = imageProcessor.getFileSizeInfo(blob);
          
          // Update all processed state at once
          updateProcessedState(previewUrl, blob, sizeInfo);
          
        } catch (error) {
          // Error updating quality - silently handled
        }
      }
    }, QUALITY_DEBOUNCE_MS);
    
    setQualityTimeout(timeoutId);
  };

  const clearQualityTimeout = () => {
    if (qualityTimeout) {
      clearTimeout(qualityTimeout);
      setQualityTimeout(null);
    }
  };

  const resetQuality = () => {
    setQualityValue(DEFAULT_QUALITY);
    clearQualityTimeout();
  };

  return {
    qualityValue,
    handleQualityChange,
    clearQualityTimeout,
    resetQuality,
    setQualityValue
  };
}; 