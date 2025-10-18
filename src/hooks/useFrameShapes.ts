import { useCallback } from 'react';
import type { Shape } from '../types';
import { calculateFramingTransform } from '../utils/canvasHelpers';

interface UseFrameShapesOptions {
  stageRef: React.RefObject<any>; // Konva.Stage
  stageSize: { width: number; height: number };
  onTransformUpdate: (position: { x: number; y: number }, scale: number) => void;
}

/**
 * Hook to frame (zoom and center) a set of shapes in the canvas viewport
 */
export const useFrameShapes = ({
  stageRef,
  stageSize,
  onTransformUpdate,
}: UseFrameShapesOptions) => {
  const frameShapes = useCallback(
    (shapes: Shape[], padding = 150) => {
      const stage = stageRef.current;
      if (!stage || shapes.length === 0) {
        return;
      }

      const transform = calculateFramingTransform(
        shapes,
        stageSize.width,
        stageSize.height,
        padding
      );

      if (!transform) {
        return;
      }

      // Animate to the new transform
      stage.to({
        x: transform.x,
        y: transform.y,
        scaleX: transform.scale,
        scaleY: transform.scale,
        duration: 0.5,
        easing: (window as any).Konva?.Easings?.EaseOut || ((t: number) => t),
      });

      // Update state
      onTransformUpdate({ x: transform.x, y: transform.y }, transform.scale);
    },
    [stageRef, stageSize, onTransformUpdate]
  );

  return { frameShapes };
};

