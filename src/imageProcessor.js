// Image Processing Utilities for React
// Extracted and adapted from the original script.js

export class ImageProcessor {
  constructor() {
    this.originalFile = null;
    this.originalImage = null;
    this.croppedImage = null; // Can be Image or Canvas
    this.processedBlob = null;
    this.processedBlobs = null; // For quadrilateral mask
    this.cropSelection = { x: 0, y: 0, width: 0, height: 0 };
    this.currentProcessedCanvas = null;
    this.wedgeOptions = { position: 'top', color: 'red' };
    this.roundedOptions = { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 };
  }

  // Set wedge filter options
  setWedgeOptions(position, color) {
    this.wedgeOptions = { position, color };
  }

  // Set rounded corners options
  setRoundedOptions(corners) {
    this.roundedOptions = corners;
  }

  // Load image from file
  async loadImageFromFile(file) {
    this.originalFile = file;
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        img.onload = () => {
          this.originalImage = img;
          resolve(img);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  // Load image from URL (for hosted images)
  async loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }

  // Apply filter based on selection
  async applyFilter(filterType) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const sourceImage = this.croppedImage || this.originalImage;
    
    // Handle canvas input (from crop)
    if (sourceImage instanceof HTMLCanvasElement) {
      canvas.width = sourceImage.width;
      canvas.height = sourceImage.height;
      ctx.drawImage(sourceImage, 0, 0);
    } else {
      // Handle image input
      canvas.width = sourceImage.width;
      canvas.height = sourceImage.height;
      ctx.drawImage(sourceImage, 0, 0);
    }
    
    if (filterType === 'triangular-mask') {
      this.applyTriangularMask(ctx, canvas.width, canvas.height);
    } else if (filterType === 'rounded-rectangle') {
      this.applyRoundedRectangleMask(ctx, canvas.width, canvas.height);
    } else if (filterType === 'rounded-corners') {
      this.applyRoundedCorners(ctx, canvas.width, canvas.height, this.roundedOptions);
    } else if (filterType === 'wedge') {
      // Get wedge options from global state or defaults
      const position = this.wedgeOptions?.position || 'top';
      const color = this.wedgeOptions?.color || 'red';
      await this.applyWedgeFilter(ctx, canvas.width, canvas.height, position, color);
    }
    
    this.currentProcessedCanvas = canvas;
    return canvas;
  }

