import { Group, Rect, Circle, Text } from 'react-konva';

interface CursorProps {
  x: number;
  y: number;
  email: string;
  color: string;
  scale?: number;
}

export function Cursor({ x, y, email, color, scale = 1 }: CursorProps) {
  const fontSize = 12;
  const fontFamily = 'Arial, sans-serif';
  const padding = 6;
  const borderRadius = 16;
  
  // Calculate text width to size the pill correctly
  const textLength = email.length;
  const estimatedTextWidth = textLength * 6.8;
  const pillWidth = estimatedTextWidth + padding * 2 + 8;
  const pillHeight = fontSize + padding * 2;
  
  // Counter-scale to keep cursor readable at any zoom level
  const inverseScale = 1 / Math.max(scale, 0.1);
  
  return (
    <Group x={x} y={y} scaleX={inverseScale} scaleY={inverseScale}>
      {/* Simple circle cursor */}
      <Circle
        x={0}
        y={0}
        radius={6}
        fill={color}
        stroke="white"
        strokeWidth={2}
      />
      
      {/* Pill background container for email */}
      <Rect
        x={20}
        y={-10}
        width={pillWidth}
        height={pillHeight}
        fill={color}
        cornerRadius={borderRadius}
        strokeWidth={0}
        shadowColor="rgba(0, 0, 0, 0.3)"
        shadowBlur={4}
        shadowOpacity={0.5}
        shadowOffsetY={2}
      />
      
      {/* Email text - centered in pill */}
      <Text
        text={email}
        fontSize={fontSize}
        fontFamily={fontFamily}
        fill="white"
        x={20 + padding}
        y={-10 + padding / 2}
        width={pillWidth - padding * 2}
        align="center"
        verticalAlign="middle"
        wrap="none"
        ellipsis={false}
      />
    </Group>
  );
}

