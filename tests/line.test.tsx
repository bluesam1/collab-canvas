import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Line } from '../src/components/canvas/Line';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';

// Mock Konva components
vi.mock('react-konva', () => ({
  Stage: ({ children }: { children: React.ReactNode }) => <div data-testid="konva-stage">{children}</div>,
  Layer: ({ children }: { children: React.ReactNode }) => <div data-testid="konva-layer">{children}</div>,
  Line: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div data-testid="konva-line" {...props}>{children}</div>,
  Transformer: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div data-testid="konva-transformer" {...props}>{children}</div>,
}));

// Mock Konva for methods like getPointerPosition, getStage, etc.
vi.mock('konva', () => ({
  default: {
    Stage: vi.fn(() => ({
      getPointerPosition: vi.fn(() => ({ x: 100, y: 100 })),
      x: vi.fn(() => 0),
      y: vi.fn(() => 0),
      scaleX: vi.fn(() => 1),
      scaleY: vi.fn(() => 1),
      to: vi.fn(),
    })),
    Transformer: vi.fn(() => ({
      nodes: vi.fn(),
      getLayer: vi.fn(() => ({
        batchDraw: vi.fn(),
      })),
    })),
    Easings: { EaseOut: 'EaseOut' },
  },
}));

describe('Line Component', () => {
  const mockLine = {
    id: 'line-1',
    type: 'line' as const,
    x1: 50,
    y1: 50,
    x2: 150,
    y2: 150,
    stroke: 'blue',
    strokeWidth: 3,
    createdBy: 'user1',
    createdAt: 123,
    updatedAt: 456,
  };

  const mockOnClick = vi.fn();
  const mockOnDragEnd = vi.fn();
  const mockOnDragMove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the line correctly', () => {
    render(
      <Stage>
        <Layer>
          <Line
            line={mockLine}
            isSelected={false}
            onClick={mockOnClick}
            onDragEnd={mockOnDragEnd}
            mode="pan"
          />
        </Layer>
      </Stage>
    );
    expect(screen.getByTestId('konva-line')).toBeInTheDocument();
    expect(screen.getByTestId('konva-line')).toHaveAttribute('stroke', 'blue');
  });

  it('shows selection styling when selected', () => {
    render(
      <Stage>
        <Layer>
          <Line
            line={mockLine}
            isSelected={true}
            onClick={mockOnClick}
            onDragEnd={mockOnDragEnd}
            mode="pan"
          />
        </Layer>
      </Stage>
    );
    
    expect(screen.getByTestId('konva-transformer')).toBeInTheDocument();
  });

  it('does not show transformer when not selected', () => {
    render(
      <Stage>
        <Layer>
          <Line
            line={mockLine}
            isSelected={false}
            onClick={mockOnClick}
            onDragEnd={mockOnDragEnd}
            mode="pan"
          />
        </Layer>
      </Stage>
    );
    
    expect(screen.queryByTestId('konva-transformer')).not.toBeInTheDocument();
  });

  it('handles click events correctly', () => {
    render(
      <Stage>
        <Layer>
          <Line
            line={mockLine}
            isSelected={false}
            onClick={mockOnClick}
            onDragEnd={mockOnDragEnd}
            mode="pan"
          />
        </Layer>
      </Stage>
    );

    const lineElement = screen.getByTestId('konva-line');
    fireEvent.click(lineElement);
    expect(mockOnClick).toHaveBeenCalledWith('line-1');
  });

  it('does not call onClick when in line creation mode', () => {
    render(
      <Stage>
        <Layer>
          <Line
            line={mockLine}
            isSelected={false}
            onClick={mockOnClick}
            onDragEnd={mockOnDragEnd}
            mode="line"
          />
        </Layer>
      </Stage>
    );

    const lineElement = screen.getByTestId('konva-line');
    fireEvent.click(lineElement);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('renders with correct line properties', () => {
    render(
      <Stage>
        <Layer>
          <Line
            line={mockLine}
            isSelected={false}
            onClick={mockOnClick}
            onDragEnd={mockOnDragEnd}
            mode="pan"
          />
        </Layer>
      </Stage>
    );

    const lineElement = screen.getByTestId('konva-line');
    expect(lineElement).toHaveAttribute('stroke', 'blue');
    expect(lineElement).toHaveAttribute('strokeWidth', '3');
  });

  it('handles drag events correctly', () => {
    render(
      <Stage>
        <Layer>
          <Line
            line={mockLine}
            isSelected={true}
            onClick={mockOnClick}
            onDragEnd={mockOnDragEnd}
            onDragMove={mockOnDragMove}
            mode="pan"
          />
        </Layer>
      </Stage>
    );

    const lineElement = screen.getByTestId('konva-line');
    expect(lineElement).toHaveAttribute('draggable', 'true');
  });
});
