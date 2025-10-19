/**
 * Utility to map hex colors to human-readable color names
 * Helps AI understand "delete the blue rectangle" when color is #3b82f6
 */

interface ColorMapping {
  name: string;
  hex: string;
  threshold: number; // How close the color needs to be (0-255 per channel)
}

// Common color mappings with their hex values
const COLOR_MAPPINGS: ColorMapping[] = [
  { name: 'red', hex: '#FF0000', threshold: 100 },
  { name: 'red', hex: '#ef4444', threshold: 50 }, // Tailwind red-500
  { name: 'orange', hex: '#FFA500', threshold: 80 },
  { name: 'orange', hex: '#f97316', threshold: 50 }, // Tailwind orange-500
  { name: 'yellow', hex: '#FFFF00', threshold: 100 },
  { name: 'yellow', hex: '#eab308', threshold: 50 }, // Tailwind yellow-500
  { name: 'green', hex: '#00FF00', threshold: 100 },
  { name: 'green', hex: '#22c55e', threshold: 50 }, // Tailwind green-500
  { name: 'blue', hex: '#0000FF', threshold: 100 },
  { name: 'blue', hex: '#3b82f6', threshold: 50 }, // Tailwind blue-500 (default)
  { name: 'purple', hex: '#800080', threshold: 80 },
  { name: 'purple', hex: '#a855f7', threshold: 50 }, // Tailwind purple-500
  { name: 'pink', hex: '#FFC0CB', threshold: 80 },
  { name: 'pink', hex: '#ec4899', threshold: 50 }, // Tailwind pink-500
  { name: 'brown', hex: '#A52A2A', threshold: 80 },
  { name: 'gray', hex: '#808080', threshold: 80 },
  { name: 'black', hex: '#000000', threshold: 50 },
  { name: 'white', hex: '#FFFFFF', threshold: 50 },
  { name: 'cyan', hex: '#00FFFF', threshold: 80 },
  { name: 'magenta', hex: '#FF00FF', threshold: 80 },
  { name: 'lime', hex: '#00FF00', threshold: 100 },
  { name: 'indigo', hex: '#4B0082', threshold: 80 },
  { name: 'violet', hex: '#EE82EE', threshold: 80 },
];

import cssColorNames from 'css-color-names';

/**
 * Convert CSS color names to hex codes using standard library
 */
function cssColorNameToHex(colorName: string): string {
  const lowerColorName = colorName.toLowerCase();
  const hexColor = (cssColorNames as any)[lowerColorName] || colorName;
  
  // Ensure the result has a # prefix if it's a hex code
  if (hexColor && !hexColor.startsWith('#') && /^[0-9a-fA-F]{3,6}$/.test(hexColor)) {
    return '#' + hexColor;
  }
  
  return hexColor;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  if (hex.length !== 6) {
    return null;
  }
  
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null;
  }
  
  return { r, g, b };
}

/**
 * Calculate color distance (Euclidean distance in RGB space)
 */
function colorDistance(rgb1: { r: number; g: number; b: number }, rgb2: { r: number; g: number; b: number }): number {
  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Get the closest color name for a hex color
 * Returns the color name or null if no close match
 */
export function getColorName(hex: string): string | null {
  const inputRgb = hexToRgb(hex);
  if (!inputRgb) {
    return null;
  }
  
  let closestMatch: { name: string; distance: number } | null = null;
  
  for (const mapping of COLOR_MAPPINGS) {
    const mappingRgb = hexToRgb(mapping.hex);
    if (!mappingRgb) continue;
    
    const distance = colorDistance(inputRgb, mappingRgb);
    
    // Check if within threshold
    if (distance <= mapping.threshold) {
      if (!closestMatch || distance < closestMatch.distance) {
        closestMatch = { name: mapping.name, distance };
      }
    }
  }
  
  return closestMatch ? closestMatch.name : null;
}

/**
 * Convert RGB to HSV color space
 * HSV is more perceptually uniform than RGB
 */
function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff) % 6;
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else {
      h = (r - g) / diff + 4;
    }
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  
  const s = max === 0 ? 0 : diff / max;
  const v = max;
  
  return { h, s: s * 100, v: v * 100 };
}

/**
 * Calculate Delta E CIE76 color difference
 * This is the industry standard for color difference measurement
 */
function deltaE(rgb1: { r: number; g: number; b: number }, rgb2: { r: number; g: number; b: number }): number {
  // Convert RGB to LAB color space
  const lab1 = rgbToLab(rgb1);
  const lab2 = rgbToLab(rgb2);
  
  // Calculate Delta E CIE76
  const deltaL = lab1.l - lab2.l;
  const deltaA = lab1.a - lab2.a;
  const deltaB = lab1.b - lab2.b;
  
  return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

/**
 * Convert RGB to LAB color space
 */
function rgbToLab(rgb: { r: number; g: number; b: number }): { l: number; a: number; b: number } {
  // Convert RGB to XYZ
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;
  
  // Apply gamma correction
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  
  // Convert to XYZ
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  
  // Convert to LAB
  const fx = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x + 16/116);
  const fy = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y + 16/116);
  const fz = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z + 16/116);
  
  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz)
  };
}

/**
 * Check if a color matches a target color name using advanced color matching
 * Uses both HSV analysis and Delta E for more accurate matching
 */
