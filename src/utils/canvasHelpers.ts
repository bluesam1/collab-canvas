/**
 * Canvas Helper Functions
 * Utilities for canvas operations like calculating bounding boxes and framing shapes
 */

import type { Shape } from '../types';

/**
 * Calculate bounding box for a set of shapes
 */
export const calculateBoundingBox = (shapes: Shape[]): { 
  minX: number; 
  minY: number; 
  maxX: number; 
  maxY: number; 
  width: number; 
  height: number;
  centerX: number;
  centerY: number;
} | null => {
  if (shapes.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  shapes.forEach((shape) => {
    let shapeMinX: number, shapeMinY: number, shapeMaxX: number, shapeMaxY: number;

    switch (shape.type) {
      case 'rectangle':
        shapeMinX = shape.x;
        shapeMinY = shape.y;
        shapeMaxX = shape.x + shape.width;
        shapeMaxY = shape.y + shape.height;
        break;

      case 'circle':
        shapeMinX = shape.centerX - shape.radius;
        shapeMinY = shape.centerY - shape.radius;
        shapeMaxX = shape.centerX + shape.radius;
        shapeMaxY = shape.centerY + shape.radius;
        break;

      case 'line':
        // Approximate line bounds (doesn't account for rotation perfectly)
        shapeMinX = Math.min(shape.x, shape.x + shape.width);
        shapeMinY = shape.y;
        shapeMaxX = Math.max(shape.x, shape.x + shape.width);
        shapeMaxY = shape.y;
        break;

      case 'text':
        // Approximate text bounds (actual bounds depend on rendered text)
        shapeMinX = shape.x;
        shapeMinY = shape.y - shape.fontSize;
        shapeMaxX = shape.x + (shape.text.length * shape.fontSize * 0.6); // Rough estimate
        shapeMaxY = shape.y;
        break;

      default:
        return;
    }

    minX = Math.min(minX, shapeMinX);
    minY = Math.min(minY, shapeMinY);
    maxX = Math.max(maxX, shapeMaxX);
    maxY = Math.max(maxY, shapeMaxY);
  });

  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = minX + width / 2;
  const centerY = minY + height / 2;

  return { minX, minY, maxX, maxY, width, height, centerX, centerY };
};

/**
 * Calculate optimal stage position and scale to frame shapes
 */
export const calculateFramingTransform = (
  shapes: Shape[],
  stageWidth: number,
  stageHeight: number,
  padding: number = 100
): { x: number; y: number; scale: number } | null => {
  const bbox = calculateBoundingBox(shapes);
  if (!bbox) return null;

  // Calculate scale to fit with padding
  const scaleX = stageWidth / (bbox.width + padding * 2);
  const scaleY = stageHeight / (bbox.height + padding * 2);
  const scale = Math.min(scaleX, scaleY, 1); // Don't zoom in beyond 1:1

  // Calculate position to center the content
  const x = stageWidth / 2 - bbox.centerX * scale;
  const y = stageHeight / 2 - bbox.centerY * scale;

  return { x, y, scale };
};

/**
 * Get the center point of a shape
 */
export const getShapeCenter = (shape: Shape): { x: number; y: number } => {
  switch (shape.type) {
    case 'rectangle':
      return {
        x: shape.x + shape.width / 2,
        y: shape.y + shape.height / 2,
      };

    case 'circle':
      return {
        x: shape.centerX,
        y: shape.centerY,
      };

    case 'line':
      return {
        x: shape.x + shape.width / 2,
        y: shape.y,
      };

    case 'text':
      return {
        x: shape.x + (shape.text.length * shape.fontSize * 0.3), // Rough horizontal center
        y: shape.y - shape.fontSize / 2,
      };

    default:
      return { x: 0, y: 0 };
  }
};

/**
 * Point-in-polygon test using ray casting algorithm
 * Returns true if point (x, y) is inside the polygon defined by points
 */
export const isPointInPolygon = (
  point: { x: number; y: number },
  polygon: { x: number; y: number }[]
): boolean => {
  if (polygon.length < 3) return false;

  let inside = false;
  const { x, y } = point;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
};


