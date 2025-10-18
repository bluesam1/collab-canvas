import { useEffect, useState } from 'react';
import { Circle as KonvaCircle } from 'react-konva';

interface PoofEffectProps {
  x: number;
  y: number;
  onComplete: () => void;
}

export const PoofEffect = ({ x, y, onComplete }: PoofEffectProps) => {
  const [scale, setScale] = useState(0);
  const [opacity, setOpacity] = useState(0.6);

  useEffect(() => {
    const duration = 300; // 300ms - quick and simple
    const startTime = Date.now();
    let animationFrameId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out animation for smooth expansion
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      // Expand from 0 to 1.5x scale
      setScale(easeOut * 1.5);
      
      // Fade out (starts at 0.6, goes to 0)
      setOpacity(0.6 * (1 - progress));

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

  return (
    <KonvaCircle
      x={x}
      y={y}
      radius={40 * scale}
      fill="#9CA3AF"
      opacity={opacity}
      listening={false}
    />
  );
};

