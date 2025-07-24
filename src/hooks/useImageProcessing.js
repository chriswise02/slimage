import { useState } from 'react';
import { imageProcessor } from '../imageProcessor';
import { createBlobUrl, cleanupBlobUrl } from '../utils/formatUtils';
import { MAX_IMAGE_WIDTH } from '../constants/appConstants';

/**
 * Custom hook for managing image processing operations
 */
export const useImageProcessing = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [processedBlob, setProcessedBlob] = useState(null);
  const [fileSizeInfo, setFileSizeInfo] = useState(null);
  const [isTriangularSplit, setIsTriangularSplit] = useState(false);
  const [splitBlobs, setSplitBlobs] = useState(null);

  const handleFileSelect = async (file, onSuccess) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }
    
    try {
      setIsLoading(true);
      await imageProcessor.loadImageFromFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target.result);
        setIsLoading(false);
        onSuccess?.();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert('Failed to load image. Please try again.');
      setIsLoading(false);
    }
  };

  const applyFilter = async (selectedFilter, qualityValue, onSuccess, options = {}) => {
    try {
      setIsLoading(true);
      
      // Set wedge options if provided
      if (selectedFilter === 'wedge' && options.wedgePosition && options.wedgeColor) {
        imageProcessor.setWedgeOptions(options.wedgePosition, options.wedgeColor);
      }
      
      // Set rounded corners options if provided
      if (selectedFilter === 'rounded-corners' && options.roundedCorners) {
        imageProcessor.setRoundedOptions(options.roundedCorners);
      }
      
      // Apply the selected filter
      const canvas = await imageProcessor.applyFilter(selectedFilter);
      
      // Ensure currentProcessedCanvas is set to the new filtered canvas
      imageProcessor.currentProcessedCanvas = canvas;
      
      // Optimize the image with current quality
      const blob = await imageProcessor.optimizeImage(
        canvas, 
        qualityValue / 100, 
        MAX_IMAGE_WIDTH, 
        selectedFilter
      );
      
      // Create preview image that matches the actual download quality
      const processedUrl = createBlobUrl(blob);
      
      // Clean up old processed image
      cleanupBlobUrl(processedImage);
      
      setProcessedImage(processedUrl);
      setProcessedBlob(blob);
      
      // Get file size info
      const sizeInfo = imageProcessor.getFileSizeInfo(blob);
      setFileSizeInfo(sizeInfo);
      
      // Check if this is quadrilateral mask for split download option
      setIsTriangularSplit(selectedFilter === 'triangular-mask');
      
      setIsLoading(false);
      onSuccess?.();
    } catch (error) {
      alert('Failed to process image. Please try again.');
      setIsLoading(false);
    }
  };

  const applyCrop = async (croppedCanvas, selectedFilter, qualityValue, onSuccess) => {
    try {
      setIsLoading(true);
      
      // Use cropped canvas if available, otherwise use original
      const sourceCanvas = croppedCanvas || await imageProcessor.applyFilter('none');
      
      // Apply any additional filters to the cropped image
      let finalCanvas = sourceCanvas;
      if (selectedFilter !== 'custom-crop' && selectedFilter !== 'none') {
        // Store the cropped canvas directly
        imageProcessor.croppedImage = sourceCanvas;
        finalCanvas = await imageProcessor.applyFilter(selectedFilter);
      }
      
      // Ensure currentProcessedCanvas is set to the final canvas
      imageProcessor.currentProcessedCanvas = finalCanvas;
      
      const blob = await imageProcessor.optimizeImage(
        finalCanvas, 
        qualityValue / 100, 
        MAX_IMAGE_WIDTH, 
        selectedFilter
      );
      
      // Create preview image that matches the actual download quality
      const processedUrl = createBlobUrl(blob);
      
      // Clean up old processed image
      cleanupBlobUrl(processedImage);
      
      setProcessedImage(processedUrl);
      setProcessedBlob(blob);
      
      const sizeInfo = imageProcessor.getFileSizeInfo(blob);
      setFileSizeInfo(sizeInfo);
      
      setIsTriangularSplit(selectedFilter === 'triangular-mask');
      setIsLoading(false);
      onSuccess?.();
    } catch (error) {
      alert('Failed to apply crop. Please try again.');
      setIsLoading(false);
    }
  };

  const handleTriangularSplit = async (qualityValue) => {
    if (imageProcessor.currentProcessedCanvas) {
      try {
        setIsLoading(true);
        const { top, bottom } = await imageProcessor.processTriangularMaskSplit(
          qualityValue / 100
        );
        setSplitBlobs({ top, bottom });
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
      }
    }
  };

  const downloadSplit = (type) => {
    if (splitBlobs && splitBlobs[type]) {
      imageProcessor.downloadBlob(splitBlobs[type], `-slimage-${type}-half`);
    }
  };

  const handleDownload = () => {
    if (processedBlob) {
      imageProcessor.downloadBlob(processedBlob, '-slimage-processed');
    }
  };

  const clearImageState = () => {
    cleanupBlobUrl(processedImage);
    setOriginalImage(null);
    setProcessedImage(null);
    setProcessedBlob(null);
    setFileSizeInfo(null);
    setIsTriangularSplit(false);
    setSplitBlobs(null);
  };

  // Internal state update functions for hooks communication
  const updateProcessedState = (image, blob, sizeInfo) => {
    if (processedImage) cleanupBlobUrl(processedImage);
    setProcessedImage(image);
    setProcessedBlob(blob);
    setFileSizeInfo(sizeInfo);
  };

  const clearProcessedState = () => {
    if (processedImage) cleanupBlobUrl(processedImage);
    setProcessedImage(null);
    setProcessedBlob(null);
    setFileSizeInfo(null);
    setSplitBlobs(null);
    setIsTriangularSplit(false);
  };

  return {
    isLoading,
    originalImage,
    processedImage,
    processedBlob,
    fileSizeInfo,
    isTriangularSplit,
    splitBlobs,
    handleFileSelect,
    applyFilter,
    applyCrop,
    handleTriangularSplit,
    downloadSplit,
    handleDownload,
    clearImageState,
    // Consolidated state updates for other hooks
    updateProcessedState,
    clearProcessedState,
    // Expose the actual Image object for preview generation
    getOriginalImageElement: () => imageProcessor.originalImage
  };
}; 