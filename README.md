# slimage

A modern React-based image processing tool that optimizes images and applies creative filters with professional-grade output. Perfect for creating social media content, web graphics, and design assets with advanced customization options.

## ✨ Features

### 🖼️ **Image Optimization**
- **Hybrid Compression**: Professional PNG compression + Browser JPEG optimization
- **Size Capping**: Processed files are never larger than originals
- **Email-Optimized**: Aggressive PNG quantization for email-friendly file sizes
- **Format Intelligence**: Auto-selects PNG for transparency, JPEG for photos
- **Quality Control**: Real-time quality slider with 10-100% range and presets
- **Professional Results**: Up to 90% compression for JPEG, 30%+ for PNG with transparency

### 🎨 **Creative Filters**

#### **Compress**
- **Hybrid compression engine**: Professional PNG quantization + Browser JPEG
- **Intelligent format preservation**: Maintains original format and transparency
- **Email-optimized output**: Aggressive compression for email-friendly file sizes
- **Size safety**: Never produces files larger than the original
- **Quality presets**: High Compression (30%), Balanced (60%), High Quality (85%)

#### **Custom Crop**
- Interactive crop interface with drag-and-drop selection
- Aspect ratio constraints (Free, 1:1, 4:3, 16:9, 3:2)
- Custom pixel dimensions with automatic resizing
- Real-time crop preview with resize handles

#### **Mask (Quadrilateral)**
- Splits image horizontally into two separate halves
- Applies proportional triangular cutouts for dynamic layouts
- Creates transparent backgrounds for overlay effects
- Downloads as two separate PNG files (top-half and bottom-half)

#### **Rounded Corners**
- **Individual corner control**: Adjust each corner independently (0-50%)
- **Live preview**: Real-time visual feedback as you adjust sliders
- **Quick presets**: All 10%, All 50%, Top 50%, Reset
- **Percentage-based**: Scales proportionally with any image size
- **Professional output**: Smooth curves with transparency preservation

