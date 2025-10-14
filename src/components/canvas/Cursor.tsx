import { Group, Circle, Text } from 'react-konva';

interface CursorProps {
  x: number;
  y: number;
  email: string;
  color: string;
}

export function Cursor({ x, y, email, color }: CursorProps) {
  return (
    <Group x={x} y={y}>
      {/* Cursor pointer (triangle shape simulated with circle) */}
      <Circle
        x={0}
        y={0}
        radius={6}
        fill={color}
        stroke="white"
        strokeWidth={2}
      />
      
      {/* User label background */}
      <Group x={12} y={8}>
        {/* Label background */}
        <Text
          text={email}
          fontSize={12}
          fontFamily="Arial"
          fill="white"
          padding={4}
          x={0}
          y={0}
          // Add background using rect behind
        />
      </Group>
      
      {/* Label with background effect */}
      <Text
        text={email}
        fontSize={12}
        fontFamily="Arial"
        fill="white"
        padding={4}
        x={12}
        y={8}
        shadowColor={color}
        shadowBlur={8}
        shadowOpacity={0.9}
        shadowOffsetX={0}
        shadowOffsetY={0}
        cornerRadius={4}
      />
    </Group>
  );
}

