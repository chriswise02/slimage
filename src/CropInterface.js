import React, { useState, useRef, useEffect, useCallback } from 'react';

const CropInterface = ({ 
  originalImage, 
  onCrop, 
  aspectRatio = 'free',
  customWidth = '',
  customHeight = '' 
}) => {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [cropSelection, setCropSelection] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, cropX: 0, cropY: 0, cropWidth: 0, cropHeight: 0 });
  const [imageDisplayArea, setImageDisplayArea] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Initialize crop area when image loads
  useEffect(() => {
    if (originalImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const maxWidth = 600;
      const maxHeight = 400;

      let { width, height } = originalImage;

      // Scale image to fit in crop canvas
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      // Set canvas size
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';

      // Store image display area
      setImageDisplayArea({ x: 0, y: 0, width, height });

      // Draw image
      ctx.drawImage(originalImage, 0, 0, width, height);

      // Initialize crop selection (80% of image, centered)
      const margin = 0.1;
      const initialCrop = {
        x: width * margin,
        y: height * margin,
        width: width * (1 - 2 * margin),
        height: height * (1 - 2 * margin)
      };

      setCropSelection(initialCrop);
    }
  }, [originalImage]);

  // Handle crop area updates when aspect ratio or custom dimensions change
  useEffect(() => {
    if (aspectRatio !== 'free' && aspectRatio !== 'custom') {
      // eslint-disable-next-line no-use-before-define
      updateCropForAspectRatio();
    } else if (aspectRatio === 'custom' && customWidth && customHeight) {
      // eslint-disable-next-line no-use-before-define
      updateCropForCustomDimensions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspectRatio, customWidth, customHeight, cropSelection.width]);

  const updateCropForAspectRatio = useCallback(() => {
    let targetRatio = null;
    
    if (aspectRatio === '1:1') targetRatio = 1;
    else if (aspectRatio === '16:9') targetRatio = 16/9;
    else if (aspectRatio === '4:3') targetRatio = 4/3;
    else if (aspectRatio === '3:2') targetRatio = 3/2;
    else if (aspectRatio === '9:16') targetRatio = 9/16;
    else if (customWidth && customHeight) {
      targetRatio = parseFloat(customWidth) / parseFloat(customHeight);
    }

    if (targetRatio) {
      setCropSelection(prev => {
        let newWidth = prev.width;
        let newHeight = prev.height;

        // Adjust dimensions to match ratio
        if (newWidth / newHeight > targetRatio) {
          newWidth = newHeight * targetRatio;
        } else {
          newHeight = newWidth / targetRatio;
        }

        // Keep within bounds
        if (prev.x + newWidth > imageDisplayArea.width) {
          newWidth = imageDisplayArea.width - prev.x;
          newHeight = newWidth / targetRatio;
        }
        if (prev.y + newHeight > imageDisplayArea.height) {
          newHeight = imageDisplayArea.height - prev.y;
          newWidth = newHeight * targetRatio;
        }

        return {
          ...prev,
          width: newWidth,
          height: newHeight
        };
      });
    }
  }, [aspectRatio, customWidth, customHeight, imageDisplayArea]);

  const updateCropForCustomDimensions = useCallback(() => {
    if (!originalImage || imageDisplayArea.width === 0) return;

    const targetWidth = parseFloat(customWidth);
    const targetHeight = parseFloat(customHeight);
    const scale = originalImage.width / imageDisplayArea.width;

    // Convert custom pixel dimensions to display dimensions
    let displayWidth = targetWidth / scale;
    let displayHeight = targetHeight / scale;

    // Ensure the crop area fits within the image bounds
    const maxWidth = imageDisplayArea.width;
    const maxHeight = imageDisplayArea.height;

    if (displayWidth > maxWidth || displayHeight > maxHeight) {
      // Scale down proportionally to fit
      const scaleDown = Math.min(maxWidth / displayWidth, maxHeight / displayHeight);
      displayWidth *= scaleDown;
      displayHeight *= scaleDown;
    }

    // Center the crop area
    const x = Math.max(0, (imageDisplayArea.width - displayWidth) / 2);
    const y = Math.max(0, (imageDisplayArea.height - displayHeight) / 2);

    setCropSelection({
      x,
      y,
      width: displayWidth,
      height: displayHeight
    });
  }, [customWidth, customHeight, originalImage, imageDisplayArea]);

  // Mouse/Touch event handlers
  const startDrag = (e) => {
    setIsDragging(true);
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    // Calculate relative position within the crop area
    setDragStart({
      x: clientX - rect.left - cropSelection.x,
      y: clientY - rect.top - cropSelection.y
    });
    
    e.preventDefault();
  };

  const startResize = (e) => {
    setIsResizing(true);
    setResizeDirection(e.target.dataset.direction);
    
    // Removed unused rect variable
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    setResizeStart({
      x: clientX,
      y: clientY,
      cropX: cropSelection.x,
      cropY: cropSelection.y,
      cropWidth: cropSelection.width,
      cropHeight: cropSelection.height
    });
    
    e.preventDefault();
  };

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      updateDrag(e);
    } else if (isResizing) {
      updateResize(e);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, isResizing, dragStart, resizeStart, cropSelection, imageDisplayArea, aspectRatio, customWidth, customHeight]);

  const updateDrag = (e) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    // Calculate new position relative to canvas
    const newX = Math.max(0, Math.min(
      clientX - rect.left - dragStart.x,
      imageDisplayArea.width - cropSelection.width
    ));
    const newY = Math.max(0, Math.min(
      clientY - rect.top - dragStart.y,
      imageDisplayArea.height - cropSelection.height
    ));
    
    setCropSelection(prev => ({ ...prev, x: newX, y: newY }));
  };

  const updateResize = (e) => {
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const deltaX = clientX - resizeStart.x;
    const deltaY = clientY - resizeStart.y;
    
    let newX = resizeStart.cropX;
    let newY = resizeStart.cropY;
    let newWidth = resizeStart.cropWidth;
    let newHeight = resizeStart.cropHeight;

    // Handle different resize directions
    switch (resizeDirection) {
      case 'nw': // Top-left
        newX += deltaX;
        newY += deltaY;
        newWidth -= deltaX;
        newHeight -= deltaY;
        break;
      case 'ne': // Top-right
        newY += deltaY;
        newWidth += deltaX;
        newHeight -= deltaY;
        break;
      case 'sw': // Bottom-left
        newX += deltaX;
        newWidth -= deltaX;
        newHeight += deltaY;
        break;
      case 'se': // Bottom-right
        newWidth += deltaX;
        newHeight += deltaY;
        break;
      case 'n': // Top
        newY += deltaY;
        newHeight -= deltaY;
        break;
      case 'e': // Right
        newWidth += deltaX;
        break;
      case 's': // Bottom
        newHeight += deltaY;
        break;
      case 'w': // Left
        newX += deltaX;
        newWidth -= deltaX;
        break;
      default:
        // No action needed for unknown resize direction
        break;
    }

    // Maintain aspect ratio if set or custom dimensions provided
    const hasCustomDimensions = customWidth && customHeight && !isNaN(parseFloat(customWidth)) && !isNaN(parseFloat(customHeight));
    
    if (aspectRatio !== 'free' || hasCustomDimensions) {
      let targetRatio = null;
      if (hasCustomDimensions) {
        targetRatio = parseFloat(customWidth) / parseFloat(customHeight);
      } else if (aspectRatio === '1:1') targetRatio = 1;
      else if (aspectRatio === '16:9') targetRatio = 16/9;
      else if (aspectRatio === '4:3') targetRatio = 4/3;
      else if (aspectRatio === '3:2') targetRatio = 3/2;
      else if (aspectRatio === '9:16') targetRatio = 9/16;

      if (targetRatio) {
        if (['nw', 'ne', 'sw', 'se'].includes(resizeDirection)) {
          // Corner handles - maintain ratio
          const currentRatio = newWidth / newHeight;
          if (currentRatio > targetRatio) {
            newHeight = newWidth / targetRatio;
            // Adjust position for top corners
            if (resizeDirection === 'nw' || resizeDirection === 'ne') {
              newY = resizeStart.cropY + resizeStart.cropHeight - newHeight;
            }
          } else {
            newWidth = newHeight * targetRatio;
            // Adjust position for left corners
            if (resizeDirection === 'nw' || resizeDirection === 'sw') {
              newX = resizeStart.cropX + resizeStart.cropWidth - newWidth;
            }
          }
        }
      }
    }

    // Enforce minimum size
    newWidth = Math.max(20, newWidth);
    newHeight = Math.max(20, newHeight);

    // Keep within bounds
    newX = Math.max(0, Math.min(newX, imageDisplayArea.width - newWidth));
    newY = Math.max(0, Math.min(newY, imageDisplayArea.height - newHeight));

    if (newX + newWidth > imageDisplayArea.width) {
      newWidth = imageDisplayArea.width - newX;
    }
    if (newY + newHeight > imageDisplayArea.height) {
      newHeight = imageDisplayArea.height - newY;
    }

    setCropSelection({ x: newX, y: newY, width: newWidth, height: newHeight });
  };

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection('');
  }, []);

  // Add global event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove);
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Handle crop execution
  const executeCrop = useCallback(() => {
    if (!originalImage || !canvasRef.current) return;

    // Removed unused canvas variable
    const scale = originalImage.width / imageDisplayArea.width;

    // Create output canvas
    const outputCanvas = document.createElement('canvas');
    
    // Use custom dimensions if provided, otherwise use scaled crop dimensions
    if (customWidth && customHeight && !isNaN(parseFloat(customWidth)) && !isNaN(parseFloat(customHeight))) {
      outputCanvas.width = parseFloat(customWidth);
      outputCanvas.height = parseFloat(customHeight);
    } else {
      outputCanvas.width = cropSelection.width * scale;
      outputCanvas.height = cropSelection.height * scale;
    }

    const ctx = outputCanvas.getContext('2d');
    ctx.drawImage(
      originalImage,
      cropSelection.x * scale, // source x
      cropSelection.y * scale, // source y
      cropSelection.width * scale, // source width
      cropSelection.height * scale, // source height
      0, 0, // destination x, y
      outputCanvas.width, // destination width
      outputCanvas.height // destination height
    );

    onCrop(outputCanvas);
  }, [originalImage, imageDisplayArea.width, cropSelection, customWidth, customHeight, onCrop]);

  useEffect(() => {
    if (onCrop) {
      executeCrop();
    }
  }, [cropSelection, customWidth, customHeight, executeCrop, onCrop]);

  return (
    <div className="crop-interface">
      <div className="crop-canvas-container bg-gray-100 p-4 rounded-lg relative inline-block">
        <canvas
          ref={canvasRef}
          className="block"
        />
        <div 
          ref={overlayRef}
          className="absolute pointer-events-none"
          style={{
            left: '16px', // Account for padding
            top: '16px',
            width: `${imageDisplayArea.width}px`,
            height: `${imageDisplayArea.height}px`
          }}
        >
          <div
            className="absolute border-2 border-dashed border-[#FF3008] bg-black bg-opacity-25 cursor-move"
            style={{
              left: `${cropSelection.x}px`,
              top: `${cropSelection.y}px`,
              width: `${cropSelection.width}px`,
              height: `${cropSelection.height}px`,
              pointerEvents: 'auto'
            }}
            onMouseDown={(e) => {
              // Only handle drag if not clicking on a handle
              if (!e.target.classList.contains('resize-handle')) {
                startDrag(e);
              }
            }}
            onTouchStart={(e) => {
              if (!e.target.classList.contains('resize-handle')) {
                startDrag(e);
              }
            }}
          >
            {/* Corner handles */}
            <div 
              className="resize-handle absolute w-4 h-4 bg-[#FF3008] border-2 border-white -top-2 -left-2 cursor-nw-resize z-10"
              data-direction="nw"
              onMouseDown={(e) => {
                e.stopPropagation();
                startResize(e);
              }}
            />
            <div 
              className="resize-handle absolute w-4 h-4 bg-[#FF3008] border-2 border-white -top-2 -right-2 cursor-ne-resize z-10"
              data-direction="ne"
              onMouseDown={(e) => {
                e.stopPropagation();
                startResize(e);
              }}
            />
            <div 
              className="resize-handle absolute w-4 h-4 bg-[#FF3008] border-2 border-white -bottom-2 -left-2 cursor-sw-resize z-10"
              data-direction="sw"
              onMouseDown={(e) => {
                e.stopPropagation();
                startResize(e);
              }}
            />
            <div 
              className="resize-handle absolute w-4 h-4 bg-[#FF3008] border-2 border-white -bottom-2 -right-2 cursor-se-resize z-10"
              data-direction="se"
              onMouseDown={(e) => {
                e.stopPropagation();
                startResize(e);
              }}
            />
            
            {/* Edge handles */}
            <div 
              className="resize-handle absolute w-4 h-2 bg-[#FF3008] border-2 border-white -top-1 left-1/2 transform -translate-x-1/2 cursor-n-resize z-10"
              data-direction="n"
              onMouseDown={(e) => {
                e.stopPropagation();
                startResize(e);
              }}
            />
            <div 
              className="resize-handle absolute w-2 h-4 bg-[#FF3008] border-2 border-white -right-1 top-1/2 transform -translate-y-1/2 cursor-e-resize z-10"
              data-direction="e"
              onMouseDown={(e) => {
                e.stopPropagation();
                startResize(e);
              }}
            />
            <div 
              className="resize-handle absolute w-4 h-2 bg-[#FF3008] border-2 border-white -bottom-1 left-1/2 transform -translate-x-1/2 cursor-s-resize z-10"
              data-direction="s"
              onMouseDown={(e) => {
                e.stopPropagation();
                startResize(e);
              }}
            />
            <div 
              className="resize-handle absolute w-2 h-4 bg-[#FF3008] border-2 border-white -left-1 top-1/2 transform -translate-y-1/2 cursor-w-resize z-10"
              data-direction="w"
              onMouseDown={(e) => {
                e.stopPropagation();
                startResize(e);
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Output dimensions display */}
      <div className="mt-4 text-center">
        <div className="text-sm text-[#7C838C]">
          Output size: {
            customWidth && customHeight && !isNaN(parseFloat(customWidth)) && !isNaN(parseFloat(customHeight))
              ? `${customWidth} × ${customHeight} px (custom)`
              : `${Math.round(cropSelection.width * (originalImage?.width / imageDisplayArea.width))} × ${Math.round(cropSelection.height * (originalImage?.width / imageDisplayArea.width))} px`
          }
        </div>
        {customWidth && customHeight && !isNaN(parseFloat(customWidth)) && !isNaN(parseFloat(customHeight)) && (
          <div className="text-xs text-[#FF3008] mt-1">
            Crop area automatically sized for custom dimensions
          </div>
        )}
      </div>
    </div>
  );
};

export default CropInterface; 