class ImageOptimizer {
    constructor() {
        this.originalFile = null;
        this.originalImage = null;
        this.croppedImage = null;
        this.selectedFilter = 'none';
        this.processedBlob = null;
        this.processedBlobs = null; // For triangular mask
        this.cropSelection = { x: 0, y: 0, width: 0, height: 0 };
        this.isDragging = false;
        this.isResizing = false;
        this.resizeDirection = '';
        this.dragStart = { x: 0, y: 0 };
        this.resizeStart = { x: 0, y: 0, cropX: 0, cropY: 0, cropWidth: 0, cropHeight: 0 };
        this.lastMoveTime = 0;
        this.imageDisplayArea = { x: 0, y: 0, width: 0, height: 0 }; // Actual image area within container
        this.currentProcessedCanvas = null; // Store current canvas for quality preview
        this.previewTimeout = null; // Debounce quality preview updates
        this.init();
    }

    init() {
        const imageInput = document.getElementById('imageInput');
        const downloadBtn = document.getElementById('downloadBtn');
        const downloadTopBtn = document.getElementById('downloadTopBtn');
        const downloadBottomBtn = document.getElementById('downloadBottomBtn');
        const resetBtn = document.getElementById('resetBtn');
        const applyFilterBtn = document.getElementById('applyFilterBtn');
        const filterOptions = document.querySelectorAll('.filter-option');
        const dropZone = document.getElementById('dropZone');
        const applyCropBtn = document.getElementById('applyCropBtn');
        const aspectRatio = document.getElementById('aspectRatio');
        const cropWidth = document.getElementById('cropWidth');
        const cropHeight = document.getElementById('cropHeight');

        imageInput.addEventListener('change', (e) => this.handleFileSelect(e));
        downloadBtn.addEventListener('click', () => this.downloadProcessed());
        downloadTopBtn.addEventListener('click', () => this.downloadTop());
        downloadBottomBtn.addEventListener('click', () => this.downloadBottom());
        resetBtn.addEventListener('click', () => this.resetApp());
        applyFilterBtn.addEventListener('click', () => this.applyFilterAndOptimize());
        applyCropBtn.addEventListener('click', () => this.applyCrop());
        const cancelCropBtn = document.getElementById('cancelCropBtn');
        cancelCropBtn.addEventListener('click', () => this.cancelCrop());

        filterOptions.forEach(option => {
            option.addEventListener('click', () => this.selectFilter(option));
        });

        // Crop controls
        aspectRatio.addEventListener('change', () => this.handleAspectRatioChange());
        cropWidth.addEventListener('input', () => this.handleCustomDimensions());
        cropHeight.addEventListener('input', () => this.handleCustomDimensions());

        // Quality controls
        const qualitySlider = document.getElementById('qualitySlider');
        const qualityPresets = document.querySelectorAll('.quality-preset');
        
        qualitySlider.addEventListener('input', () => {
            this.updateQualityDisplay();
            this.previewQualityChange();
        });
        qualityPresets.forEach(preset => {
            preset.addEventListener('click', (e) => {
                this.setQualityPreset(e.target.dataset.quality);
                this.previewQualityChange();
            });
        });

        // Drag and drop functionality
        this.setupDragAndDrop(dropZone, imageInput);
        
        // Window resize listener to keep crop overlay aligned
        window.addEventListener('resize', () => {
            if (document.getElementById('cropSection').style.display !== 'none') {
                this.updateOverlayPosition();
            }
        });
        
        // Initialize quality UI
        this.updateQualityUI('image/jpeg');
        this.updateQualityDisplay();
    }