  // Apply quadrilateral mask filter
  applyTriangularMask(ctx, width, height) {
    // Calculate triangle width proportionally: 76px on 700px wide image
    const triangleWidth = (width * 76) / 700;
    
    // Create a composite operation to "cut out" the triangular areas
    ctx.globalCompositeOperation = 'destination-out';
    
    // Draw the top triangle
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(0, triangleWidth);
    ctx.closePath();
    ctx.fill();
    
    // Draw the bottom triangle
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height - triangleWidth);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  }

  // Apply rounded rectangle mask
  applyRoundedRectangleMask(ctx, width, height) {
    const radius = width / 2;
    
    ctx.globalCompositeOperation = 'destination-in';
    
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.lineTo(width, radius);
    ctx.arc(radius, radius, radius, 0, Math.PI, true);
    ctx.lineTo(0, radius);
    ctx.closePath();
    ctx.fill();
    
    ctx.globalCompositeOperation = 'source-over';
  }

  // Apply rounded corners with individual corner control
  applyRoundedCorners(ctx, width, height, options = {}) {
    // Get individual corner radii as percentages of the smaller dimension
    const minDimension = Math.min(width, height);
    const topLeftRadius = (options.topLeft || 0) / 100 * minDimension;
    const topRightRadius = (options.topRight || 0) / 100 * minDimension;
    const bottomRightRadius = (options.bottomRight || 0) / 100 * minDimension;
    const bottomLeftRadius = (options.bottomLeft || 0) / 100 * minDimension;
    
    // Use destination-in to clip to the rounded rectangle shape
    ctx.globalCompositeOperation = 'destination-in';
    
    // Draw rounded rectangle with individual corner radii
    ctx.beginPath();
    
    // Start at top-left corner (after radius)
    ctx.moveTo(topLeftRadius, 0);
    
    // Top edge and top-right corner
    ctx.lineTo(width - topRightRadius, 0);
    if (topRightRadius > 0) {
      ctx.quadraticCurveTo(width, 0, width, topRightRadius);
    }
    
    // Right edge and bottom-right corner
    ctx.lineTo(width, height - bottomRightRadius);
    if (bottomRightRadius > 0) {
      ctx.quadraticCurveTo(width, height, width - bottomRightRadius, height);
    }
    
    // Bottom edge and bottom-left corner
    ctx.lineTo(bottomLeftRadius, height);
    if (bottomLeftRadius > 0) {
      ctx.quadraticCurveTo(0, height, 0, height - bottomLeftRadius);
    }
    
    // Left edge and top-left corner
    ctx.lineTo(0, topLeftRadius);
    if (topLeftRadius > 0) {
      ctx.quadraticCurveTo(0, 0, topLeftRadius, 0);
    }
    
    ctx.closePath();
    ctx.fill();
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  }

  // Apply wedge filter - creates a slant overlay using SVG patterns
  async applyWedgeFilter(ctx, width, height, position = 'top', color = 'red') {
    // Set fixed canvas dimensions based on original implementation
    const canvasWidth = 1400;
    const canvasHeight = 408;
    
    // Resize canvas to match original dimensions
    ctx.canvas.width = canvasWidth;
    ctx.canvas.height = canvasHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // Create and draw the SVG overlay
    const overlayImg = await this.createWedgeSVGOverlay(position, color);
    
    // Draw the overlay
    ctx.drawImage(overlayImg, 0, 0, canvasWidth, canvasHeight);
    
    // Draw centered uploaded image at 400px wide (matching original)
    const desiredWidth = 400;
    const aspect = this.originalImage.width / this.originalImage.height;
    const imgWidth = desiredWidth;
    const imgHeight = imgWidth / aspect;
    const imgX = (canvasWidth - imgWidth) / 2;
    const imgY = (canvasHeight - imgHeight) / 2;
    
    ctx.drawImage(this.originalImage, imgX, imgY, imgWidth, imgHeight);
  }
  
  // Create SVG overlay based on position and color
  async createWedgeSVGOverlay(position, color) {
    // Get color hex code
    const colorHex = color === 'red' ? '#FF3008' : '#4C0C3A';
    
    // Create SVG based on position
    let svgContent;
    if (position === 'top') {
      // Top wedge - diagonal slant from top-left
      svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="408" viewBox="0 0 1400 408" fill="none">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M1400 130.7464L0 277.892V0H1400V130.7464Z" fill="${colorHex}"/>
        </svg>
      `;
    } else {
      // Bottom wedge - diagonal slant from bottom-right
      svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="408" viewBox="0 0 1400 408" fill="none">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M0 277.1536L1400 130.108V408H0V277.1536Z" fill="${colorHex}"/>
        </svg>
      `;
    }
    
    // Convert SVG to image
    return this.svgToImage(svgContent);
  }
  
  // Convert SVG string to Image
  async svgToImage(svgContent) {
    return new Promise((resolve, reject) => {
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url); // Clean up
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url); // Clean up
        reject(new Error('Failed to load SVG'));
      };
      img.src = url;
    });
  }
  
  // Load image helper method for SVG processing
  loadImageFromSrc(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Important for drawing from hosted URLs
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  }
  


  // Optimize image with size capping to ensure processed file is never larger than original
  async optimizeImage(canvas, quality = 0.6, maxWidth = 1400, filterType = 'none') {
    // Resize if needed
    let finalCanvas = canvas;
    if (canvas.width > maxWidth) {
      finalCanvas = this.resizeCanvas(canvas, maxWidth);
    }

    // Get baseline blob for size comparison
    const baselineBlob = await new Promise((resolve) => {
      const filtersRequiringTransparency = ['triangular-mask', 'rounded-corners', 'rounded-rectangle', 'wedge'].includes(filterType);
      const originalWasPNG = this.originalFile?.type === 'image/png';
      const needsTransparency = filtersRequiringTransparency || originalWasPNG;
      
      const format = needsTransparency ? 'image/png' : 'image/jpeg';
      const baselineQuality = needsTransparency ? 1.0 : 0.9; // High quality baseline
      
      finalCanvas.toBlob(resolve, format, baselineQuality);
    });

    // Apply compression
    const compressedBlob = await this.optimizeWithBrowserCompression(finalCanvas, quality, filterType);

    // Safety check: never return a larger file than baseline
    if (compressedBlob.size > baselineBlob.size) {
      return baselineBlob;
    }

    return compressedBlob;
  }



  // Hybrid compression: Professional PNG + Browser JPEG
  async optimizeWithBrowserCompression(canvas, quality, filterType) {
    // Determine optimal format based on original file and filters
    const filtersRequiringTransparency = ['triangular-mask', 'rounded-corners', 'rounded-rectangle', 'wedge'].includes(filterType);
    const originalWasPNG = this.originalFile?.type === 'image/png';
    const needsTransparency = filtersRequiringTransparency || originalWasPNG;
    
    if (needsTransparency) {
      // Use professional PNG compression for email-friendly file sizes
      return this.optimizeWithProfessionalPNG(canvas, quality);
    } else {
      // JPEG format with browser quality control (already excellent)
      const jpegQuality = Math.max(0.1, quality);
      return new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', jpegQuality);
      });
    }
  }

  // Professional PNG compression using pngquant for email-friendly sizes
  async optimizeWithProfessionalPNG(canvas, quality) {
    try {
      // Dynamically import @jsquash/png to avoid loading unless needed
      const { encode } = await import('@jsquash/png');
      
      // Convert canvas to ImageData
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Apply aggressive quantization for email-friendly PNG compression
      const optimizedImageData = this.applyAggressivePNGQuantization(imageData, quality);
      
      // Use professional PNG encoding
      const pngBuffer = await encode(optimizedImageData);
      
      return new Blob([pngBuffer], { type: 'image/png' });
      
    } catch (error) {
      // Fallback to browser PNG
      return new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/png');
      });
    }
  }

  // Aggressive PNG quantization for email-friendly file sizes
  applyAggressivePNGQuantization(imageData, quality) {
    if (quality >= 0.95) {
      // Very high quality - minimal optimization
      return imageData;
    }
    
    const data = new Uint8ClampedArray(imageData.data);
    
    // Much more aggressive quantization for better compression
    const step = Math.max(4, Math.round((1 - quality) * 32)); // 4-32 step range
    
    // Apply aggressive quantization to RGB channels while preserving alpha
    for (let i = 0; i < data.length; i += 4) {
      // Quantize all pixels (even semi-transparent ones for better compression)
      data[i] = Math.round(data[i] / step) * step;       // Red
      data[i + 1] = Math.round(data[i + 1] / step) * step; // Green
      data[i + 2] = Math.round(data[i + 2] / step) * step; // Blue
      // Alpha channel (i + 3) is preserved exactly
    }
    
    return new ImageData(data, imageData.width, imageData.height);
  }













  // Resize canvas maintaining aspect ratio
  resizeCanvas(canvas, maxWidth) {
    const aspectRatio = canvas.height / canvas.width;
    const newWidth = maxWidth;
    const newHeight = newWidth * aspectRatio;
    
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = newWidth;
    resizedCanvas.height = newHeight;
    
    const ctx = resizedCanvas.getContext('2d');
    ctx.drawImage(canvas, 0, 0, newWidth, newHeight);
    
    return resizedCanvas;
  }

  // Process quadrilateral mask for split download
  async processTriangularMaskSplit(quality = 0.6) {
    if (!this.currentProcessedCanvas) {
      throw new Error('No processed canvas available');
    }

    const canvas = this.currentProcessedCanvas;
    const topCanvas = document.createElement('canvas');
    const bottomCanvas = document.createElement('canvas');
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Calculate split point (halfway down the image)
    const splitY = height / 2;
    
    // Create top half
    topCanvas.width = width;
    topCanvas.height = splitY;
    const topCtx = topCanvas.getContext('2d');
    topCtx.drawImage(canvas, 0, 0, width, splitY, 0, 0, width, splitY);
    
    // Create bottom half
    bottomCanvas.width = width;
    bottomCanvas.height = height - splitY;
    const bottomCtx = bottomCanvas.getContext('2d');
    bottomCtx.drawImage(canvas, 0, splitY, width, height - splitY, 0, 0, width, height - splitY);
    
    // Convert to blobs
    const [topBlob, bottomBlob] = await Promise.all([
      new Promise(resolve => topCanvas.toBlob(resolve, 'image/png')),
      new Promise(resolve => bottomCanvas.toBlob(resolve, 'image/png'))
    ]);
    
    this.processedBlobs = { top: topBlob, bottom: bottomBlob };
    return { top: topBlob, bottom: bottomBlob };
  }

  // Get file size info with improved messaging for increases
  getFileSizeInfo(blob) {
    const size = (blob.size / 1024).toFixed(1);
    const originalSize = this.originalFile ? (this.originalFile.size / 1024).toFixed(1) : 0;
    const format = blob.type === 'image/jpeg' ? 'JPEG' : 'PNG';
    
    let sizeChangeText = 'No comparison';
    if (this.originalFile) {
      const sizeDiff = ((blob.size - this.originalFile.size) / this.originalFile.size) * 100;
      const absChange = Math.abs(sizeDiff).toFixed(1);
      
      if (sizeDiff > 5) {
        // File size increased significantly (>5%)
        sizeChangeText = `+${absChange}% larger`;
      } else if (sizeDiff < -5) {
        // File size decreased significantly (>5%)
        sizeChangeText = `${absChange}% smaller`;
      } else {
        // Small change (<5%)
        sizeChangeText = '~Same size';
      }
    }
    
    return {
      size: `${size} KB`,
      originalSize: `${originalSize} KB`,
      savings: sizeChangeText,
      format,
      isIncrease: this.originalFile ? blob.size > this.originalFile.size : false
    };
  }

  // Get base filename without extension from original file
  getBaseFilename() {
    if (!this.originalFile || !this.originalFile.name) {
      return 'processed-image';
    }
    
    // Remove file extension from original filename
    const originalName = this.originalFile.name;
    const lastDotIndex = originalName.lastIndexOf('.');
    if (lastDotIndex > 0) {
      return originalName.substring(0, lastDotIndex);
    }
    return originalName;
  }

  // Download blob as file with preserved original filename
  downloadBlob(blob, suffix = '-slimage-processed') {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const baseFilename = this.getBaseFilename();
    const extension = blob.type === 'image/jpeg' ? 'jpg' : 'png';
    
    // Get dimensions from current processed canvas if available
    let dimensions = '';
    if (this.currentProcessedCanvas) {
      const width = this.currentProcessedCanvas.width;
      const height = this.currentProcessedCanvas.height;
      dimensions = `-${width}x${height}`;
    }
    
    a.href = url;
    a.download = `${baseFilename}${suffix}${dimensions}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const imageProcessor = new ImageProcessor(); 