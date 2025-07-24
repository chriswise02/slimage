import React, { useState, useRef, useCallback, useEffect } from "react";
import { imageProcessor } from "./imageProcessor";

// Custom Hooks
import { useStepNavigation } from "./hooks/useStepNavigation";
import { useImageProcessing } from "./hooks/useImageProcessing";
import { useQualityControl } from "./hooks/useQualityControl";

// Components
import StepIndicator from "./components/StepIndicator";
import UploadSection from "./components/UploadSection";
import FilterSection from "./components/FilterSection";
import PreviewSection from "./components/PreviewSection";
import CropModal from "./components/CropModal";
import WedgeModal from "./components/WedgeModal";
import RoundedCornersModal from "./components/RoundedCornersModal";

export default function App() {
  const fileInputRef = useRef(null);

  // Filter and crop state
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [showCropInterface, setShowCropInterface] = useState(false);
  const [showWedgeOptions, setShowWedgeOptions] = useState(false);
  const [showRoundedOptions, setShowRoundedOptions] = useState(false);
  const [wedgePosition, setWedgePosition] = useState('top');
  const [wedgeColor, setWedgeColor] = useState('red');
  const [roundedCorners, setRoundedCorners] = useState({
    topLeft: 0,
    topRight: 0,
    bottomLeft: 0,
    bottomRight: 0
  });
  const [cropAspectRatio, setCropAspectRatio] = useState('free');
  const [cropCustomWidth, setCropCustomWidth] = useState('');
  const [cropCustomHeight, setCropCustomHeight] = useState('');
  const [croppedCanvas, setCroppedCanvas] = useState(null);
  const [roundedPreviewCanvas, setRoundedPreviewCanvas] = useState(null);

  // Custom hooks
  const stepNavigation = useStepNavigation();
  const imageProcessing = useImageProcessing();
  const qualityControl = useQualityControl();

  // Navigation handlers
  const handleNavigateToStep = (step) => {
    stepNavigation.navigateToStep(step, {
      clearProcessedState: imageProcessing.clearProcessedState,
      setSelectedFilter,
      setCroppedCanvas,
      setCropAspectRatio,
      setCropCustomWidth,
      setCropCustomHeight
    });
  };

  const canNavigateToStep = (step) => {
    return stepNavigation.canNavigateToStep(step, !!imageProcessing.originalImage, selectedFilter);
  };

  // File handling
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    await imageProcessing.handleFileSelect(file, () => {
      stepNavigation.markStepComplete('upload');
      stepNavigation.navigateToStep('filter', {});
    });
  };

  // Filter handling
  const handleFilterSelect = (filter) => {
    setSelectedFilter(filter);
    
    // Clear any existing processed state when changing filters
    imageProcessing.clearProcessedState();
    imageProcessor.currentProcessedCanvas = null;
  };

  const applyFilter = async () => {
    stepNavigation.markStepComplete('filter');
    
    if (selectedFilter === 'custom-crop') {
      // For custom crop, show hidden crop interface first
      setShowCropInterface(true);
    } else if (selectedFilter === 'wedge') {
      // For wedge filter, reset selections and show options interface
      setWedgePosition('');
      setWedgeColor('');
      setShowWedgeOptions(true);
    } else if (selectedFilter === 'rounded-corners') {
      // For rounded corners, reset values and show options interface
      setRoundedCorners({
        topLeft: 0,
        topRight: 0,
        bottomLeft: 0,
        bottomRight: 0
      });
      setShowRoundedOptions(true);
    } else {
      // For all other filters, go directly to preview
      await imageProcessing.applyFilter(selectedFilter, qualityControl.qualityValue, () => {
        handleNavigateToStep('preview');
      });
    }
  };

  const applyCrop = async () => {
    await imageProcessing.applyCrop(croppedCanvas, selectedFilter, qualityControl.qualityValue, () => {
      setShowCropInterface(false);
      handleNavigateToStep('preview');
    });
  };

  const applyWedge = async () => {
    // Only apply if both color and position are selected
    if (wedgeColor && wedgePosition) {
      await imageProcessing.applyFilter(selectedFilter, qualityControl.qualityValue, () => {
        setShowWedgeOptions(false);
        handleNavigateToStep('preview');
      }, { wedgePosition, wedgeColor });
    }
  };

  const applyRounded = async () => {
    await imageProcessing.applyFilter(selectedFilter, qualityControl.qualityValue, () => {
      setShowRoundedOptions(false);
      handleNavigateToStep('preview');
    }, { roundedCorners });
  };



  // Update preview when corners change or image changes
  useEffect(() => {
    if (!showRoundedOptions) {
      return;
    }

    // Get the actual Image element from the processor
    const originalImageElement = imageProcessing.getOriginalImageElement();
    
    // Check if we have a valid image and it's actually loaded
    if (!originalImageElement || 
        !originalImageElement.width || 
        !originalImageElement.height ||
        !originalImageElement.complete) {
      setRoundedPreviewCanvas(null);
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Use the original image dimensions for the preview - let CSS handle the sizing
      canvas.width = originalImageElement.width;
      canvas.height = originalImageElement.height;
      
      // Draw the original image at full resolution
      ctx.drawImage(originalImageElement, 0, 0);
      
      // Apply rounded corners with current settings
      imageProcessor.applyRoundedCorners(ctx, canvas.width, canvas.height, roundedCorners);
      
      setRoundedPreviewCanvas(canvas);
    } catch (error) {
      setRoundedPreviewCanvas(null);
    }
  }, [showRoundedOptions, roundedCorners, imageProcessing.originalImageSrc]); // Use a more stable reference

  // Quality control
  const handleQualityChange = async (newQuality) => {
    await qualityControl.handleQualityChange(
      newQuality,
      selectedFilter,
      stepNavigation.currentStep,
      {
        updateProcessedState: imageProcessing.updateProcessedState
      }
    );
  };

  // Crop handling with useCallback to prevent infinite re-renders
  const handleCrop = useCallback((canvas) => {
    setCroppedCanvas(canvas);
  }, []);

  // Reset application
  const reset = () => {
    stepNavigation.reset({
      clearImageState: imageProcessing.clearImageState,
      clearQualityTimeout: qualityControl.clearQualityTimeout,
      resetFilter: () => setSelectedFilter('none'),
      resetCrop: () => {
        setShowCropInterface(false);
        setCropAspectRatio('free');
        setCropCustomWidth('');
        setCropCustomHeight('');
        setCroppedCanvas(null);
      },
      resetWedge: () => {
        setShowWedgeOptions(false);
        setWedgePosition('top');
        setWedgeColor('red');
      },
      resetRounded: () => {
        setShowRoundedOptions(false);
        setRoundedCorners({
          topLeft: 0,
          topRight: 0,
          bottomLeft: 0,
          bottomRight: 0
        });
        setRoundedPreviewCanvas(null);
      }
    });
    qualityControl.resetQuality();
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#333333]">
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-16 text-center">slimage</h1>
        
        {/* Step Indicator */}
        <StepIndicator 
          currentStep={stepNavigation.currentStep}
          completedSteps={stepNavigation.completedSteps}
          canNavigateToStep={canNavigateToStep}
          onNavigate={handleNavigateToStep}
        />

        {/* Loading Overlay */}
        {imageProcessing.isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-[#FFFFFF] p-8 rounded-xl text-center">
              <div className="animate-spin w-6 h-6 border-2 border-[#F0F0F0] border-t-[#FF3008] rounded-full mx-auto mb-4"></div>
              <p className="text-sm text-[#333333]">Processing image...</p>
            </div>
          </div>
        )}

        {/* Upload Section */}
        {stepNavigation.currentStep === 'upload' && (
          <UploadSection 
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
          />
        )}

        {/* Filter Selection */}
        {stepNavigation.currentStep === 'filter' && (
          <FilterSection 
            selectedFilter={selectedFilter}
            onFilterSelect={handleFilterSelect}
            onApplyFilter={applyFilter}
            onNavigateToUpload={() => handleNavigateToStep('upload')}
          />
        )}

        {/* Crop Modal */}
        <CropModal
          isOpen={showCropInterface}
          onClose={() => setShowCropInterface(false)}
          cropAspectRatio={cropAspectRatio}
          setCropAspectRatio={setCropAspectRatio}
          cropCustomWidth={cropCustomWidth}
          setCropCustomWidth={setCropCustomWidth}
          cropCustomHeight={cropCustomHeight}
          setCropCustomHeight={setCropCustomHeight}
          onCrop={handleCrop}
          onApply={applyCrop}
        />

        {/* Wedge Modal */}
        <WedgeModal
          isOpen={showWedgeOptions}
          onClose={() => setShowWedgeOptions(false)}
          wedgePosition={wedgePosition}
          setWedgePosition={setWedgePosition}
          wedgeColor={wedgeColor}
          setWedgeColor={setWedgeColor}
          onApply={applyWedge}
        />

        {/* Rounded Corners Modal */}
        <RoundedCornersModal
          isOpen={showRoundedOptions}
          onClose={() => setShowRoundedOptions(false)}
          roundedCorners={roundedCorners}
          setRoundedCorners={setRoundedCorners}
          roundedPreviewCanvas={roundedPreviewCanvas}
          onApply={applyRounded}
        />

        {/* Preview Section */}
        {stepNavigation.currentStep === 'preview' && (
          <PreviewSection
            selectedFilter={selectedFilter}
            originalImage={imageProcessing.originalImage}
            processedImage={imageProcessing.processedImage}
            processedBlob={imageProcessing.processedBlob}
            fileSizeInfo={imageProcessing.fileSizeInfo}
            isLoading={imageProcessing.isLoading && stepNavigation.currentStep === 'preview'}
            isTriangularSplit={imageProcessing.isTriangularSplit}
            splitBlobs={imageProcessing.splitBlobs}
            qualityValue={qualityControl.qualityValue}
            onQualityChange={handleQualityChange}
            onTriangularSplit={imageProcessing.handleTriangularSplit}
            onDownloadSplit={imageProcessing.downloadSplit}
            onDownload={imageProcessing.handleDownload}
            onReset={reset}
            onNavigateToUpload={() => handleNavigateToStep('upload')}
            onNavigateToFilter={() => handleNavigateToStep('filter')}
          />
        )}
      </div>
    </div>
  );
}