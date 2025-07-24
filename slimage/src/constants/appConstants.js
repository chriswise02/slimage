// Application constants and configuration

export const STEPS = ['upload', 'filter', 'preview'];

export const STEP_TITLES = {
  upload: 'Upload Image',
  filter: 'Choose Filter',
  preview: 'Preview & Download'
};

export const FILTER_TITLES = {
  'none': 'Compression Only',
  'custom-crop': 'Custom Crop',
  'triangular-mask': 'Quadrilateral Mask',
  'rounded-corners': 'Rounded Corners',
  'wedge': 'Wedge'
};

export const TRANSPARENCY_FILTERS = [
  'triangular-mask', 
  'rounded-corners', 
  'rounded-rectangle',
  'wedge'
];

export const ACCEPTED_FILE_TYPES = '.jpg,.jpeg,.png,.webp';

export const DEFAULT_QUALITY = 60;
export const MAX_IMAGE_WIDTH = 1400;
export const QUALITY_DEBOUNCE_MS = 300;

export const QUALITY_PRESETS = {
  HIGH_COMPRESSION: 30,
  BALANCED: 60,
  HIGH_QUALITY: 85
};

export const CROP_ASPECT_RATIOS = [
  { value: 'free', label: 'Free Form' },
  { value: '1:1', label: '1:1 (Square)' },
  { value: '16:9', label: '16:9 (Widescreen)' },
  { value: '4:3', label: '4:3 (Standard)' },
  { value: '3:2', label: '3:2 (Photography)' },
  { value: '9:16', label: '9:16 (Portrait)' }
];

// Wedge filter configuration
export const WEDGE_COLORS = {
  red: { hex: '#FF3008', label: 'Delivery Red' },
  pinot: { hex: '#4C0C3A', label: 'Pinot Noir' }
};

export const WEDGE_POSITIONS = ['top', 'bottom'];

// Rounded corners configuration
export const ROUNDED_CORNER_PRESETS = [
  { name: 'All 10%', values: { topLeft: 10, topRight: 10, bottomLeft: 10, bottomRight: 10 } },
  { name: 'All 50%', values: { topLeft: 50, topRight: 50, bottomLeft: 50, bottomRight: 50 } },
  { name: 'Top 50%', values: { topLeft: 50, topRight: 50, bottomLeft: 0, bottomRight: 0 } },
  { name: 'Reset', values: { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 } }
]; 