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
  }, [showRoundedOptions, roundedCorners, imageProcessing.originalImageSrc, imageProcessing]); // Added imageProcessing dependency

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
      <div className="container mx-auto px-6 py-8 max-w-3xl">
        <div className="mb-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="129" height="71" viewBox="0 0 129 71" fill="none" className="mx-auto">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M30.4074 0.852813C30.2813 0.885984 28.94 1.12674 27.4266 1.38767C23.6548 2.0381 23.2248 2.17292 22.554 2.91552C22.0803 3.43983 22.0001 3.63427 22.0001 4.2584C22.0001 5.43559 22.4736 5.95853 23.9049 6.36193C25.0655 6.6892 25.7068 7.30951 26.04 8.42738C26.3986 9.63025 26.6371 17.8389 26.5394 25.6162C26.4673 31.357 26.4269 32.1082 26.0601 34.5575C25.5256 38.1239 25.5996 38.523 27.109 40.2145C28.2295 41.4703 28.476 42.035 28.5442 43.5009C28.5893 44.4728 28.4849 45.2886 28.0352 47.4753C27.6061 49.5615 27.4888 50.4449 27.5503 51.1294C27.6906 52.6944 28.8002 53.819 30.204 53.819C31.4056 53.819 32.215 53.302 32.7171 52.214C33.1322 51.3145 33.0782 50.0051 32.5261 47.5889C32.1925 46.1287 32.0423 45.0685 32.0336 44.1123C32.019 42.5379 32.1332 42.2464 33.5215 40.3113C33.9793 39.6731 34.4806 38.8227 34.6354 38.4216C34.994 37.4922 34.9948 35.8713 34.638 33.4121C34.1916 30.3362 34.0276 24.5998 34.2228 18.8903C34.4177 13.1856 34.5394 11.3447 35.0159 6.89067C35.2051 5.12207 35.3049 3.51474 35.2449 3.20091C34.9696 1.75913 33.7772 0.936122 31.8353 0.847157C31.176 0.816891 30.5335 0.819489 30.4074 0.852813ZM39.0441 3.9695C37.5907 4.64025 36.9569 6.23429 37.445 7.99142C37.6439 8.70727 38.5973 9.54159 39.508 9.79656C41.0279 10.2221 42.8118 9.57185 43.511 8.3375C43.9177 7.61921 43.9884 6.05253 43.6435 5.39263C43.3363 4.80458 42.6524 4.19405 41.9915 3.91798C41.2176 3.59468 39.8026 3.61945 39.0441 3.9695ZM11.5291 8.05945C7.66705 8.68159 4.72799 11.1092 3.69083 14.5337C3.26205 15.9492 3.15077 17.3514 3.35102 18.8135C3.55936 20.335 3.94901 21.3743 4.68947 22.383C5.68627 23.7409 6.95655 24.4989 13.1048 27.4048C14.2853 27.9627 14.997 28.6494 15.2418 29.4664C15.8732 31.5739 14.7905 33.0389 12.6133 33.0232C10.8377 33.0103 9.7189 32.348 8.53377 30.6078C7.51266 29.1086 7.07654 28.6376 6.37613 28.2772C4.72019 27.4254 2.1856 28.5601 1.08898 30.6441C0.73541 31.3159 0.678392 31.6062 0.680991 32.7242C0.683742 33.8963 0.732505 34.1132 1.17993 34.9407C1.45279 35.4451 2.16634 36.4769 2.76571 37.2336C4.3732 39.2628 4.50022 39.6034 4.47638 41.8194C4.46552 42.8283 4.43144 44.2414 4.40056 44.9595C4.35485 46.0254 4.39521 46.3426 4.62037 46.6865C5.27141 47.6807 6.85581 48.0415 7.68998 47.3854C8.46896 46.7726 8.58742 46.3195 8.46804 44.4095L8.36012 42.6816L8.77116 42.2705C9.11174 41.9299 9.27438 41.8745 9.72012 41.9468C10.0161 41.9948 10.4855 42.2075 10.7634 42.4194C12.3484 43.6284 12.4569 46.3047 11.2039 53.284C10.6009 56.6433 10.5794 57.805 11.1014 58.8112C11.7989 60.1551 13.2972 60.7216 14.7188 60.1787C16.634 59.4472 16.9266 57.7428 16.0208 52.5961C15.5804 50.0932 15.522 49.434 15.5133 46.8612L15.5035 43.9543L16.0079 42.929C16.6386 41.6472 17.2971 41.0982 19.4173 40.0874C20.833 39.4123 21.1682 39.1742 22.064 38.2067C23.2705 36.9036 24.1823 35.1588 24.5406 33.468C24.8726 31.901 24.7578 29.1651 24.3073 27.9091C23.3645 25.28 21.1532 23.2916 17.1836 21.5033C14.4396 20.2671 13.1159 19.3547 12.5892 18.3361C12.3058 17.7878 12.3079 16.6253 12.5936 16.0729C13.6967 13.94 16.4766 14.4344 17.8704 17.011C18.5668 18.2987 18.8653 18.6335 19.6307 18.9849C20.3125 19.2979 21.599 19.3589 22.2576 19.1093C23.7092 18.5593 24.4321 16.5796 23.994 14.3533C23.4241 11.4563 21.1505 9.3311 17.6347 8.40919C16.4336 8.0943 12.6563 7.87785 11.5291 8.05945ZM79.0464 10.4103C77.5562 10.8007 76.5754 11.3576 75.6444 12.342C73.6795 14.4197 73.4704 17.1588 75.1884 18.3166C76.1872 18.9896 77.4657 18.6619 78.6351 17.4329C80.0513 15.9443 81.7727 15.8098 82.4575 17.134C82.9332 18.0541 82.5983 19.2796 81.6796 19.9803C81.402 20.1922 80.3714 20.7009 79.3893 21.1109C76.9773 22.1182 76.0847 22.6708 74.8106 23.946C74.0415 24.7158 73.5714 25.3543 73.1793 26.1625C72.4 27.7687 72.2125 28.6879 72.2302 30.8134C72.2559 33.8775 73.0937 35.8028 75.0155 37.2134C75.5075 37.5746 75.9123 38.0378 76.1398 38.4994C76.4645 39.1587 76.4947 39.418 76.4906 41.5137C76.4874 43.2086 76.4097 44.1455 76.1928 45.1059C76.0149 45.8933 75.8961 47.0075 75.8914 47.9339C75.8845 49.2703 75.9291 49.5418 76.2456 50.0941C77.1126 51.6073 79.1588 51.804 80.2719 50.4813C81.0535 49.5524 81.0968 48.3992 80.476 45.0295C80.2129 43.6012 80.1713 40.6973 80.4022 39.8663C80.6197 39.0831 81.3027 38.3446 82.4315 37.672C82.9497 37.3631 83.5705 36.9318 83.8111 36.7134C84.1812 36.3774 84.27 36.3516 84.3888 36.5457C84.4661 36.6718 84.7507 37.1514 85.0216 37.6115C85.676 38.7235 86.4018 39.1384 87.6982 39.1419C88.8592 39.1448 89.575 38.8204 90.3844 37.9245C91.4652 36.7282 91.5207 35.9479 90.6238 34.5602C89.8711 33.3959 89.5388 32.5782 89.1628 30.9663C88.785 29.3467 88.7881 25.2618 89.17 21.4505C89.5292 17.8649 89.4534 15.4851 88.9352 14.0855C88.2257 12.1696 86.5186 10.8337 84.1381 10.3317C82.6431 10.0164 80.4188 10.0508 79.0464 10.4103ZM118.823 10.5488C116.383 10.938 114.417 12.2338 112.912 14.4434C109.793 19.0223 109.292 27.5743 111.833 32.8634C112.738 34.747 114.286 36.349 116.01 37.1865C116.64 37.4928 117.343 37.9394 117.57 38.1786C118.48 39.134 118.671 40.8913 118.218 44.1492C117.931 46.212 118.047 46.8372 118.845 47.5378C119.3 47.9369 119.507 48.0101 120.18 48.0097C122.191 48.0083 122.891 46.6186 122.366 43.6719C121.884 40.9654 122.134 39.0103 123.075 38.1349C123.351 37.8785 124.091 37.3692 124.72 37.0031C125.349 36.637 126.193 35.9931 126.597 35.5723C129.29 32.7636 129.029 28.2418 126.175 28.2418C125.444 28.2418 124.729 28.5882 123.83 29.3765C122.783 30.296 122.005 30.6042 120.696 30.6176C119.812 30.6268 119.404 30.5528 118.842 30.2807C117.598 29.6784 116.856 28.2629 116.955 26.6837L117.003 25.9219L120.978 25.8269C126.177 25.703 127.097 25.5257 127.978 24.479C128.645 23.6864 128.748 23.097 128.648 20.6581C128.374 13.9866 125.894 10.7301 120.901 10.4875C120.187 10.4528 119.251 10.4805 118.823 10.5488ZM64.0529 10.7931C62.9309 11.106 61.922 11.6778 60.9252 12.5662C60.4659 12.9758 60.0322 13.3084 59.9616 13.3052C59.8909 13.3021 59.6331 12.9842 59.3887 12.5987C58.5984 11.3524 57.1664 10.7122 55.1691 10.7122C53.7455 10.7122 52.7004 11.1847 51.5764 12.3367C51.0537 12.8724 50.5825 13.3108 50.5291 13.3108C50.4758 13.3108 50.4311 13.1217 50.4299 12.8905C50.4244 11.8446 49.5525 11.1689 48.2157 11.1745C47.3039 11.1781 46.2544 11.6181 45.9763 12.1132C45.8172 12.3963 45.7724 14.4759 45.7594 22.1768C45.7492 28.2229 45.6813 32.287 45.5792 32.9535C45.122 35.9416 45.0455 36.9263 45.2209 37.5706C45.6108 39.0033 46.8756 39.8087 48.7507 39.8185C50.7743 39.8292 52.0284 38.888 52.4397 37.0497C52.6388 36.1602 52.5467 34.9093 52.0469 31.7084C51.7366 29.7212 51.5907 24.4576 51.7861 22.2896C51.963 20.3267 52.2792 19.3767 52.9677 18.7385C53.4512 18.2904 54.1668 18.2348 54.6944 18.6046C55.4055 19.1026 55.5327 19.7278 55.5991 23.049C55.6657 26.3925 55.4872 29.1781 54.9985 32.4185C54.8274 33.5535 54.6772 35.1084 54.6646 35.8736C54.64 37.3835 54.5472 37.1171 56.1778 40.2144C56.9132 41.6112 57.0519 42.6143 56.9588 45.8702C56.8727 48.8818 56.8502 49.0389 55.9293 53.0547C55.4717 55.0499 55.4569 57.1823 55.8946 58.0227C56.277 58.757 56.925 59.3962 57.512 59.618C58.6216 60.0373 60.1745 59.6073 60.8677 58.689C61.7936 57.4625 61.8118 55.9522 60.9507 51.7919C60.3179 48.7347 60.3102 48.6595 60.3011 45.4117C60.2907 41.7202 60.3446 41.4238 61.4836 38.9271C62.0223 37.7461 62.125 37.3571 62.1722 36.3164C62.2033 35.635 62.1142 34.349 61.9709 33.4121C61.7861 32.2029 61.6918 30.2906 61.6352 26.6044C61.5509 21.1028 61.6453 20.1167 62.3523 19.1238C63.0027 18.2105 64.2236 18.1599 64.862 19.0199C65.1642 19.4271 65.1816 19.6222 65.1552 22.3052C65.1293 24.9205 64.9383 28.2952 64.4743 34.3292C64.2686 37.0067 64.4051 37.9984 65.1142 38.9774C65.8242 39.9576 66.6127 40.3957 67.8203 40.4811C70.0027 40.6357 71.5087 39.6924 72.0015 37.8623C72.1426 37.3385 72.1143 37.0285 71.8263 35.9364C71.6376 35.2207 71.3925 34.1534 71.2818 33.5649C70.9781 31.95 71.0241 26.923 71.3887 21.9145C71.7554 16.8734 71.7206 15.0171 71.2352 13.7469C70.7974 12.6011 69.8853 11.5933 68.8102 11.0673C68.0597 10.7 67.726 10.6355 66.4082 10.602C65.4016 10.5763 64.5953 10.6417 64.0529 10.7931ZM97.9885 10.8674C94.6528 11.573 92.2668 14.6987 91.2576 19.6848C90.2706 24.5622 90.6457 30.3295 92.1429 33.2954C92.8608 34.7173 94.1181 35.9789 95.4961 36.6599C96.6158 37.2133 96.7138 37.2336 98.2698 37.2336C99.7701 37.2336 99.9555 37.1992 100.924 36.7403C101.497 36.469 102.161 36.1078 102.4 35.9378C102.639 35.7677 102.875 35.6286 102.925 35.6286C103.089 35.6286 103.021 36.7987 102.788 38.0199C102.489 39.5805 101.942 40.6688 101.072 41.4348C99.3831 42.9216 96.9816 42.8165 94.5594 41.1499C93.1355 40.1702 91.5473 40.1976 89.992 41.2283C88.4992 42.2178 87.7291 43.6107 87.7318 45.3163C87.7335 46.426 88.1299 47.3782 89.0961 48.595C90.1836 49.964 90.2238 50.1491 90.0993 53.2169C89.9772 56.2251 90.0698 56.6554 90.9353 57.1029C92.0213 57.6644 93.2142 57.2604 93.6219 56.193C93.86 55.5691 93.8665 55.344 93.6878 53.8415C93.5791 52.9275 93.5334 52.0671 93.5863 51.9293C93.7257 51.566 94.7717 51.5989 95.2586 51.9818C95.8589 52.454 96.1493 53.4086 96.3044 55.4201C96.4928 57.8588 96.2658 60.7925 95.6649 63.6862C94.9243 67.2526 95.1786 69.0339 96.5616 69.9653C98.0947 70.998 100.374 70.1593 100.868 68.3806C101.12 67.4712 101.052 65.4878 100.713 63.9078C99.7551 59.4382 99.7045 55.0555 100.588 53.0556C100.977 52.1744 101.749 51.3732 102.209 51.3732C102.716 51.3732 102.894 51.9633 102.857 53.5133C102.804 55.6653 102.825 55.7911 103.31 56.2766C103.676 56.6424 103.886 56.7234 104.469 56.7234C105.059 56.7234 105.26 56.6434 105.65 56.2538C105.65 56.2538 105.76 56.0218 105.852 55.7796C105.911 55.6267 105.926 54.4038 105.926 54.4038C105.926 53.4102 105.857 51.6947 105.852 51.0599C105.845 49.9568 105.873 49.8624 106.486 48.9198C107.317 47.6445 107.692 46.7785 108.054 45.307C108.63 42.9637 108.707 41.4309 108.825 29.8198C108.949 17.6714 108.974 17.2571 109.759 14.712C110.081 13.6659 110.187 13.0725 110.121 12.68C109.848 11.0586 107.35 10.583 105.414 11.7841C104.537 12.3281 104.469 12.3334 103.781 11.9134C102.225 10.9646 99.6917 10.5071 97.9885 10.8674ZM38.2862 12.0063C37.2255 12.2909 36.9789 12.6506 36.9872 13.901C36.9908 14.4591 37.0566 15.2254 37.1335 15.6038C37.2103 15.9821 37.3505 17.7559 37.4448 19.5454C37.6394 23.2343 37.436 30.5138 37.0573 33.4121C36.7184 36.0054 36.757 37.5586 37.1787 38.3032C37.7123 39.2456 38.6188 39.6804 40.0377 39.6748C41.4397 39.6691 42.309 39.2532 43.0117 38.252L43.477 37.589L43.4887 26.0231C43.4951 19.6619 43.4426 14.1169 43.3722 13.7009C43.2294 12.8573 42.8104 12.3082 42.068 11.9918C41.4438 11.726 39.3003 11.7341 38.2862 12.0063ZM121.823 16.712C122.626 17.256 123.078 18.2502 123.005 19.3152C122.91 20.7085 122.874 20.7246 119.864 20.7246H117.309L117.261 19.9692C117.206 19.0916 117.538 18.1026 118.12 17.4103C118.981 16.3876 120.829 16.0391 121.823 16.712ZM101.328 17.4346C102.606 18.0867 103.18 19.5489 103.287 22.4238C103.399 25.4793 102.925 27.5557 101.866 28.6468C100.571 29.98 98.5585 29.3368 97.6455 27.2976C97.3697 26.6821 97.2904 26.1729 97.2377 24.6803C97.1598 22.4816 97.4442 20.7822 98.1423 19.2724C99.0503 17.3088 100.004 16.7589 101.328 17.4346ZM83.3634 25.3772C83.5436 26.2362 83.2657 28.8476 82.8848 29.8736C82.4299 31.099 81.3413 31.9571 80.2401 31.9585C79.8408 31.959 79.0258 31.3698 78.7107 30.853C77.9694 29.6372 78.6018 27.4259 80.0588 26.1386C81.0935 25.2244 82.2158 24.6099 82.7623 24.6583C83.1717 24.6946 83.2362 24.7717 83.3634 25.3772ZM37.0919 56.7232C36.8782 56.8912 36.4752 57.562 36.1964 58.2136C35.7462 59.2655 35.6888 59.5568 35.6853 60.809C35.6813 62.1927 35.6905 62.2291 36.1674 62.7064C36.566 63.1055 36.8002 63.2039 37.4667 63.2533C39.6583 63.4155 40.3804 61.2025 39.1191 58.1893C38.3735 56.408 37.9146 56.076 37.0919 56.7232Z" fill="#FF3008"/>
          </svg>
        </div>
        
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