    setupDragAndDrop(dropZone, imageInput) {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight drop zone when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => this.highlight(dropZone), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => this.unhighlight(dropZone), false);
        });

        // Handle dropped files
        dropZone.addEventListener('drop', (e) => this.handleDrop(e), false);

        // Handle click to upload - but only if not clicking on the upload button itself
        dropZone.addEventListener('click', (e) => {
            // Don't trigger if clicking on the upload button (it has its own label trigger)
            if (!e.target.closest('.upload-btn')) {
                imageInput.click();
            }
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight(dropZone) {
        dropZone.classList.add('drag-over');
    }

    unhighlight(dropZone) {
        dropZone.classList.remove('drag-over');
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            this.handleFile(files[0]);
        }
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        this.originalFile = file;
        this.loadOriginalImage(file);
    }

    loadOriginalImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.displayOriginalImage(file, e.target.result);
                this.showFilterSection();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    showCropSection() {
        const cropSection = document.getElementById('cropSection');
        const cropCanvas = document.getElementById('cropCanvas');
        const cropSelection = document.getElementById('cropSelection');
        const cropOverlay = document.getElementById('cropOverlay');
        
        cropSection.style.display = 'block';
        
        // Set up crop canvas
        const ctx = cropCanvas.getContext('2d');
        const maxWidth = 600;
        const maxHeight = 400;
        
        let { width, height } = this.originalImage;
        
        // Scale image to fit in crop canvas
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
        }
        
        // Set canvas size to exact image dimensions
        cropCanvas.width = width;
        cropCanvas.height = height;
        cropCanvas.style.width = width + 'px';
        cropCanvas.style.height = height + 'px';
        
        // Store the actual image display area
        this.imageDisplayArea = {
            x: 0,
            y: 0,
            width: width,
            height: height
        };
        
        // Draw image on canvas (fills entire canvas)
        ctx.drawImage(this.originalImage, 0, 0, width, height);
        
        // Position overlay to match canvas exactly
        this.updateOverlayPosition();
        
        // Initialize crop selection (default to 80% of image, centered)
        const margin = 0.1;
        this.cropSelection = {
            x: width * margin,
            y: height * margin,
            width: width * (1 - 2 * margin),
            height: height * (1 - 2 * margin)
        };
        
        this.updateCropSelection();
        this.setupCropEvents();
        
        // Update overlay position after layout settles
        setTimeout(() => this.updateOverlayPosition(), 50);
    }

    updateOverlayPosition() {
        const cropCanvas = document.getElementById('cropCanvas');
        const cropOverlay = document.getElementById('cropOverlay');
        const container = cropCanvas.parentElement;
        
        // Get canvas position within container
        const containerRect = container.getBoundingClientRect();
        const canvasRect = cropCanvas.getBoundingClientRect();
        
        // Position overlay to match canvas exactly
        const offsetX = canvasRect.left - containerRect.left;
        const offsetY = canvasRect.top - containerRect.top;
        
        cropOverlay.style.left = offsetX + 'px';
        cropOverlay.style.top = offsetY + 'px';
        cropOverlay.style.width = cropCanvas.width + 'px';
        cropOverlay.style.height = cropCanvas.height + 'px';
    }

    setupCropEvents() {
        const cropSelection = document.getElementById('cropSelection');
        const cropCanvas = document.getElementById('cropCanvas');
        const cropOverlay = document.getElementById('cropOverlay');
        
        // Remove any existing event listeners to prevent duplicates
        this.cleanupCropEvents();
        
        // Use bound methods to maintain proper 'this' context
        this.boundStartCropDrag = this.startCropDrag.bind(this);
        this.boundUpdateCropDrag = this.updateCropDrag.bind(this);
        this.boundEndCropDrag = this.endCropDrag.bind(this);
        this.boundStartResize = this.startResize.bind(this);
        this.boundUpdateResize = this.updateResize.bind(this);
        this.boundEndResize = this.endResize.bind(this);
        
        // Mouse events for crop selection - dragging
        cropSelection.addEventListener('mousedown', this.boundStartCropDrag, { passive: false });
        document.addEventListener('mousemove', this.boundUpdateCropDrag, { passive: false });
        document.addEventListener('mouseup', this.boundEndCropDrag);
        
        // Mouse events for resize handles
        const resizeHandles = cropSelection.querySelectorAll('.resize-handle');
        resizeHandles.forEach(handle => {
            handle.addEventListener('mousedown', this.boundStartResize, { passive: false });
        });
        document.addEventListener('mousemove', this.boundUpdateResize, { passive: false });
        document.addEventListener('mouseup', this.boundEndResize);
        
        // Touch events for mobile support
        cropSelection.addEventListener('touchstart', this.boundStartCropDrag, { passive: false });
        document.addEventListener('touchmove', this.boundUpdateCropDrag, { passive: false });
        document.addEventListener('touchend', this.boundEndCropDrag);
        
        resizeHandles.forEach(handle => {
            handle.addEventListener('touchstart', this.boundStartResize, { passive: false });
        });
        document.addEventListener('touchmove', this.boundUpdateResize, { passive: false });
        document.addEventListener('touchend', this.boundEndResize);
    }

    cleanupCropEvents() {
        if (this.boundStartCropDrag) {
            document.removeEventListener('mousemove', this.boundUpdateCropDrag);
            document.removeEventListener('mouseup', this.boundEndCropDrag);
            document.removeEventListener('touchmove', this.boundUpdateCropDrag);
            document.removeEventListener('touchend', this.boundEndCropDrag);
        }
        if (this.boundStartResize) {
            document.removeEventListener('mousemove', this.boundUpdateResize);
            document.removeEventListener('mouseup', this.boundEndResize);
            document.removeEventListener('touchmove', this.boundUpdateResize);
            document.removeEventListener('touchend', this.boundEndResize);
        }
    }

    startCropDrag(e) {
        // Don't start drag if clicking on a resize handle
        if (e.target.classList.contains('resize-handle')) {
            return;
        }
        
        this.isDragging = true;
        
        // Get the canvas container for accurate positioning
        const cropCanvas = document.getElementById('cropCanvas');
        const canvasContainer = cropCanvas.parentElement;
        const rect = canvasContainer.getBoundingClientRect();
        
        // Calculate canvas position within container
        const canvasRect = cropCanvas.getBoundingClientRect();
        const canvasOffsetX = canvasRect.left - rect.left;
        const canvasOffsetY = canvasRect.top - rect.top;
        
        // Get client coordinates (handle both mouse and touch)
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        // Calculate drag offset relative to canvas
        this.dragStart = {
            x: clientX - canvasRect.left - this.cropSelection.x,
            y: clientY - canvasRect.top - this.cropSelection.y
        };
        
        // Add visual feedback
        const cropSelection = document.getElementById('cropSelection');
        cropSelection.style.cursor = 'grabbing';
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        
        e.preventDefault();
        e.stopPropagation();
    }

    updateCropDrag(e) {
        if (!this.isDragging) return;
        
        // Throttle updates for better performance (60fps max)
        const now = Date.now();
        if (now - this.lastMoveTime < 16) return;
        this.lastMoveTime = now;
        
        const cropCanvas = document.getElementById('cropCanvas');
        const canvasRect = cropCanvas.getBoundingClientRect();
        
        // Get client coordinates (handle both mouse and touch)
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        // Calculate new position relative to canvas
        let newX = clientX - canvasRect.left - this.dragStart.x;
        let newY = clientY - canvasRect.top - this.dragStart.y;
        
        // Keep selection within image bounds (canvas = image in our case)
        const maxX = this.imageDisplayArea.width - this.cropSelection.width;
        const maxY = this.imageDisplayArea.height - this.cropSelection.height;
        
        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));
        
        // Only update if position actually changed
        if (newX !== this.cropSelection.x || newY !== this.cropSelection.y) {
            this.cropSelection.x = newX;
            this.cropSelection.y = newY;
            this.updateCropSelection();
        }
        
        e.preventDefault();
        e.stopPropagation();
    }

    endCropDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        
        // Reset visual feedback
        const cropSelection = document.getElementById('cropSelection');
        cropSelection.style.cursor = 'move';
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }

    updateCropSelection() {
        const cropSelection = document.getElementById('cropSelection');
        
        // Use transform for better performance (GPU accelerated)
        cropSelection.style.transform = `translate(${this.cropSelection.x}px, ${this.cropSelection.y}px)`;
        cropSelection.style.width = this.cropSelection.width + 'px';
        cropSelection.style.height = this.cropSelection.height + 'px';
    }

    // Resize functionality
    startResize(e) {
        this.isResizing = true;
        this.resizeDirection = e.target.dataset.direction;
        
        const cropCanvas = document.getElementById('cropCanvas');
        const canvasRect = cropCanvas.getBoundingClientRect();
        
        // Get client coordinates (handle both mouse and touch)
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        // Store initial state
        this.resizeStart = {
            x: clientX,
            y: clientY,
            cropX: this.cropSelection.x,
            cropY: this.cropSelection.y,
            cropWidth: this.cropSelection.width,
            cropHeight: this.cropSelection.height
        };
        
        // Add visual feedback
        document.body.style.userSelect = 'none';
        document.body.style.cursor = e.target.style.cursor;
        
        e.preventDefault();
        e.stopPropagation();
    }

    updateResize(e) {
        if (!this.isResizing) return;
        
        // Throttle updates for better performance
        const now = Date.now();
        if (now - this.lastMoveTime < 16) return;
        this.lastMoveTime = now;
        
        const cropCanvas = document.getElementById('cropCanvas');
        const canvasRect = cropCanvas.getBoundingClientRect();
        
        // Get client coordinates
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        // Calculate movement delta
        const deltaX = clientX - this.resizeStart.x;
        const deltaY = clientY - this.resizeStart.y;
        
        // New crop values
        let newX = this.resizeStart.cropX;
        let newY = this.resizeStart.cropY;
        let newWidth = this.resizeStart.cropWidth;
        let newHeight = this.resizeStart.cropHeight;
        
        // Apply resize based on direction
        const direction = this.resizeDirection;
        
        // Handle horizontal resizing
        if (direction.includes('w')) {
            // Resize from left
            newX = this.resizeStart.cropX + deltaX;
            newWidth = this.resizeStart.cropWidth - deltaX;
        } else if (direction.includes('e')) {
            // Resize from right
            newWidth = this.resizeStart.cropWidth + deltaX;
        }
        
        // Handle vertical resizing
        if (direction.includes('n')) {
            // Resize from top
            newY = this.resizeStart.cropY + deltaY;
            newHeight = this.resizeStart.cropHeight - deltaY;
        } else if (direction.includes('s')) {
            // Resize from bottom
            newHeight = this.resizeStart.cropHeight + deltaY;
        }
        
        // Enforce minimum size
        const minSize = 20;
        if (newWidth < minSize) {
            if (direction.includes('w')) {
                newX = this.resizeStart.cropX + this.resizeStart.cropWidth - minSize;
            }
            newWidth = minSize;
        }
        if (newHeight < minSize) {
            if (direction.includes('n')) {
                newY = this.resizeStart.cropY + this.resizeStart.cropHeight - minSize;
            }
            newHeight = minSize;
        }
        
        // Enforce boundaries
        if (newX < 0) {
            newWidth += newX;
            newX = 0;
        }
        if (newY < 0) {
            newHeight += newY;
            newY = 0;
        }
        if (newX + newWidth > this.imageDisplayArea.width) {
            newWidth = this.imageDisplayArea.width - newX;
        }
        if (newY + newHeight > this.imageDisplayArea.height) {
            newHeight = this.imageDisplayArea.height - newY;
        }
        
        // Check for aspect ratio constraints
        const aspectRatio = document.getElementById('aspectRatio').value;
        if (aspectRatio !== 'free') {
            const [ratioW, ratioH] = aspectRatio.split(':').map(Number);
            const targetRatio = ratioW / ratioH;
            
            // For corner resizing, maintain aspect ratio
            if (['nw', 'ne', 'sw', 'se'].includes(direction)) {
                const currentRatio = newWidth / newHeight;
                if (currentRatio > targetRatio) {
                    newWidth = newHeight * targetRatio;
                } else {
                    newHeight = newWidth / targetRatio;
                }
                
                // Adjust position for left/top resizing
                if (direction.includes('w')) {
                    newX = this.resizeStart.cropX + this.resizeStart.cropWidth - newWidth;
                }
                if (direction.includes('n')) {
                    newY = this.resizeStart.cropY + this.resizeStart.cropHeight - newHeight;
                }
            }
        }
        
        // Update crop selection
        this.cropSelection.x = newX;
        this.cropSelection.y = newY;
        this.cropSelection.width = newWidth;
        this.cropSelection.height = newHeight;
        
        this.updateCropSelection();
        
        e.preventDefault();
        e.stopPropagation();
    }

    endResize() {
        if (!this.isResizing) return;
        
        this.isResizing = false;
        
        // Reset visual feedback
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }

    handleAspectRatioChange() {
        const aspectRatio = document.getElementById('aspectRatio').value;
        
        if (aspectRatio === 'free') return;
        
        const [ratioW, ratioH] = aspectRatio.split(':').map(Number);
        const targetRatio = ratioW / ratioH;
        
        let { width, height } = this.cropSelection;
        const currentRatio = width / height;
        
        if (currentRatio > targetRatio) {
            // Too wide, reduce width
            width = height * targetRatio;
        } else {
            // Too tall, reduce height
            height = width / targetRatio;
        }
        
        // Ensure it fits within image bounds
        const maxWidth = this.imageDisplayArea.width;
        const maxHeight = this.imageDisplayArea.height;
        
        if (this.cropSelection.x + width > maxWidth) {
            width = maxWidth - this.cropSelection.x;
            height = width / targetRatio;
        }
        if (this.cropSelection.y + height > maxHeight) {
            height = maxHeight - this.cropSelection.y;
            width = height * targetRatio;
        }
        
        this.cropSelection.width = width;
        this.cropSelection.height = height;
        this.updateCropSelection();
    }

    handleCustomDimensions() {
        const cropWidth = document.getElementById('cropWidth');
        const cropHeight = document.getElementById('cropHeight');
        
        if (cropWidth.value && cropHeight.value) {
            // Calculate scale factor from display to original image
            const scale = this.imageDisplayArea.width / this.originalImage.width;
            
            // Convert custom dimensions to display scale
            let width = Math.min(parseInt(cropWidth.value) * scale, this.imageDisplayArea.width);
            let height = Math.min(parseInt(cropHeight.value) * scale, this.imageDisplayArea.height);
            
            // Adjust position if needed to keep within bounds
            if (this.cropSelection.x + width > this.imageDisplayArea.width) {
                this.cropSelection.x = this.imageDisplayArea.width - width;
            }
            if (this.cropSelection.y + height > this.imageDisplayArea.height) {
                this.cropSelection.y = this.imageDisplayArea.height - height;
            }
            
            this.cropSelection.width = width;
            this.cropSelection.height = height;
            this.updateCropSelection();
        }
    }

    async applyCrop() {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('cropSection').style.display = 'none';
        
        // Create cropped image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate scale factor from display to original image
        const scale = this.originalImage.width / this.imageDisplayArea.width;
        
        // Set canvas size to actual crop dimensions in original image scale
        canvas.width = this.cropSelection.width * scale;
        canvas.height = this.cropSelection.height * scale;
        
        // Draw cropped portion from original image
        ctx.drawImage(
            this.originalImage,
            this.cropSelection.x * scale, // source x
            this.cropSelection.y * scale, // source y
            this.cropSelection.width * scale, // source width
            this.cropSelection.height * scale, // source height
            0, 0, // destination x, y
            canvas.width, canvas.height // destination width, height
        );
        
        // Process and display the cropped image with current quality settings
        await this.processAndDisplayImage(canvas, true);
    }

    cancelCrop() {
        document.getElementById('cropSection').style.display = 'none';
        document.getElementById('filterSection').style.display = 'block';
        
        // Reset filter selection
        this.selectedFilter = 'none';
        document.querySelectorAll('.filter-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector('[data-filter="none"]').classList.add('selected');
        document.getElementById('applyFilterBtn').textContent = 'Apply Filter & Optimize';
    }

    displayOriginalImage(file, src) {
        const originalImage = document.getElementById('originalImage');
        originalImage.src = src;
        
        const fileSizeKB = (file.size / 1024).toFixed(1);
        document.getElementById('originalSize').textContent = `Size: ${fileSizeKB} KB`;
    }

    showFilterSection() {
        document.getElementById('filterSection').style.display = 'block';
        // Reset filter selection
        this.selectedFilter = 'none';
        document.querySelectorAll('.filter-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector('[data-filter="none"]').classList.add('selected');
        document.getElementById('applyFilterBtn').disabled = false;
    }

    updateQualityDisplay() {
        const qualitySlider = document.getElementById('qualitySlider');
        const qualityValue = document.getElementById('qualityValue');
        const qualityPresets = document.querySelectorAll('.quality-preset');
        
        qualityValue.textContent = qualitySlider.value + '%';
        
        // Update preset buttons
        qualityPresets.forEach(preset => {
            if (parseInt(preset.dataset.quality) === parseInt(qualitySlider.value)) {
                preset.classList.add('active');
            } else {
                preset.classList.remove('active');
            }
        });
    }

    updateQualityUI(format) {
        const formatIndicator = document.getElementById('formatIndicator');
        const qualityNote = document.getElementById('qualityNote');
        const qualitySection = document.querySelector('.quality-section');
        const qualityLabel = document.querySelector('.quality-header label');
        
        if (format === 'image/png') {
            // PNG format - use consistent quality terminology
            formatIndicator.textContent = 'PNG';
            formatIndicator.className = 'format-indicator png';
            qualityNote.style.display = 'block';
            qualitySection.classList.remove('disabled');
            qualityLabel.textContent = 'Quality Level:'; // Consistent with JPEG
        } else {
            // JPEG format - quality applies
            formatIndicator.textContent = 'JPEG';
            formatIndicator.className = 'format-indicator jpeg';
            qualityNote.style.display = 'none';
            qualityLabel.textContent = 'Quality Level:'; // Same as PNG
        }
    }

    setQualityPreset(quality) {
        const qualitySlider = document.getElementById('qualitySlider');
        qualitySlider.value = quality;
        this.updateQualityDisplay();
    }

    async processAndDisplayImage(canvas, isInitialDisplay = false) {
        if (!canvas) return;

        try {
            // Store the canvas for future quality preview updates
            this.currentProcessedCanvas = canvas;

            // For initial display, show the unoptimized filtered image on the left
            if (isInitialDisplay) {
                // Create an unoptimized version for comparison
                const unoptimizedBlob = await new Promise(resolve => {
                    canvas.toBlob(resolve, 'image/png'); // Use PNG to preserve quality
                });
                
                // Set the original image to show the unoptimized version
                const originalImage = document.getElementById('originalImage');
                if (originalImage.src && originalImage.src.startsWith('blob:')) {
                    URL.revokeObjectURL(originalImage.src);
                }
                originalImage.src = URL.createObjectURL(unoptimizedBlob);
                
                // Update labels to reflect the comparison
                document.querySelector('.comparison-before .image-label').textContent = 'Original';
                document.querySelector('.comparison-after .image-label').textContent = 'Optimized';
            }

            // Optimize with current quality settings (unified quality processing)
            // This ensures both initial display and quality slider changes use the same optimization
            const optimizedBlob = await this.optimizeCanvas(canvas);
            
            // Update the processed image display
            await this.updateProcessedImageDisplay(optimizedBlob);
            
            // Store the blob for download (but don't replace processedBlobs for split images)
            if (!this.processedBlobs) {
                this.processedBlob = optimizedBlob;
            }
            
            // Handle UI updates for single images
            if (isInitialDisplay && !this.processedBlobs) {
                // Hide individual download section for single images
                document.getElementById('individualDownloads').style.display = 'none';
                
                // Reset button text
                document.getElementById('downloadBtn').textContent = 'Download Processed Image';
            }
            
            // If this is the initial display, show the preview section
            if (isInitialDisplay) {
                document.getElementById('previewSection').style.display = 'block';
                document.getElementById('loading').style.display = 'none';
            }
            
        } catch (error) {
            console.error('Error processing and displaying image:', error);
            if (isInitialDisplay) {
                document.getElementById('loading').style.display = 'none';
                alert('Error processing image. Please try again.');
            }
        }
    }

    async updateProcessedImageDisplay(blob) {
        const url = URL.createObjectURL(blob);
        const processedImage = document.getElementById('optimizedImage');

        if (processedImage.src && processedImage.src.startsWith('blob:')) {
            URL.revokeObjectURL(processedImage.src); // Clean up previous URL
        }

        processedImage.src = url;
        this.updateSizeDisplay(blob); // Update size info
    }

    previewQualityChange() {
        // Only preview if we have a processed canvas to work with
        if (!this.currentProcessedCanvas) {
            return;
        }

        // Debounce updates for smooth slider interaction
        if (this.previewTimeout) {
            clearTimeout(this.previewTimeout);
        }

        this.previewTimeout = setTimeout(() => {
            this.processAndDisplayImage(this.currentProcessedCanvas, false);
        }, 150); // 150ms debounce
    }

    async updateQualityPreview() {
        // This method is now just an alias for the unified processing
        if (this.currentProcessedCanvas) {
            await this.processAndDisplayImage(this.currentProcessedCanvas, false);
        }
    }

    updateSizeDisplay(blob) {
        const originalSizeKB = (this.originalFile.size / 1024).toFixed(1);
        const processedSizeKB = (blob.size / 1024).toFixed(1);
        const sizeDiff = blob.size - this.originalFile.size;
        const sizeChangePercent = ((sizeDiff / this.originalFile.size) * 100).toFixed(1);
        
        // Determine format from blob type
        const isJPEG = blob.type === 'image/jpeg';
        const isPNG = blob.type === 'image/png';
        const formatName = isJPEG ? 'JPEG' : (isPNG ? 'PNG' : 'Unknown');
        
        // Check if quality was auto-adjusted (file size never increases)
        const wasAutoAdjusted = sizeDiff <= 0 && blob.size < this.originalFile.size;
        
        // Update size displays
        document.getElementById('originalSize').textContent = `${originalSizeKB} KB`;
        
        // Update processed size with format information
        if (this.selectedFilter === 'none' || this.selectedFilter === 'custom-crop') {
            // For no filter or crop, show compression savings with format
            const savings = Math.abs(parseFloat(sizeChangePercent));
            let reason = isJPEG ? '• Auto-optimized as JPEG' : '• Auto-optimized as PNG';
            
            // Add note if quality was auto-adjusted to prevent size increase
            if (isJPEG && sizeDiff <= 0 && savings > 0) {
                reason += ' (size-capped)';
            }
            
            document.getElementById('optimizedSize').textContent = `${processedSizeKB} KB (${savings}% smaller) ${reason}`;
        } else {
            // For filters, show format explanation
            if (sizeDiff > 0) {
                const reason = isPNG ? '• PNG for transparency' : '• Auto-selected format';
                document.getElementById('optimizedSize').textContent = `${processedSizeKB} KB (+${sizeChangePercent}% ${reason})`;
            } else {
                let reason = isPNG ? '• PNG format' : `• ${formatName} format`;
                if (isJPEG && sizeDiff <= 0) {
                    reason += ' (size-capped)';
                }
                document.getElementById('optimizedSize').textContent = `${processedSizeKB} KB (${Math.abs(parseFloat(sizeChangePercent))}% smaller ${reason})`;
            }
        }
    }

    resetApp() {
        // Clear all stored data
        this.originalFile = null;
        this.originalImage = null;
        this.croppedImage = null;
        this.processedBlob = null;
        this.processedBlobs = null;
        this.selectedFilter = 'none';
        this.cropSelection = { x: 0, y: 0, width: 0, height: 0 };
        this.isDragging = false;
        this.isResizing = false;
        this.resizeDirection = '';
        this.imageDisplayArea = { x: 0, y: 0, width: 0, height: 0 };
        this.currentProcessedCanvas = null;
        
        // Clear any pending preview updates
        if (this.previewTimeout) {
            clearTimeout(this.previewTimeout);
            this.previewTimeout = null;
        }
        
        // Reset file input
        document.getElementById('imageInput').value = '';
        
        // Hide sections
        document.getElementById('filterSection').style.display = 'none';
        document.getElementById('cropSection').style.display = 'none';
        document.getElementById('previewSection').style.display = 'none';
        document.getElementById('loading').style.display = 'none';
        
        // Reset filter selection
        document.querySelectorAll('.filter-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Clear image sources to free memory
        document.getElementById('originalImage').src = '';
        document.getElementById('optimizedImage').src = '';
        
        // Reset image labels to default
        document.querySelector('.comparison-before .image-label').textContent = 'Original';
        document.querySelector('.comparison-after .image-label').textContent = 'Processed';
        
        // Hide individual download section
        document.getElementById('individualDownloads').style.display = 'none';
        
        // Reset button text
        document.getElementById('downloadBtn').textContent = 'Download Processed Image';
        
        // Clear size info
        document.getElementById('originalSize').textContent = '';
        document.getElementById('optimizedSize').textContent = '';
        
        // Reset apply filter button
        document.getElementById('applyFilterBtn').disabled = true;
        
        // Reset quality UI to JPEG format
        this.updateQualityUI('image/jpeg');
        this.updateQualityDisplay();
        
        // Clean up crop event listeners
        this.cleanupCropEvents();
    }

    async optimizeCanvas(canvas, half = null) {
        return new Promise(async (resolve) => {
            const maxWidth = 1400;
            const qualitySlider = document.getElementById('qualitySlider');
            let quality = parseInt(qualitySlider?.value || 60) / 100; // Convert percentage to decimal

            let { width, height } = canvas;

            // Create new canvas for optimization if resizing is needed
            if (width > maxWidth) {
                const newHeight = (height * maxWidth) / width;
                const newWidth = maxWidth;
                
                const optimizedCanvas = document.createElement('canvas');
                const ctx = optimizedCanvas.getContext('2d');
                
                optimizedCanvas.width = newWidth;
                optimizedCanvas.height = newHeight;
                
                ctx.drawImage(canvas, 0, 0, newWidth, newHeight);
                canvas = optimizedCanvas;
            }

            // Automatically determine optimal format
            const optimalFormat = this.determineOptimalFormat(canvas);
            
            // Update quality UI based on format
            this.updateQualityUI(optimalFormat);
            
            // For JPEG format, implement smart size capping
            if (optimalFormat === 'image/jpeg' && this.originalFile) {
                const optimizedBlob = await this.optimizeWithSizeCap(canvas, quality, optimalFormat);
                resolve(optimizedBlob);
            } else {
                // For PNG or when no original file reference, use standard optimization
                const qualityParam = optimalFormat === 'image/jpeg' ? quality : undefined;
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, optimalFormat, qualityParam);
            }
        });
    }

    async optimizePNG(canvas, quality) {
        // Quality from 0.1 (minimum quality) to 1.0 (maximum quality)
        // Higher quality = more colors = less compression
        // Invert the logic so 100% quality = maximum colors, 10% quality = minimum colors
        const minColors = 8;
        const maxColors = 256;
        const colorCount = Math.round(minColors + (maxColors - minColors) * quality);
        
        console.log(`PNG Quality: ${Math.round(quality * 100)}% → ${colorCount} colors max`);
        
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Apply color quantization using k-means-like algorithm
        const optimizedImageData = this.quantizeColors(imageData, colorCount);
        
        // Create new canvas with optimized data
        const optimizedCanvas = document.createElement('canvas');
        optimizedCanvas.width = canvas.width;
        optimizedCanvas.height = canvas.height;
        const optimizedCtx = optimizedCanvas.getContext('2d');
        optimizedCtx.putImageData(optimizedImageData, 0, 0);
        
        return optimizedCanvas;
    }

    quantizeColors(imageData, maxColors) {
        const { data, width, height } = imageData;
        const pixels = [];
        
        // Extract unique colors
        const colorMap = new Map();
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            const colorKey = `${r},${g},${b},${a}`;
            
            if (!colorMap.has(colorKey)) {
                colorMap.set(colorKey, { r, g, b, a, count: 0 });
            }
            colorMap.get(colorKey).count++;
        }
        
        let colors = Array.from(colorMap.values());
        
        console.log(`Original colors: ${colors.length}, Target: ${maxColors}`);
        
        // If we already have fewer colors than target, no need to quantize
        if (colors.length <= maxColors) {
            console.log('No quantization needed - already optimized');
            return imageData;
        }
        
        // More aggressive quantization for better visual effects
        colors.sort((a, b) => b.count - a.count);
        
        if (colors.length > maxColors) {
            // For lower color counts, use more clustering, less frequency-based selection
            const frequentColors = colors.slice(0, Math.floor(maxColors * 0.5));
            const remaining = colors.slice(Math.floor(maxColors * 0.5));
            
            // Add representative colors from clusters
            const clusters = this.simpleKMeans(remaining, maxColors - frequentColors.length);
            colors = frequentColors.concat(clusters).slice(0, maxColors);
        }
        
        console.log(`Final palette: ${colors.length} colors`);
        
        // Create new image data with quantized colors
        const newImageData = new ImageData(width, height);
        const newData = newImageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // Find closest color in palette
            const closest = this.findClosestColor({ r, g, b, a }, colors);
            
            newData[i] = closest.r;
            newData[i + 1] = closest.g;
            newData[i + 2] = closest.b;
            newData[i + 3] = closest.a;
        }
        
        return newImageData;
    }

    simpleKMeans(colors, k) {
        if (colors.length <= k) return colors;
        
        // Initialize centroids randomly
        const centroids = [];
        for (let i = 0; i < k; i++) {
            const randomIndex = Math.floor(Math.random() * colors.length);
            centroids.push({ ...colors[randomIndex] });
        }
        
        // Run a few iterations of k-means
        for (let iter = 0; iter < 5; iter++) {
            const clusters = Array(k).fill().map(() => []);
            
            // Assign colors to nearest centroid
            colors.forEach(color => {
                let minDist = Infinity;
                let assignedCluster = 0;
                
                centroids.forEach((centroid, index) => {
                    const dist = this.colorDistance(color, centroid);
                    if (dist < minDist) {
                        minDist = dist;
                        assignedCluster = index;
                    }
                });
                
                clusters[assignedCluster].push(color);
            });
            
            // Update centroids
            centroids.forEach((centroid, index) => {
                const cluster = clusters[index];
                if (cluster.length > 0) {
                    centroid.r = Math.round(cluster.reduce((sum, c) => sum + c.r, 0) / cluster.length);
                    centroid.g = Math.round(cluster.reduce((sum, c) => sum + c.g, 0) / cluster.length);
                    centroid.b = Math.round(cluster.reduce((sum, c) => sum + c.b, 0) / cluster.length);
                    centroid.a = Math.round(cluster.reduce((sum, c) => sum + c.a, 0) / cluster.length);
                }
            });
        }
        
        return centroids;
    }

    findClosestColor(targetColor, palette) {
        let minDistance = Infinity;
        let closestColor = palette[0];
        
        palette.forEach(color => {
            const distance = this.colorDistance(targetColor, color);
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = color;
            }
        });
        
        return closestColor;
    }

    colorDistance(color1, color2) {
        // Euclidean distance in RGBA space, with alpha weighting
        const dr = color1.r - color2.r;
        const dg = color1.g - color2.g;
        const db = color1.b - color2.b;
        const da = (color1.a - color2.a) * 0.5; // Alpha has less weight
        
        return Math.sqrt(dr * dr + dg * dg + db * db + da * da);
    }

    async optimizeWithSizeCap(canvas, initialQuality, format) {
        return new Promise((resolve) => {
            let quality = initialQuality;
            const originalSize = this.originalFile.size;
            
            const tryOptimization = (currentQuality) => {
                canvas.toBlob((blob) => {
                    if (blob.size <= originalSize || currentQuality <= 0.1) {
                        // Success: smaller than original or reached minimum quality
                        resolve(blob);
                    } else if (currentQuality > 0.1) {
                        // Too large: try with lower quality (reduce by 10%)
                        const newQuality = Math.max(0.1, currentQuality - 0.1);
                        tryOptimization(newQuality);
                    } else {
                        // Fallback: use minimum quality
                        resolve(blob);
                    }
                }, format, currentQuality);
            };
            
            tryOptimization(quality);
        });
    }

    determineOptimalFormat(canvas) {
        // Filters that create transparency must use PNG
        const needsTransparency = ['triangular-mask', 'rounded-rectangle', 'rounded-corners'].includes(this.selectedFilter);
        if (needsTransparency) {
            return 'image/png';
        }

        // Analyze image content to determine optimal format
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Sample analysis (check every 4th pixel for performance)
        const sampleRate = 4;
        const samples = [];
        const colors = new Set();
        let hasTransparency = false;
        let totalVariance = 0;
        let edgePixels = 0;
        
        for (let i = 0; i < data.length; i += 4 * sampleRate) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            
            // Check for transparency
            if (a < 255) {
                hasTransparency = true;
            }
            
            // Count unique colors (simplified)
            const colorKey = `${Math.floor(r/8)},${Math.floor(g/8)},${Math.floor(b/8)}`;
            colors.add(colorKey);
            
            samples.push({ r, g, b });
            
            // Calculate local variance for edge detection
            if (samples.length > 1) {
                const prev = samples[samples.length - 2];
                const variance = Math.abs(r - prev.r) + Math.abs(g - prev.g) + Math.abs(b - prev.b);
                totalVariance += variance;
                
                if (variance > 100) { // High contrast = sharp edge
                    edgePixels++;
                }
            }
        }
        
        // If transparency detected, must use PNG
        if (hasTransparency) {
            return 'image/png';
        }
        
        const totalSamples = samples.length;
        const uniqueColors = colors.size;
        const avgVariance = totalVariance / totalSamples;
        const edgeRatio = edgePixels / totalSamples;
        
        // Decision factors
        const colorComplexity = uniqueColors / totalSamples; // 0-1, higher = more complex
        const isHighContrast = edgeRatio > 0.1; // Many sharp edges
        const isLowColorCount = uniqueColors < 256; // Graphics-like
        const isHighVariance = avgVariance > 30; // Lots of gradients
        
        // Decision logic
        if (isLowColorCount && isHighContrast) {
            // Graphics, text, logos -> PNG
            return 'image/png';
        }
        
        if (colorComplexity > 0.3 && isHighVariance) {
            // Complex photographs with gradients -> JPEG
            return 'image/jpeg';
        }
        
        if (uniqueColors < 64) {
            // Very simple graphics -> PNG
            return 'image/png';
        }
        
        // Default to JPEG for most photos
        return 'image/jpeg';
    }

    displaySplitImages(topBlob, bottomBlob) {
        // Create object URLs for both images
        const topUrl = URL.createObjectURL(topBlob);
        const bottomUrl = URL.createObjectURL(bottomBlob);
        
        // Display the top image as "original" and bottom as "processed"
        const originalImage = document.getElementById('originalImage');
        const processedImage = document.getElementById('optimizedImage');
        originalImage.src = topUrl;
        processedImage.src = bottomUrl;

        // Update size information for split images
        const originalSizeKB = (this.originalFile.size / 1024).toFixed(1);
        const topSizeKB = (topBlob.size / 1024).toFixed(1);
        const bottomSizeKB = (bottomBlob.size / 1024).toFixed(1);
        const totalProcessedSizeKB = (topBlob.size + bottomBlob.size) / 1024;
        
        document.getElementById('originalSize').textContent = `${originalSizeKB} KB`;
        document.getElementById('optimizedSize').textContent = `${totalProcessedSizeKB.toFixed(1)} KB (Split: Top ${topSizeKB} KB, Bottom ${bottomSizeKB} KB)`;
        
        // Show individual download section for split images
        document.getElementById('individualDownloads').style.display = 'block';
        
        // Update main download button text
        document.getElementById('downloadBtn').textContent = 'Download Top Half';
    }

    async downloadProcessed() {
        if (this.processedBlobs) {
            // For split images, download the top half with dimensions
            const dimensions = await this.getBlobDimensions(this.processedBlobs.top);
            const dimensionSuffix = dimensions ? `-${dimensions}` : '';
            this.downloadBlob(this.processedBlobs.top, `${this.getBaseFilename()}-top-half${dimensionSuffix}.png`);
        } else if (this.processedBlob) {
            // For single images
            const filename = await this.getDownloadFilename();
            this.downloadBlob(this.processedBlob, filename);
        }
    }

    async downloadTop() {
        if (this.processedBlobs?.top) {
            const dimensions = await this.getBlobDimensions(this.processedBlobs.top);
            const dimensionSuffix = dimensions ? `-${dimensions}` : '';
            this.downloadBlob(this.processedBlobs.top, `${this.getBaseFilename()}-top-half${dimensionSuffix}.png`);
        }
    }

    async downloadBottom() {
        if (this.processedBlobs?.bottom) {
            const dimensions = await this.getBlobDimensions(this.processedBlobs.bottom);
            const dimensionSuffix = dimensions ? `-${dimensions}` : '';
            this.downloadBlob(this.processedBlobs.bottom, `${this.getBaseFilename()}-bottom-half${dimensionSuffix}.png`);
        }
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    getBaseFilename() {
        const originalName = this.originalFile.name;
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
        let suffix = '';
        switch (this.selectedFilter) {
            case 'triangular-mask':
                suffix = '-triangular';
                break;
            case 'rounded-rectangle':
                suffix = '-rounded';
                break;
            case 'rounded-corners':
                suffix = '-rounded-corners';
                break;
            case 'custom-crop':
                suffix = '-cropped';
                break;
            case 'slant-top-red':
                suffix = '-top-red-slant';
                break;
            case 'slant-top-pinot':
                suffix = '-top-pinot-slant';
                break;
            case 'slant-bottom-red':
                suffix = '-bottom-red-slant';
                break;
            case 'slant-bottom-pinot':
                suffix = '-bottom-pinot-slant';
                break;
            default:
                suffix = '';
        }
        return `${nameWithoutExt}${suffix}`;
    }

    async getDownloadFilename() {
        const baseName = this.getBaseFilename();
        
        // Get dimensions from the processed blob or current canvas
        let dimensions = '';
        if (this.processedBlob) {
            dimensions = await this.getBlobDimensions(this.processedBlob);
        } else if (this.currentProcessedCanvas) {
            dimensions = `${this.currentProcessedCanvas.width}x${this.currentProcessedCanvas.height}`;
        }
        
        // Determine extension from the actual processed blob format
        if (this.processedBlob) {
            const isJPEG = this.processedBlob.type === 'image/jpeg';
            const extension = isJPEG ? 'jpg' : 'png';
            
            const dimensionSuffix = dimensions ? `-${dimensions}` : '';
            
            switch (this.selectedFilter) {
                case 'triangular-mask':
                    return `${baseName}-triangular${dimensionSuffix}.${extension}`;
                case 'rounded-rectangle':
                    return `${baseName}-rounded${dimensionSuffix}.${extension}`;
                case 'rounded-corners':
                    return `${baseName}-rounded-corners${dimensionSuffix}.${extension}`;
                case 'custom-crop':
                    return `${baseName}-cropped${dimensionSuffix}.${extension}`;
                case 'slant-top-red':
                    return `${baseName}-top-red-slant${dimensionSuffix}.${extension}`;
                case 'slant-top-pinot':
                    return `${baseName}-top-pinot-slant${dimensionSuffix}.${extension}`;
                case 'slant-bottom-red':
                    return `${baseName}-bottom-red-slant${dimensionSuffix}.${extension}`;
                case 'slant-bottom-pinot':
                    return `${baseName}-bottom-pinot-slant${dimensionSuffix}.${extension}`;
                case 'none':
                default:
                    return `${baseName}${dimensionSuffix}.${extension}`;
            }
        }
        
        // Fallback if no processed blob yet
        const dimensionSuffix = dimensions ? `-${dimensions}` : '';
        return `${baseName}${dimensionSuffix}.jpg`;
    }

    async getBlobDimensions(blob) {
        return new Promise((resolve) => {
            const img = new Image();
            const url = URL.createObjectURL(blob);
            
            img.onload = () => {
                URL.revokeObjectURL(url); // Clean up memory
                resolve(`${img.width}x${img.height}`);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url); // Clean up memory even on error
                resolve(''); // Fallback if image can't be loaded
            };
            img.src = url;
        });
    }

    // Filter methods
    async applyFilter() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const sourceImage = this.croppedImage || this.originalImage;
        canvas.width = sourceImage.width;
        canvas.height = sourceImage.height;
        
        // Draw the source image (original or cropped)
        ctx.drawImage(sourceImage, 0, 0);
        
        if (this.selectedFilter === 'triangular-mask') {
            this.applyTriangularMask(ctx, canvas.width, canvas.height);
        } else if (this.selectedFilter === 'rounded-rectangle') {
            this.applyRoundedRectangleMask(ctx, canvas.width, canvas.height);
        } else if (this.selectedFilter === 'rounded-corners') {
            this.applyRoundedCorners(ctx, canvas.width, canvas.height);
        } else if (this.selectedFilter.startsWith('slant-')) {
            await this.applySingleSlantOverlay(ctx);
        }
        
        return canvas;
    }

    applyTriangularMask(ctx, width, height) {
        // Calculate triangle width proportionally: 76px on 700px wide image
        const triangleWidth = (width * 76) / 700;
        
        // Create a composite operation to "cut out" the triangular areas
        ctx.globalCompositeOperation = 'destination-out';
        
        // Draw the top triangle (triangleWidth tall on left, 0px on right)
        ctx.beginPath();
        ctx.moveTo(0, 0); // Top-left corner
        ctx.lineTo(width, 0); // Top-right corner  
        ctx.lineTo(width, 0); // Stay at top-right (0px tall on right)
        ctx.lineTo(0, triangleWidth); // Go down triangleWidth on the left
        ctx.closePath();
        ctx.fill();
        
        // Draw the bottom triangle (triangleWidth tall on right, 0px on left)
        ctx.beginPath();
        ctx.moveTo(0, height); // Bottom-left corner (0px tall on left)
        ctx.lineTo(width, height - triangleWidth); // triangleWidth up from bottom-right
        ctx.lineTo(width, height); // Bottom-right corner
        ctx.lineTo(0, height); // Back to bottom-left
        ctx.closePath();
        ctx.fill();
        
        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over';
    }

    applyRoundedRectangleMask(ctx, width, height) {
        // Create a pill shape: flat bottom, semicircular top
        const radius = width / 2; // Semicircle radius is half the width
        
        // Use destination-in to clip to the pill shape
        ctx.globalCompositeOperation = 'destination-in';
        
        // Draw custom pill shape
        ctx.beginPath();
        // Start at bottom left
        ctx.moveTo(0, height);
        // Line to bottom right (flat bottom)
        ctx.lineTo(width, height);
        // Line up the right side to where semicircle starts
        ctx.lineTo(width, radius);
        // Draw semicircle arc from right to left across the top
        ctx.arc(radius, radius, radius, 0, Math.PI, true);
        // Line down the left side back to start
        ctx.lineTo(0, radius);
        // Close the path back to bottom left
        ctx.closePath();
        ctx.fill();
        
        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over';
    }

    applyRoundedCorners(ctx, width, height) {
        // Create rounded corners with customizable radius
        const radius = Math.min(width, height) * 0.1; // 10% of the smaller dimension
        
        // Use destination-in to clip to the rounded rectangle shape
        ctx.globalCompositeOperation = 'destination-in';
        
        // Draw rounded rectangle
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(width - radius, 0);
        ctx.arc(width - radius, radius, radius, -Math.PI/2, 0);
        ctx.lineTo(width, height - radius);
        ctx.arc(width - radius, height - radius, radius, 0, Math.PI/2);
        ctx.lineTo(radius, height);
        ctx.arc(radius, height - radius, radius, Math.PI/2, Math.PI);
        ctx.lineTo(0, radius);
        ctx.arc(radius, radius, radius, Math.PI, -Math.PI/2);
        ctx.closePath();
        ctx.fill();
        
        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over';
    }

    async applySingleSlantOverlay(ctx) {
        const canvas = ctx.canvas;
        const width = 1400;
        const height = 408;
        canvas.width = width;
        canvas.height = height;

        // Select slant overlay based on filter
        let slantUrl = '';
        const isTop = this.selectedFilter.includes('top');

        if (this.selectedFilter === 'slant-top-red') {
            slantUrl = 'https://assets.doordash.team/m/3abc993d3d3ce59f/original/TOP-SLANT-COLOR.png';
        } else if (this.selectedFilter === 'slant-top-pinot') {
            slantUrl = 'https://assets.doordash.team/m/6ef3d933125cfbcf/original/TOP-SLANT-COLOR-1.png';
        } else if (this.selectedFilter === 'slant-bottom-red') {
            slantUrl = 'https://assets.doordash.team/m/7fbe6045e786226f/original/TOP-SLANT-COLOR-1-1.png';
        } else if (this.selectedFilter === 'slant-bottom-pinot') {
            slantUrl = 'https://assets.doordash.team/m/5ef5ee0b564cda5c/original/TOP-SLANT-COLOR-2.png';
        }

        const slantImg = await this.loadImage(slantUrl);
        ctx.clearRect(0, 0, width, height);

        // Draw the overlay
        if (isTop) {
            ctx.drawImage(slantImg, 0, 0, width, slantImg.height);
        } else {
            ctx.drawImage(slantImg, 0, height - slantImg.height, width, slantImg.height);
        }

        // Draw centered uploaded image at 400px wide
        const desiredWidth = 400;
        const aspect = this.originalImage.width / this.originalImage.height;
        const imgWidth = desiredWidth;
        const imgHeight = imgWidth / aspect;
        const imgX = (width - imgWidth) / 2;
        const imgY = (height - imgHeight) / 2;

        ctx.drawImage(this.originalImage, imgX, imgY, imgWidth, imgHeight);
    }