export function colorMatchesTarget(shapeColorHex: string, targetColorName: string): boolean {
  // First try exact name matching
  const shapeColorName = getColorName(shapeColorHex);
  if (shapeColorName && shapeColorName.toLowerCase().includes(targetColorName.toLowerCase())) {
    return true;
  }
  
  const targetLower = targetColorName.toLowerCase();
  const shapeRgb = hexToRgb(shapeColorHex);
  if (!shapeRgb) return false;
  
  // Convert to HSV for better color analysis
  const shapeHsv = rgbToHsv(shapeRgb.r, shapeRgb.g, shapeRgb.b);
  
  // Define target colors with their expected HSV ranges and Delta E thresholds
  const colorTargets = {
    red: {
      hsv: { h: [0, 20], s: [50, 100], v: [30, 100] }, // Red hue range
      deltaE: 15, // Maximum Delta E for red
      reference: { r: 255, g: 0, b: 0 }
    },
    blue: {
      hsv: { h: [200, 280], s: [50, 100], v: [30, 100] }, // Blue hue range
      deltaE: 15,
      reference: { r: 0, g: 0, b: 255 }
    },
    green: {
      hsv: { h: [80, 160], s: [50, 100], v: [30, 100] }, // Green hue range
      deltaE: 15,
      reference: { r: 0, g: 255, b: 0 }
    },
    yellow: {
      hsv: { h: [40, 80], s: [50, 100], v: [50, 100] }, // Yellow hue range
      deltaE: 15,
      reference: { r: 255, g: 255, b: 0 }
    },
    orange: {
      hsv: { h: [15, 45], s: [50, 100], v: [50, 100] }, // Orange hue range
      deltaE: 15,
      reference: { r: 255, g: 165, b: 0 }
    },
    purple: {
      hsv: { h: [260, 320], s: [50, 100], v: [30, 100] }, // Purple hue range
      deltaE: 15,
      reference: { r: 128, g: 0, b: 128 }
    },
    pink: {
      hsv: { h: [320, 360], s: [30, 100], v: [50, 100] }, // Pink hue range
      deltaE: 15,
      reference: { r: 255, g: 192, b: 203 }
    },
    brown: {
      hsv: { h: [15, 45], s: [30, 80], v: [20, 60] }, // Brown hue range (lower saturation/value)
      deltaE: 20,
      reference: { r: 139, g: 69, b: 19 }
    },
    gray: {
      hsv: { h: [0, 360], s: [0, 30], v: [15, 85] }, // Gray: any hue, low saturation, wider value range
      deltaE: 35, // More lenient Delta E for gray
      reference: { r: 128, g: 128, b: 128 }
    },
    black: {
      hsv: { h: [0, 360], s: [0, 100], v: [0, 20] }, // Black: very low value
      deltaE: 30,
      reference: { r: 0, g: 0, b: 0 }
    },
    white: {
      hsv: { h: [0, 360], s: [0, 20], v: [80, 100] }, // White: low saturation, high value
      deltaE: 25,
      reference: { r: 255, g: 255, b: 255 }
    }
  };
  
  const target = colorTargets[targetLower as keyof typeof colorTargets];
  if (!target) return false;
  
  // Check HSV ranges
  const hInRange = shapeHsv.h >= target.hsv.h[0] && shapeHsv.h <= target.hsv.h[1];
  const sInRange = shapeHsv.s >= target.hsv.s[0] && shapeHsv.s <= target.hsv.s[1];
  const vInRange = shapeHsv.v >= target.hsv.v[0] && shapeHsv.v <= target.hsv.v[1];
  
  // Check Delta E distance
  const deltaEDistance = deltaE(shapeRgb, target.reference);
  const deltaEInRange = deltaEDistance <= target.deltaE;
  
  // Color matches if it passes both HSV and Delta E criteria
  return hInRange && sInRange && vInRange && deltaEInRange;
}

/**
 * Format color for display in system prompt
 * Always returns hex codes only for consistent AI processing
 */
export function formatColorForAI(color: string): string {
  // Convert CSS color names to hex if needed, otherwise return as-is
  return cssColorNameToHex(color);
}

/**
 * Convert hex color to a specific CSS color name for AI understanding
 * Uses the css-color-names library to find the closest named color
 * This gives us specific names like "crimson", "teal", "coral", etc.
 */
export function hexToColorName(hex: string): string {
  // Normalize hex format
  hex = hex.toUpperCase();
  if (!hex.startsWith('#')) {
    hex = '#' + hex;
  }
  
  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  // Validate RGB values
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return 'unknown';
  }
  
  // Check if it's an exact match with a CSS color name
  const cssColorEntries = Object.entries(cssColorNames as Record<string, string>);
  for (const [name, colorHex] of cssColorEntries) {
    if (colorHex.toUpperCase() === hex) {
      return name;
    }
  }
  
  // Find the closest CSS color name using color distance
  let closestName = 'unknown';
  let closestDistance = Infinity;
  
  for (const [name, colorHex] of cssColorEntries) {
    const targetR = parseInt(colorHex.slice(1, 3), 16);
    const targetG = parseInt(colorHex.slice(3, 5), 16);
    const targetB = parseInt(colorHex.slice(5, 7), 16);
    
    if (isNaN(targetR) || isNaN(targetG) || isNaN(targetB)) continue;
    
    // Calculate Euclidean distance in RGB space
    const distance = Math.sqrt(
      Math.pow(r - targetR, 2) +
      Math.pow(g - targetG, 2) +
      Math.pow(b - targetB, 2)
    );
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestName = name;
    }
  }
  
  return closestName;
}


