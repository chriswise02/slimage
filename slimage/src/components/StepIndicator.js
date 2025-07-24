import React from 'react';
import { STEPS, STEP_TITLES } from '../constants/appConstants';
import { Check } from 'lucide-react';

const getStepIcon = (step, isCompleted, stepNumber, isCurrent, isAccessible) => {
  // Show red checkmark only for completed steps
  if (isCompleted) return <Check size={16} className="text-[#FF3008]" />;
  
  // Show number with color matching the text below
  const numberColor = isCurrent ? 'text-[#FF3008]' : isAccessible ? 'text-[#333333]' : 'text-[#999999]';
  
  return (
    <span className={`${numberColor} font-medium text-sm`}>
      {stepNumber}
    </span>
  );
};

const StepIndicator = ({ currentStep, completedSteps, canNavigateToStep, onNavigate }) => {
  return (
    <div className="mb-12">
      <div className="flex items-center justify-center space-x-8">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps[step];
          const isCurrent = currentStep === step;
          const isAccessible = canNavigateToStep(step);
          
          return (
            <React.Fragment key={step}>
              <div 
                className={`flex flex-col items-center cursor-pointer transition-opacity ${
                  isAccessible ? 'hover:opacity-75' : 'cursor-not-allowed opacity-40'
                }`}
                onClick={() => isAccessible && onNavigate(step)}
              >
                <div className="flex items-center justify-center mb-2">
                  {getStepIcon(step, isCompleted, index + 1, isCurrent, isAccessible)}
                </div>
                <span 
                  className={`text-sm font-medium text-center ${
                    isCurrent ? 'text-[#FF3008]' : isAccessible ? 'text-[#333333]' : 'text-[#999999]'
                  }`}
                >
                  {STEP_TITLES[step]}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div 
                  className={`flex-1 h-px mx-3 ${
                    completedSteps[step] ? 'bg-[#FF3008]' : 'bg-[#F0F0F0]'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator; 