#### **Wedge (Slant Overlays)**
- **Position options**: Top or Bottom placement with intuitive icons
- **Color choices**: Delivery Red (#FF3008) or Pinot Noir (#4C0C3A) with color swatches
- **SVG-based overlays**: Clean geometric patterns at any scale
- **Configurable workflow**: Visual selection interface before application
- **Professional branding**: Consistent with design system colors

### 🎯 **User Experience**
- **Streamlined Workflow**: Upload → Filter → Preview & Download (3 steps)
- **Step Navigation**: Visual progress indicator with clickable navigation
- **Live Previews**: See exactly what filters will look like before applying
- **Smart File Naming**: Automatic filename generation with filter types and dimensions
- **Reset Functionality**: Quick reset to process another image
- **Responsive Design**: Works seamlessly on desktop and mobile

### 🔧 **Advanced Features**
- **Memory Management**: Automatic cleanup of blob URLs and temporary canvases
- **Error Handling**: Graceful fallbacks with user-friendly error messages
- **Performance Optimization**: Debounced quality updates and efficient canvas operations
- **Accessibility**: Keyboard navigation and screen reader support

## 🚀 Getting Started

### **Quick Start**
1. **Upload**: Click "Upload Image" or drag & drop your file
2. **Filter**: Choose from 5 available filters with preview icons
3. **Configure**: Use modal interfaces for Crop, Rounded Corners, or Wedge options
4. **Preview**: Review your processed image with quality controls
5. **Download**: Save your optimized image with automatic file naming

### **Development Setup**
```bash
# Navigate to project directory
cd slimage

# Install dependencies
npm install

# Start development server
npm start

# Open http://localhost:3000
```

## 📁 File Outputs

| Filter Type | Format | Transparency | Compression | Example Filename |
|-------------|--------|--------------|-------------|------------------|
| Compress | Original Format | Preserved | Up to 90% (JPEG), 30%+ (PNG) | `photo-slimage-processed-1200x800.jpg` |
| Custom Crop | Original Format | Preserved | Hybrid compression | `photo-slimage-processed-800x600.jpg` |
| Mask | PNG | Yes | Professional PNG | `photo-top-half-1200x400.png` |
| Rounded Corners | PNG | Yes | Professional PNG | `photo-slimage-processed-1200x800.png` |
| Wedge | PNG | Yes | Professional PNG | `photo-slimage-processed-1400x408.png` |

## 🛠️ Technical Stack

### **Frontend Framework**
- **React 19**: Modern hooks-based architecture with latest features
- **Custom Hooks**: Separation of concerns with reusable logic
- **Component Architecture**: Modular, maintainable UI components with strict DRY principles

### **Image Processing**
- **Hybrid Compression Engine**: Professional PNG quantization (pngquant) + Browser JPEG
- **HTML5 Canvas API**: High-performance client-side processing
- **WebAssembly Integration**: @jsquash/png for professional PNG compression
- **SVG Generation**: Dynamic vector overlays for crisp results
- **Blob Management**: Efficient memory handling with automatic cleanup
- **Size Safety**: Automatic fallback to prevent file size increases

### **Styling & UI**
- **Tailwind CSS**: Utility-first styling with custom design system
- **Lucide React**: Consistent iconography throughout the interface
- **Responsive Design**: Mobile-first approach with flexible layouts
- **Standardized Components**: Reusable Button and Modal components for consistency

### **State Management**
- **React useState**: Local component state with optimized re-renders
- **Custom Hooks**: Business logic encapsulation with consolidated state updates
- **Optimized Prop Passing**: Reduced prop drilling with centralized state functions
- **Context-free**: Simple prop passing for maintainable code

### **Performance**
- **Debounced Updates**: Smooth real-time previews without lag
- **Memory Optimization**: Automatic cleanup of temporary resources
- **Tree Shaking**: Optimized bundle size with modular imports
- **Component Reusability**: Shared Modal and Button components reduce bundle size

## 🏗️ Architecture

### **Project Structure**
```
src/
├── App.js                     # Main application orchestrator (319 lines, 61% reduction)
├── imageProcessor.js          # Core image processing logic
├── CropInterface.js          # Interactive crop component
├── components/               # Reusable UI components
│   ├── StepIndicator.js     # Progress navigation
│   ├── UploadSection.js     # File upload interface  
│   ├── FilterSection.js     # Filter selection grid
│   ├── PreviewSection.js    # Extracted preview interface ⭐ NEW
│   ├── QualityControls.js   # Quality adjustment interface
│   ├── Modal.js             # Reusable modal component
│   ├── Button.js            # Standardized button component
│   ├── CropModal.js         # Dedicated crop modal ⭐ NEW
│   ├── WedgeModal.js        # Dedicated wedge options modal ⭐ NEW
│   └── RoundedCornersModal.js # Dedicated rounded corners modal ⭐ NEW
├── hooks/                    # Custom React hooks
│   ├── useStepNavigation.js # Step progression logic
│   ├── useImageProcessing.js # Image operations
│   └── useQualityControl.js # Quality management
├── utils/                    # Utility functions
│   ├── formatUtils.js       # Blob handling (cleaned up)
│   └── stepNavigation.js    # Navigation logic
└── constants/                # Application configuration
    └── appConstants.js      # Static data and settings (cleaned up)
```

### **⭐ Recent Improvements (Code Organization & DRY)**
- **Component Extraction**: Reduced App.js from 810 → 319 lines (61% reduction)
- **Modal Standardization**: 3 dedicated modal components replacing 270+ lines of duplicated code
- **Button Standardization**: Consistent Button component usage throughout
- **Constants Cleanup**: Removed unused configurations and redundant abstractions
- **Utilities Cleanup**: Removed unused helper functions, kept only essential ones
- **Import Optimization**: Cleaned up unused imports and dependencies

### **Data Flow**
1. **App.js**: Coordinates state between hooks and components (now 61% smaller)
2. **Custom Hooks**: Handle business logic and API interactions
3. **Specialized Components**: Present focused UI with clear responsibilities
4. **Reusable Modals**: Handle filter configuration with consistent patterns
5. **imageProcessor**: Performs canvas-based image manipulation
6. **Utils/Constants**: Provide essential helper functions and configuration

## 🔧 Technical Details

### **Code Quality & Maintainability**
- **DRY Principles**: Eliminated code duplication through component extraction
- **Single Responsibility**: Each component has a focused, clear purpose
- **Consistent Patterns**: Standardized modal interfaces and button usage
- **Self-Contained Components**: Reduced external dependencies and coupling
- **Optimized State Management**: Reduced prop drilling and eliminated redundant state setters

### **Image Processing**
- **Hybrid Compression**: Professional PNG quantization + Browser JPEG optimization
- **Maximum Dimensions**: 1400px width (maintains aspect ratio)
- **Quality Control**: 10-100% range with real-time preview (60% default)
- **Format Preservation**: Maintains original format and transparency
- **Size Safety**: Automatic size capping to prevent larger outputs
- **Email Optimization**: Aggressive PNG quantization for attachment-friendly sizes
- **Canvas Optimization**: High-performance rendering with automatic cleanup

### **Browser Compatibility**
- **Modern Browsers**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **Canvas Support**: HTML5 Canvas with 2D context
- **File API**: Drag & drop and file selection support
- **Blob URLs**: For efficient image preview and download

### **Performance Considerations**
- **Memory Management**: Automatic cleanup of temporary canvases and blob URLs
- **Debounced Processing**: 300ms delay for quality slider to prevent lag
- **Efficient Rendering**: Minimal re-renders with proper dependency arrays
- **Component Reusability**: Shared Modal and Button components for consistency
- **Tree Shaking**: Modular imports for optimal bundle size
- **Reduced Bundle Size**: Eliminated redundant code and unused utilities

## 🎨 Design System

### **Colors**
- **Primary**: #FF3008 (Delivery Red)
- **Secondary**: #4C0C3A (Pinot Noir)
- **Background**: #F0F0F0
- **Background Hover**: #E7E7E7
- **Text**: #333333
- **Text Muted**: #999999
- **Centralized**: All colors standardized throughout components

### **Typography**
- **Font Family**: Inter with feature settings for improved readability
- **Hierarchy**: Clear size and weight distinctions
- **Accessibility**: WCAG AA compliant contrast ratios

### **Component Standards**
- **Button Variants**: Primary, Secondary, Preset with consistent sizing
- **Modal Pattern**: Standardized overlay, content, and interaction patterns
- **Consistent Spacing**: Unified padding, margins, and gap usage
- **Interaction Design**: Subtle transitions for all interactive elements

---

**slimage** - Professional image processing made simple! 🎨✨

Built with modern web technologies and optimized architecture for fast, reliable, client-side image processing.

*Recently optimized for better code organization, reduced complexity, and improved maintainability while maintaining full functionality.*
