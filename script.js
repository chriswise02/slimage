class ImageOptimizer {
    constructor() {
        this.originalFile = null;
        this.originalImage = null;
        this.selectedFilter = 'none';
        this.processedBlob = null;
        this.processedBlobs = null; // For triangular mask
        this.init();
    }

    init() {
        const imageInput = document.getElementById('imageInput');
        const downloadBtn = document.getElementById('downloadBtn');
        const downloadTopBtn = document.getElementById('downloadTopBtn');
        const downloadBottomBtn = document.getElementById('downloadBottomBtn');
        const applyFilterBtn = document.getElementById('applyFilterBtn');
        const filterOptions = document.querySelectorAll('.filter-option');

        imageInput.addEventListener('change', (e) => this.handleFileSelect(e));
        downloadBtn.addEventListener('click', () => this.downloadProcessed());
        downloadTopBtn.addEventListener('click', () => this.downloadTop());
        downloadBottomBtn.addEventListener('click', () => this.downloadBottom());
        applyFilterBtn.addEventListener('click', () => this.applyFilterAndOptimize());

        filterOptions.forEach(option => {
            option.addEventListener('click', () => this.selectFilter(option));
        });
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

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
    }

    async applyFilterAndOptimize() {
        if (!this.originalImage) return;

        document.getElementById('loading').style.display = 'block';

        try {
            if (this.selectedFilter === 'triangular-mask') {
                // Create two separate images for triangular mask
                const topCanvas = await this.createTopHalf();
                const bottomCanvas = await this.createBottomHalf();
                
                // Optimize both canvases
                const topBlob = await this.optimizeCanvas(topCanvas, 'top');
                const bottomBlob = await this.optimizeCanvas(bottomCanvas, 'bottom');
                
                this.processedBlobs = { top: topBlob, bottom: bottomBlob };
                this.displaySplitImages(topBlob, bottomBlob);
                
            } else {
                // Original single image processing for no filter
                const filteredCanvas = await this.applyFilter();
                const optimizedBlob = await this.optimizeCanvas(filteredCanvas);
                
                this.processedBlob = optimizedBlob;
                this.displayProcessedImage(optimizedBlob);
            }
            
            document.getElementById('filterSection').style.display = 'none';
            document.getElementById('previewSection').style.display = 'block';
            document.getElementById('loading').style.display = 'none';

        } catch (error) {
            console.error('Error processing image:', error);
            document.getElementById('loading').style.display = 'none';
            alert('Error processing image. Please try again.');
        }
    }

    async applyFilter() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = this.originalImage.width;
        canvas.height = this.originalImage.height;
        
        // Draw the original image
        ctx.drawImage(this.originalImage, 0, 0);
        
        if (this.selectedFilter === 'triangular-mask') {
            this.applyTriangularMask(ctx, canvas.width, canvas.height);
        }
        
        return canvas;
    }

    applyTriangularMask(ctx, width, height) {
        // Calculate triangle width proportionally: 76px on 700px wide image
        const triangleWidth = (width * 76) / 700;
        
        // Create a composite operation to "cut out" the triangular areas
        // Set composite mode to destination-out to remove pixels
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

    async createTopHalf() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const halfHeight = this.originalImage.height / 2;
        canvas.width = this.originalImage.width;
        canvas.height = halfHeight;
        
        // Draw the top half of the original image
        ctx.drawImage(
            this.originalImage, 
            0, 0, this.originalImage.width, halfHeight,  // Source: top half
            0, 0, canvas.width, canvas.height           // Destination: full canvas
        );
        
        // Apply top triangle mask
        this.applyTopTriangleMask(ctx, canvas.width, canvas.height);
        
        return canvas;
    }

    async createBottomHalf() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const halfHeight = this.originalImage.height / 2;
        canvas.width = this.originalImage.width;
        canvas.height = halfHeight;
        
        // Draw the bottom half of the original image
        ctx.drawImage(
            this.originalImage, 
            0, halfHeight, this.originalImage.width, halfHeight,  // Source: bottom half
            0, 0, canvas.width, canvas.height                    // Destination: full canvas
        );
        
        // Apply bottom triangle mask
        this.applyBottomTriangleMask(ctx, canvas.width, canvas.height);
        
        return canvas;
    }

    applyTopTriangleMask(ctx, width, height) {
        // Calculate triangle width proportionally: 76px on 700px wide image
        const triangleWidth = (width * 76) / 700;
        
        // Create a composite operation to "cut out" the triangular area
        ctx.globalCompositeOperation = 'destination-out';
        
        // Draw the top triangle (triangleWidth tall on left, 0px on right)
        ctx.beginPath();
        ctx.moveTo(0, 0); // Top-left corner
        ctx.lineTo(width, 0); // Top-right corner  
        ctx.lineTo(width, 0); // Stay at top-right (0px tall on right)
        ctx.lineTo(0, triangleWidth); // Go down triangleWidth on the left
        ctx.closePath();
        ctx.fill();
        
        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over';
    }

    applyBottomTriangleMask(ctx, width, height) {
        // Calculate triangle width proportionally: 76px on 700px wide image
        const triangleWidth = (width * 76) / 700;
        
        // Create a composite operation to "cut out" the triangular area
        ctx.globalCompositeOperation = 'destination-out';
        
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

    async optimizeCanvas(canvas, half = null) {
        return new Promise((resolve) => {
            const maxWidth = 1920;
            const quality = 0.6; // 60% quality

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

            // Use PNG format to preserve transparency if filter was applied
            const format = this.selectedFilter !== 'none' ? 'image/png' : 'image/jpeg';
            const qualityParam = format === 'image/jpeg' ? quality : undefined;

            canvas.toBlob((blob) => {
                resolve(blob);
            }, format, qualityParam);
        });
    }

    displayProcessedImage(blob) {
        const url = URL.createObjectURL(blob);
        const processedImage = document.getElementById('optimizedImage');
        processedImage.src = url;

        const fileSizeKB = (blob.size / 1024).toFixed(1);
        const savings = ((this.originalFile.size - blob.size) / this.originalFile.size * 100).toFixed(1);
        document.getElementById('optimizedSize').textContent = `Size: ${fileSizeKB} KB (${savings}% smaller)`;
        
        // Hide individual download buttons for single image
        document.getElementById('downloadTopBtn').style.display = 'none';
        document.getElementById('downloadBottomBtn').style.display = 'none';
        
        // Reset labels and button text
        document.querySelector('.image-wrapper:first-child h3').textContent = 'Original';
        document.querySelector('.image-wrapper:last-child h3').textContent = 'Processed';
        document.getElementById('downloadBtn').textContent = 'Download Processed Image';
    }

    displaySplitImages(topBlob, bottomBlob) {
        // Display top image
        const topUrl = URL.createObjectURL(topBlob);
        const originalImage = document.getElementById('originalImage');
        originalImage.src = topUrl;
        
        // Display bottom image  
        const bottomUrl = URL.createObjectURL(bottomBlob);
        const processedImage = document.getElementById('optimizedImage');
        processedImage.src = bottomUrl;
        
        // Update labels
        document.querySelector('.image-wrapper:first-child h3').textContent = 'Top Half';
        document.querySelector('.image-wrapper:last-child h3').textContent = 'Bottom Half';
        
        // Update file size info
        const topSizeKB = (topBlob.size / 1024).toFixed(1);
        const bottomSizeKB = (bottomBlob.size / 1024).toFixed(1);
        document.getElementById('originalSize').textContent = `Size: ${topSizeKB} KB`;
        document.getElementById('optimizedSize').textContent = `Size: ${bottomSizeKB} KB`;
        
        // Show individual download buttons
        document.getElementById('downloadTopBtn').style.display = 'block';
        document.getElementById('downloadBottomBtn').style.display = 'block';
        
        // Update download button text
        document.getElementById('downloadBtn').textContent = 'Download Both Images';
    }

    downloadProcessed() {
        if (this.selectedFilter === 'triangular-mask' && this.processedBlobs) {
            // Download both halves
            this.downloadBlob(this.processedBlobs.top, 'top-half');
            // Small delay to avoid download conflicts
            setTimeout(() => {
                this.downloadBlob(this.processedBlobs.bottom, 'bottom-half');
            }, 100);
        } else if (this.processedBlob) {
            // Download single image
            this.downloadBlob(this.processedBlob, 'processed');
        } else {
            alert('No processed image available for download.');
        }
    }

    downloadBlob(blob, suffix) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Create filename based on original file name and suffix
        const originalName = this.originalFile.name.split('.')[0];
        const filterSuffix = this.selectedFilter !== 'none' ? `-${this.selectedFilter}` : '';
        const extension = this.selectedFilter !== 'none' ? '.png' : '.jpg';
        a.download = `${originalName}${filterSuffix}-${suffix}${extension}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    downloadTop() {
        if (this.processedBlobs && this.processedBlobs.top) {
            this.downloadBlob(this.processedBlobs.top, 'top-half');
        } else {
            alert('Top half not available for download.');
        }
    }

    downloadBottom() {
        if (this.processedBlobs && this.processedBlobs.bottom) {
            this.downloadBlob(this.processedBlobs.bottom, 'bottom-half');
        } else {
            alert('Bottom half not available for download.');
        }
    }
}

new ImageOptimizer();