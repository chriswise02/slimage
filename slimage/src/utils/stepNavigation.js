import { STEPS } from '../constants/appConstants';

/**
 * Determine if navigation to a specific step is allowed
 * @param {string} targetStep - Step to navigate to
 * @param {string} currentStep - Current active step
 * @param {Object} completedSteps - Steps that have been completed
 * @param {boolean} hasOriginalImage - Whether an image has been uploaded
 * @param {string} selectedFilter - Currently selected filter
 * @returns {boolean} - Whether navigation is allowed
 */
export const canNavigateToStep = (
  targetStep, 
  currentStep, 
  completedSteps, 
  hasOriginalImage, 
  selectedFilter
) => {
  const stepIndex = STEPS.indexOf(targetStep);
  const currentIndex = STEPS.indexOf(currentStep);
  
  // Always allow navigation to the current step
  if (stepIndex === currentIndex) {
    return true;
  }
  
  // Can always go back to any completed step or the upload step
  if (stepIndex < currentIndex) {
    return stepIndex === 0 || completedSteps[targetStep];
  }
  
  // Can go to next step if current step requirements are met
  if (stepIndex === currentIndex + 1) {
    switch (currentStep) {
      case 'upload': 
        return hasOriginalImage;
      case 'filter': 
        return !!selectedFilter;
      default: 
        return false;
    }
  }
  
  // Can navigate to any completed step from anywhere
  if (completedSteps[targetStep]) {
    return true;
  }
  
  return false;
};

// Removed unused utility functions:
// - getNextStep: Logic is handled directly in components  
// - getStepsToMarkComplete: Not used in current implementation 