async createTopHalf() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const halfHeight = this.originalImage.height / 2;
    canvas.width = this.originalImage.width;
    canvas.height = halfHeight;

    ctx.drawImage(
        this.originalImage,
        0, 0, canvas.width, halfHeight,
        0, 0, canvas.width, halfHeight
    );

    // Apply triangular top mask
    const triangleHeight = (canvas.width * 76) / 700;
    ctx.globalCompositeOperation = 'destination-out';

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, 0);
    ctx.lineTo(0, triangleHeight);
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    return canvas;
}

async createBottomHalf() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const halfHeight = this.originalImage.height / 2;
    canvas.width = this.originalImage.width;
    canvas.height = halfHeight;

    ctx.drawImage(
        this.originalImage,
        0, this.originalImage.height - halfHeight,
        canvas.width, halfHeight,
        0, 0, canvas.width, halfHeight
    );

    // Apply triangular bottom mask
    const triangleHeight = (canvas.width * 76) / 700;
    ctx.globalCompositeOperation = 'destination-out';

    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(canvas.width, canvas.height - triangleHeight);
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over';
    return canvas;
}

    selectFilter(optionElement) {
        // Remove previous selection
        document.querySelectorAll('.filter-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Add selection to clicked option
        optionElement.classList.add('selected');
        this.selectedFilter = optionElement.dataset.filter;
        
        // Enable apply button
        document.getElementById('applyFilterBtn').disabled = false;
        
        // Update button text based on filter
        const applyBtn = document.getElementById('applyFilterBtn');
        if (this.selectedFilter === 'custom-crop') {
            applyBtn.textContent = 'Setup Custom Crop';
        } else {
            applyBtn.textContent = 'Apply Filter & Optimize';
        }
    }

    async applyFilterAndOptimize() {
        if (!this.originalImage) return;

        // Handle custom crop filter differently
        if (this.selectedFilter === 'custom-crop') {
            this.showCropSection();
            return;
        }

        document.getElementById('loading').style.display = 'block';

        try {
            if (this.selectedFilter === 'triangular-mask') {
                // Create two separate images for triangular mask
                const topCanvas = await this.createTopHalf();
                const bottomCanvas = await this.createBottomHalf();
                
                // Store top canvas for preview (representative of the processing)
                this.currentProcessedCanvas = topCanvas;
                
                // Optimize both canvases
                const topBlob = await this.optimizeCanvas(topCanvas, 'top');
                const bottomBlob = await this.optimizeCanvas(bottomCanvas, 'bottom');
                
                this.processedBlobs = { top: topBlob, bottom: bottomBlob };
                this.displaySplitImages(topBlob, bottomBlob);
                
                // Show preview section for split images
                document.getElementById('filterSection').style.display = 'none';
                document.getElementById('previewSection').style.display = 'block';
                document.getElementById('loading').style.display = 'none';

        } else {
                // Original single image processing for other filters
                const filteredCanvas = await this.applyFilter();
                
                // Hide filter section before processing
                document.getElementById('filterSection').style.display = 'none';
                
                // Process and display the filtered image with current quality settings
                await this.processAndDisplayImage(filteredCanvas, true);
            }

        } catch (error) {
            console.error('Error processing image:', error);
            document.getElementById('loading').style.display = 'none';
            alert('Error processing image. Please try again.');
        }
    }

    displaySplitImages(topBlob, bottomBlob) {
        const originalImage = document.getElementById('originalImage');
        const optimizedImage = document.getElementById('optimizedImage');
        
        // For triangular mask, show original on left and top half on right
        originalImage.src = URL.createObjectURL(topBlob);
        optimizedImage.src = URL.createObjectURL(bottomBlob);
        
        // Update labels
        document.querySelector('.comparison-before .image-label').textContent = 'Top Half';
        document.querySelector('.comparison-after .image-label').textContent = 'Bottom Half';
        
        // Update size information for both halves
        this.updateSizeDisplay(topBlob, bottomBlob);
        
        // Show individual download section for split images
        document.getElementById('individualDownloads').style.display = 'flex';
        
        // Update main download button
        document.getElementById('downloadBtn').textContent = 'Download Top Half';
    }

    updateSizeDisplay(blob, bottomBlob = null) {
        const originalSizeElement = document.getElementById('originalSize');
        const optimizedSizeElement = document.getElementById('optimizedSize');
        
        if (bottomBlob) {
            // For split images
            const topSize = (blob.size / 1024).toFixed(1);
            const bottomSize = (bottomBlob.size / 1024).toFixed(1);
            const totalSize = ((blob.size + bottomBlob.size) / 1024).toFixed(1);
            
            originalSizeElement.textContent = `${topSize} KB (top)`;
            optimizedSizeElement.textContent = `${bottomSize} KB (bottom) | Total: ${totalSize} KB`;
        } else {
            // For single images
            const originalSize = (this.originalFile.size / 1024).toFixed(1);
            const optimizedSize = (blob.size / 1024).toFixed(1);
            const savings = (((this.originalFile.size - blob.size) / this.originalFile.size) * 100).toFixed(1);
            
            // Determine if size was capped
            const isSizeCapped = blob.size < this.originalFile.size && this.selectedFilter === 'none';
            const sizeCapNote = isSizeCapped ? ' (size-capped)' : '';
            
            // Show format info
            const format = blob.type === 'image/jpeg' ? 'JPEG' : 'PNG';
            
            originalSizeElement.textContent = `${originalSize} KB`;
            optimizedSizeElement.textContent = `${optimizedSize} KB | ${format} | ${savings}% savings${sizeCapNote}`;
        }
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Important for drawing from hosted URLs
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    }
}

// Initialize app
new ImageOptimizer();