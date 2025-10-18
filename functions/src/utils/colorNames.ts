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
 * Format color for display in system prompt
 * Shows both name and hex: "blue (#3b82f6)" or just hex if no name match
 */
export function formatColorForAI(hex: string): string {
  const name = getColorName(hex);
  return name ? `${name} (${hex})` : hex;
}


