# SlImage

A modern web-based image processing tool that optimizes images and applies creative filters with transparent backgrounds. Perfect for creating social media content, web graphics, and design assets.

## ✨ Features

### 🖼️ **Image Optimization**
- **Smart Compression**: Reduces file sizes with 60% JPEG quality while maintaining visual quality
- **Intelligent Resizing**: Automatically resizes images to a maximum width of 1400px (preserves aspect ratio)
- **Format Support**: Accepts JPG, JPEG, PNG, and WebP images
- **Size Comparison**: Shows before/after file sizes with clear explanations

### 🎨 **Creative Filters**

#### **Compression**
- Basic image optimization and compression
- Outputs optimized JPEG files
- Ideal for web use and faster loading

#### **Custom Crop**
- [Needs info]

#### **Triangular Mask**
- Splits image horizontally into two separate halves
- Applies proportional triangular cutouts (76px on 700px wide images)
- Creates transparent backgrounds for overlay effects
- Downloads as two separate PNG files (top-half and bottom-half)
- Individual download buttons for each half

#### **Rounded Rectangle (Pill Shape)**
- Creates a pill-shaped mask with flat bottom and semicircular top
- Perfect semicircle across the full width
- Transparent background outside the shape
- Single PNG output with transparency

#### **Rounded Corners**
- Creates an image with border radius on all four corners
- Transparent background outside the shape
- Single PNG output with transparency

#### **Top Pinot**
- Sets user uploaded image to 200px wide
- Centers user uploaded image
- Applies Pinot slant behind user image in the top half of image
- Applies transparency to remaining background of the image, which is visible at the bottom

#### **Top Red**
- Sets user uploaded image to 200px wide
- Centers user uploaded image
- Applies Red slant behind user image in the top half of image
- Applies transparency to remaining background of the image, which is visible at the bottom


#### **Bottom Pinot**
- Sets user uploaded image to 200px wide
- Centers user uploaded image
- Applies Pinot slant behind user image in the bottom half of image
- Applies transparency to remaining background of the image, which is visible at the top

#### **Bottom Red**
- Sets user uploaded image to 200px wide
- Centers user uploaded image
- Applies Pinot slant behind user image in the bottom half of image
- Applies transparency to remaining background of the image, which is visible at the top


### 🎯 **User Experience**
- **Intuitive Workflow**: Upload → Select Filter → Apply → Download
- **Visual Previews**: See exactly what each filter does before applying
- **Multiple Download Options**: Individual downloads or batch downloads for split images
- **Smart File Naming**: Automatic filename generation with dimensions (e.g. `image-optimized-cropped-800x600.jpg`)
- **Reset Functionality**: Easy reset to process another image
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 Getting Started

1. **Upload an Image**: Click "Upload Image" and select your file
2. **Choose a Filter**: Select from No Filter, Triangular Mask, or Rounded Rectangle
3. **Apply & Process**: Click "Apply Filter & Optimize" to process your image
4. **Download**: Save your processed image(s) to your device

## 📁 File Outputs

| Filter Type | Format | Transparency | File Count | Example Filename |
|-------------|--------|--------------|------------|------------------|
| No Filter | JPEG | No | 1 | `photo-optimized-1200x800.jpg` |
| Custom Crop | JPEG/PNG | Auto-detected | 1 | `photo-optimized-cropped-600x400.jpg` |
| Triangular Mask | PNG | Yes | 2 (top + bottom) | `photo-optimized-top-half-1200x400.png` |
| Rounded Rectangle | PNG | Yes | 1 | `photo-optimized-rounded-1200x800.png` |
| Rounded Corners | PNG | Yes | 1 | `photo-optimized-rounded-corners-1200x800.png` |

## 🔧 Technical Details

- **Maximum Width**: 1400px (maintains aspect ratio)
- **JPEG Quality**: 60% compression for optimal size/quality balance
- **PNG Format**: Used for filtered images to preserve transparency
- **Proportional Scaling**: Triangle sizes scale with image dimensions
- **Browser Compatibility**: Modern browsers with Canvas support

## 🛠️ Technical Stack

- **Frontend**: Vanilla HTML, CSS, and JavaScript
- **Image Processing**: HTML5 Canvas API
- **Optimization**: Client-side compression and resizing
- **No Server Required**: Runs entirely in the browser

---

**SlImage** - Transform your images with style! 🎨✨
