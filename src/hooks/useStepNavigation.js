import { useState } from 'react';
import { canNavigateToStep as canNavigate } from '../utils/stepNavigation';
import { imageProcessor } from '../imageProcessor';

/**
 * Custom hook for managing step navigation and state cleanup
 */
export const useStepNavigation = () => {
  const [currentStep, setCurrentStep] = useState('upload');
  const [completedSteps, setCompletedSteps] = useState({
    upload: false,
    filter: false,
    preview: false
  });

  const markStepComplete = (step) => {
    setCompletedSteps(prev => ({
      ...prev,
      [step]: true
    }));
  };

  const canNavigateToStep = (step, hasOriginalImage, selectedFilter) => {
    return canNavigate(step, currentStep, completedSteps, hasOriginalImage, selectedFilter);
  };

  const navigateToStep = (
    step, 
    stateFunctions = {}
  ) => {
    if (step === currentStep) {
      return;
    }
    
    const {
      clearProcessedState,
      setSelectedFilter,
      setCroppedCanvas,
      setCropAspectRatio,
      setCropCustomWidth,
      setCropCustomHeight
    } = stateFunctions;
    
    // Handle state cleanup when navigating between steps
    if (step === 'filter') {
      // Clear processed state when going back to filter selection
      imageProcessor.currentProcessedCanvas = null;
      if (clearProcessedState) clearProcessedState();
    } else if (step === 'upload') {
      // Clear all state when going back to upload
      if (setSelectedFilter) setSelectedFilter('none');
      if (clearProcessedState) clearProcessedState();
      if (setCroppedCanvas) setCroppedCanvas(null);
      if (setCropAspectRatio) setCropAspectRatio('free');
      if (setCropCustomWidth) setCropCustomWidth('');
      if (setCropCustomHeight) setCropCustomHeight('');
      imageProcessor.currentProcessedCanvas = null;
      imageProcessor.croppedImage = null;
    }
    
    setCurrentStep(step);
  };

  const reset = (stateClearFunctions) => {
    setCurrentStep('upload');
    setCompletedSteps({
      upload: false,
      filter: false,
      preview: false
    });
    
    // Call all state clear functions
    Object.values(stateClearFunctions).forEach(fn => fn && fn());
    
    // Clear image processor state
    imageProcessor.originalFile = null;
    imageProcessor.originalImage = null;
    imageProcessor.processedBlob = null;
    imageProcessor.currentProcessedCanvas = null;
    imageProcessor.croppedImage = null;
  };

  return {
    currentStep,
    completedSteps,
    markStepComplete,
    canNavigateToStep,
    navigateToStep,
    reset
  };
}; 