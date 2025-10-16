import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Circle } from '../src/components/canvas/Circle';
import type { Circle as CircleType } from '../src/types';

// Mock Konva components
vi.mock('react-konva', () => ({
  Stage: ({ children }: { children: React.ReactNode }) => <div data-testid="konva-stage">{children}</div>,
  Layer: ({ children }: { children: React.ReactNode }) => <div data-testid="konva-layer">{children}</div>,
  Circle: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => <div data-testid="konva-circle" {...props}>{children}</div>,
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
    Circle: vi.fn(() => ({
      nodes: vi.fn(),
      getLayer: vi.fn(() => ({
        batchDraw: vi.fn(),
      })),
    })),
    Easings: { EaseOut: 'EaseOut' },
  },
}));

const mockCircle: CircleType = {
  id: 'test-circle-1',
  type: 'circle',
  centerX: 100,
  centerY: 100,
  radius: 50,
  fill: '#ff0000',
  createdBy: 'user-1',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const defaultProps = {
  circle: mockCircle,
  isSelected: false,
  onClick: vi.fn(),
  onDragEnd: vi.fn(),
  onDragMove: vi.fn(),
  mode: 'pan' as const,
};

describe('Circle Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders circle with correct properties', () => {
    render(<Circle {...defaultProps} />);

    const circleElement = screen.getByTestId('konva-circle');
    expect(circleElement).toBeInTheDocument();
  });

  it('shows selection styling when selected', () => {
    render(<Circle {...defaultProps} isSelected={true} />);

    const circleElement = screen.getByTestId('konva-circle');
    expect(circleElement).toHaveAttribute('stroke', '#000000');
    expect(circleElement).toHaveAttribute('strokeWidth', '2');
  });

  it('does not show selection styling when not selected', () => {
    render(<Circle {...defaultProps} isSelected={false} />);

    const circleElement = screen.getByTestId('konva-circle');
    expect(circleElement).not.toHaveAttribute('strokeWidth');
  });

  it('shows transformer when selected', () => {
    render(<Circle {...defaultProps} isSelected={true} />);

    const transformerElement = screen.getByTestId('konva-transformer');
    expect(transformerElement).toBeInTheDocument();
  });

  it('does not show transformer when not selected', () => {
    render(<Circle {...defaultProps} isSelected={false} />);

    const transformerElement = screen.queryByTestId('konva-transformer');
    expect(transformerElement).not.toBeInTheDocument();
  });

  it('handles click events correctly', () => {
    const mockOnClick = vi.fn();
    render(<Circle {...defaultProps} onClick={mockOnClick} mode="pan" />);

    const circleElement = screen.getByTestId('konva-circle');
    // Simulate click
    circleElement.click();
    
    expect(mockOnClick).toHaveBeenCalledWith('test-circle-1');
  });

  it('does not call onClick when in circle creation mode', () => {
    const mockOnClick = vi.fn();
    render(<Circle {...defaultProps} onClick={mockOnClick} mode="circle" />);

    const circleElement = screen.getByTestId('konva-circle');
    // Simulate click
    circleElement.click();
    
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('renders with correct circle properties', () => {
    render(<Circle {...defaultProps} />);

    const circleElement = screen.getByTestId('konva-circle');
    expect(circleElement).toHaveAttribute('x', '100');
    expect(circleElement).toHaveAttribute('y', '100');
    expect(circleElement).toHaveAttribute('radius', '50');
    expect(circleElement).toHaveAttribute('fill', '#ff0000');
  });

  it('handles drag events correctly', () => {
    const mockOnDragEnd = vi.fn();
    const mockOnDragMove = vi.fn();
    
    render(
      <Circle 
        {...defaultProps} 
        onDragEnd={mockOnDragEnd}
        onDragMove={mockOnDragMove}
        isSelected={true}
      />
    );

    const circleElement = screen.getByTestId('konva-circle');
    expect(circleElement).toHaveAttribute('draggable', 'true');
  });
});
