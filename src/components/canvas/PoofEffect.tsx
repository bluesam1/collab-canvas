import { useEffect, useState } from 'react';
import { Circle as KonvaCircle } from 'react-konva';

interface PoofEffectProps {
  x: number;
  y: number;
  scale?: number;
  onComplete: () => void;
}

export const PoofEffect = ({ x, y, scale = 1, onComplete }: PoofEffectProps) => {
  const [opacity, setOpacity] = useState(0.8);

  useEffect(() => {
    const duration = 150; // Much shorter - 150ms
    const startTime = Date.now();
    let animationFrameId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Simple fade out
      setOpacity(0.8 * (1 - progress));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [onComplete]);

  // Scale the radius inversely with zoom so it appears consistent size on screen
  const screenRadius = 30 / scale;

  return (
    <KonvaCircle
      x={x}
      y={y}
      radius={screenRadius}
      fill="#9CA3AF"
      opacity={opacity}
      listening={false}
    />
  );
};

