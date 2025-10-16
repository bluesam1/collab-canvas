import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Text } from '../src/components/canvas/Text';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';

// Mock Konva components
vi.mock('react-konva', () => ({
  Stage: ({ children }: { children: React.ReactNode }) => <div data-testid="konva-stage">{children}</div>,
  Layer: ({ children }: { children: React.ReactNode }) => <div data-testid="konva-layer">{children}</div>,
  Text: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div data-testid="konva-text" {...props}>{children}</div>,
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

describe('Text Component', () => {
  const mockText = {
    id: 'text-1',
    type: 'text' as const,
    x: 100,
    y: 100,
    text: 'Hello World',
    fontSize: 16,
    fill: 'black',
    createdBy: 'user1',
    createdAt: 123,
    updatedAt: 456,
  };

  const mockOnClick = vi.fn();
  const mockOnDragEnd = vi.fn();
  const mockOnDragMove = vi.fn();
  const mockOnTextChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the text correctly', () => {
    render(
      <Stage>
        <Layer>
          <Text
            text={mockText}
            isSelected={false}
            onClick={mockOnClick}
            onDragEnd={mockOnDragEnd}
            onTextChange={mockOnTextChange}
            mode="pan"
          />
        </Layer>
      </Stage>
    );
    expect(screen.getByTestId('konva-text')).toBeInTheDocument();
    expect(screen.getByTestId('konva-text')).toHaveAttribute('text', 'Hello World');
  });

  it('shows selection styling when selected', () => {
    render(
      <Stage>
        <Layer>
          <Text
            text={mockText}
            isSelected={true}
            onClick={mockOnClick}
            onDragEnd={mockOnDragEnd}
            onTextChange={mockOnTextChange}
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
          <Text
            text={mockText}
            isSelected={false}
            onClick={mockOnClick}
            onDragEnd={mockOnDragEnd}
            onTextChange={mockOnTextChange}
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
          <Text
            text={mockText}
            isSelected={false}
            onClick={mockOnClick}
            onDragEnd={mockOnDragEnd}
            onTextChange={mockOnTextChange}
            mode="pan"
          />
        </Layer>
      </Stage>
    );

    const textElement = screen.getByTestId('konva-text');
    fireEvent.click(textElement);
    expect(mockOnClick).toHaveBeenCalledWith('text-1');
  });

  it('does not call onClick when in text creation mode', () => {
    render(
      <Stage>
        <Layer>
          <Text
            text={mockText}
            isSelected={false}
            onClick={mockOnClick}
            onDragEnd={mockOnDragEnd}
            onTextChange={mockOnTextChange}
            mode="text"
          />
        </Layer>
      </Stage>
    );

    const textElement = screen.getByTestId('konva-text');
    fireEvent.click(textElement);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('renders with correct text properties', () => {
    render(
      <Stage>
        <Layer>
          <Text
            text={mockText}
            isSelected={false}
            onClick={mockOnClick}
            onDragEnd={mockOnDragEnd}
            onTextChange={mockOnTextChange}
            mode="pan"
          />
        </Layer>
      </Stage>
    );

    const textElement = screen.getByTestId('konva-text');
    expect(textElement).toHaveAttribute('text', 'Hello World');
    expect(textElement).toHaveAttribute('fontSize', '16');
    expect(textElement).toHaveAttribute('fill', 'black');
  });

  it('handles drag events correctly', () => {
    render(
      <Stage>
        <Layer>
          <Text
            text={mockText}
            isSelected={true}
            onClick={mockOnClick}
            onDragEnd={mockOnDragEnd}
            onDragMove={mockOnDragMove}
            onTextChange={mockOnTextChange}
            mode="pan"
          />
        </Layer>
      </Stage>
    );

    const textElement = screen.getByTestId('konva-text');
    expect(textElement).toHaveAttribute('draggable', 'true');
  });

  it('enters edit mode when double-clicked', () => {
    render(
      <Stage>
        <Layer>
          <Text
            text={mockText}
            isSelected={false}
            onClick={mockOnClick}
            onDragEnd={mockOnDragEnd}
            onTextChange={mockOnTextChange}
            mode="pan"
          />
        </Layer>
      </Stage>
    );

    const textElement = screen.getByTestId('konva-text');
    fireEvent.doubleClick(textElement);
    
    // Should not call onClick for double-click
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('shows inline editor when in text mode and selected', () => {
    render(
      <Stage>
        <Layer>
          <Text
            text={mockText}
            isSelected={true}
            onClick={mockOnClick}
            onDragEnd={mockOnDragEnd}
            onTextChange={mockOnTextChange}
            mode="text"
          />
        </Layer>
      </Stage>
    );

    // Should show inline editor
    const editor = screen.getByDisplayValue('Hello World');
    expect(editor).toBeInTheDocument();
  });
});
