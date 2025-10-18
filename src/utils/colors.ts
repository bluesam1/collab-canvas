// Standard color palette - 100 colors for use across the application
export const STANDARD_COLORS = [
  // Grayscale (10 colors)
  '#000000', '#1A1A1A', '#333333', '#4D4D4D', '#666666', '#808080', '#999999', '#B3B3B3', '#CCCCCC', '#FFFFFF',
  
  // Reds (10 colors)
  '#FF0000', '#FF3333', '#FF6666', '#FF9999', '#FFCCCC', '#CC0000', '#990000', '#660000', '#330000', '#FFE6E6',
  
  // Oranges (10 colors)
  '#FF8000', '#FF9933', '#FFB366', '#FFCC99', '#FFE6CC', '#CC6600', '#994D00', '#663300', '#331A00', '#FFF0E6',
  
  // Yellows (10 colors)
  '#FFFF00', '#FFFF33', '#FFFF66', '#FFFF99', '#FFFFCC', '#CCCC00', '#999900', '#666600', '#333300', '#FFFFE6',
  
  // Greens (10 colors)
  '#00FF00', '#33FF33', '#66FF66', '#99FF99', '#CCFFCC', '#00CC00', '#009900', '#006600', '#003300', '#E6FFE6',
  
  // Cyans (10 colors)
  '#00FFFF', '#33FFFF', '#66FFFF', '#99FFFF', '#CCFFFF', '#00CCCC', '#009999', '#006666', '#003333', '#E6FFFF',
  
  // Blues (10 colors)
  '#0000FF', '#3333FF', '#6666FF', '#9999FF', '#CCCCFF', '#0000CC', '#000099', '#000066', '#000033', '#E6E6FF',
  
  // Purples (10 colors)
  '#8000FF', '#9933FF', '#B366FF', '#CC99FF', '#E6CCFF', '#6600CC', '#4D0099', '#330066', '#1A0033', '#F0E6FF',
  
  // Magentas (10 colors)
  '#FF00FF', '#FF33FF', '#FF66FF', '#FF99FF', '#FFCCFF', '#CC00CC', '#990099', '#660066', '#330033', '#FFE6FF',
  
  // Pinks (10 colors)
  '#FFC0CB', '#FFB6C1', '#FFA0B4', '#FF8FA3', '#FF7F92', '#FF69B4', '#FF1493', '#DC143C', '#B22222', '#FFE6F0'
];

/**
 * Calculate the contrast color (black or white) for a given background color
 * Uses WCAG luminance calculation for accurate contrast determination
 */
export function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate relative luminance using WCAG formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Check if a color is considered light
 */
export function isLightColor(hexColor: string): boolean {
  return getContrastColor(hexColor) === '#000000';
}
