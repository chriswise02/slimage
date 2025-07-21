class ImageOptimizer {
    constructor() {
        this.originalFile = null;
        this.optimizedBlob = null;
        this.init();
    }

    init() {
        const imageInput = document.getElementById('imageInput');
        const qualitySlider = document.getElementById('quality');
        const maxWidthInput = document.getElementById('maxWidth');
        const downloadBtn = document.getElementById('downloadBtn');

        imageInput.addEventListener('change', (e) => this.handleFileSelect(e));
        qualitySlider.addEventListener('input', (e) => this.updateQuality(e));
        maxWidthInput.addEventListener('input', () => this.optimizeImage());
        downloadBtn.addEventListener('click', () => this.downloadOptimized());
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.match('image/jpeg')) {
            alert('Please select a JPG image file.');
            return;
        }

        this.originalFile = file;
        this.displayOriginalImage(file);
        this.optimizeImage();
    }

    displayOriginalImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const originalImage = document.getElementById('originalImage');
            originalImage.src = e.target.result;
            
            const fileSizeKB = (file.size / 1024).toFixed(1);
            document.getElementById('originalSize').textContent = `Size: ${fileSizeKB} KB`;
            
            document.getElementById('previewSection').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    updateQuality(event) {
        const qualityValue = event.target.value;
        document.getElementById('qualityValue').textContent = qualityValue;
        this.optimizeImage();
    }

    async optimizeImage() {
        if (!this.originalFile) return;

        document.getElementById('loading').style.display = 'block';

        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                const maxWidth = parseInt(document.getElementById('maxWidth').value);
                const quality = parseInt(document.getElementById('quality').value) / 100;

                let { width, height } = img;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    this.optimizedBlob = blob;
                    this.displayOptimizedImage(blob);
                    document.getElementById('loading').style.display = 'none';
                }, 'image/jpeg', quality);
            };

            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.readAsDataURL(this.originalFile);

        } catch (error) {
            console.error('Error optimizing image:', error);
            document.getElementById('loading').style.display = 'none';
            alert('Error optimizing image. Please try again.');
        }
    }

    displayOptimizedImage(blob) {
        const url = URL.createObjectURL(blob);
        const optimizedImage = document.getElementById('optimizedImage');
        optimizedImage.src = url;

        const fileSizeKB = (blob.size / 1024).toFixed(1);
        document.getElementById('optimizedSize').textContent = `Size: ${fileSizeKB} KB`;
        
        const savings = ((this.originalFile.size - blob.size) / this.originalFile.size * 100).toFixed(1);
        document.getElementById('optimizedSize').textContent += ` (${savings}% smaller)`;
    }

    downloadOptimized() {
        if (!this.optimizedBlob) {
            alert('No optimized image available for download.');
            return;
        }

        const url = URL.createObjectURL(this.optimizedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'optimized-image.jpg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

new ImageOptimizer();