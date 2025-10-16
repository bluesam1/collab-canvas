import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ShapeSelector } from '../src/components/toolbar/ShapeSelector';

// Mock the useCanvas hook
const mockSetMode = vi.fn();
vi.mock('../src/hooks/useCanvas', () => ({
  useCanvas: () => ({
    mode: 'rectangle',
    setMode: mockSetMode,
  }),
}));

describe('ShapeSelector Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all shape type buttons', () => {
    render(<ShapeSelector />);
    
    expect(screen.getByText('Rectangle')).toBeInTheDocument();
    expect(screen.getByText('Circle')).toBeInTheDocument();
    expect(screen.getByText('Line')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('shows keyboard shortcuts for each shape', () => {
    render(<ShapeSelector />);
    
    expect(screen.getByText('(R)')).toBeInTheDocument();
    expect(screen.getByText('(C)')).toBeInTheDocument();
    expect(screen.getByText('(L)')).toBeInTheDocument();
    expect(screen.getByText('(T)')).toBeInTheDocument();
  });

  it('calls setMode when a shape button is clicked', () => {
    render(<ShapeSelector />);
    
    const circleButton = screen.getByText('Circle');
    fireEvent.click(circleButton);
    
    expect(mockSetMode).toHaveBeenCalledWith('circle');
  });

  it('calls setMode when rectangle button is clicked', () => {
    render(<ShapeSelector />);
    
    const rectangleButton = screen.getByText('Rectangle');
    fireEvent.click(rectangleButton);
    
    expect(mockSetMode).toHaveBeenCalledWith('rectangle');
  });

  it('calls setMode when line button is clicked', () => {
    render(<ShapeSelector />);
    
    const lineButton = screen.getByText('Line');
    fireEvent.click(lineButton);
    
    expect(mockSetMode).toHaveBeenCalledWith('line');
  });

  it('calls setMode when text button is clicked', () => {
    render(<ShapeSelector />);
    
    const textButton = screen.getByText('Text');
    fireEvent.click(textButton);
    
    expect(mockSetMode).toHaveBeenCalledWith('text');
  });

  it('shows correct active state for rectangle mode', () => {
    // Mock rectangle mode as active
    vi.mocked(require('../src/hooks/useCanvas').useCanvas).mockReturnValue({
      mode: 'rectangle',
      setMode: mockSetMode,
    });

    render(<ShapeSelector />);
    
    const rectangleButton = screen.getByText('Rectangle').closest('button');
    expect(rectangleButton).toHaveClass('bg-blue-500');
  });

  it('shows correct active state for circle mode', () => {
    // Mock circle mode as active
    vi.mocked(require('../src/hooks/useCanvas').useCanvas).mockReturnValue({
      mode: 'circle',
      setMode: mockSetMode,
    });

    render(<ShapeSelector />);
    
    const circleButton = screen.getByText('Circle').closest('button');
    expect(circleButton).toHaveClass('bg-blue-500');
  });

  it('shows inactive state for non-active modes', () => {
    // Mock rectangle mode as active
    vi.mocked(require('../src/hooks/useCanvas').useCanvas).mockReturnValue({
      mode: 'rectangle',
      setMode: mockSetMode,
    });

    render(<ShapeSelector />);
    
    const circleButton = screen.getByText('Circle').closest('button');
    const lineButton = screen.getByText('Line').closest('button');
    const textButton = screen.getByText('Text').closest('button');
    
    expect(circleButton).toHaveClass('bg-white');
    expect(lineButton).toHaveClass('bg-white');
    expect(textButton).toHaveClass('bg-white');
  });

  it('displays correct status message for rectangle mode', () => {
    // Mock rectangle mode as active
    vi.mocked(require('../src/hooks/useCanvas').useCanvas).mockReturnValue({
      mode: 'rectangle',
      setMode: mockSetMode,
    });

    render(<ShapeSelector />);
    
    expect(screen.getByText('⬛ Rectangle mode active')).toBeInTheDocument();
  });

  it('displays correct status message for circle mode', () => {
    // Mock circle mode as active
    vi.mocked(require('../src/hooks/useCanvas').useCanvas).mockReturnValue({
      mode: 'circle',
      setMode: mockSetMode,
    });

    render(<ShapeSelector />);
    
    expect(screen.getByText('⭕ Circle mode active')).toBeInTheDocument();
  });

  it('displays correct status message for line mode', () => {
    // Mock line mode as active
    vi.mocked(require('../src/hooks/useCanvas').useCanvas).mockReturnValue({
      mode: 'line',
      setMode: mockSetMode,
    });

    render(<ShapeSelector />);
    
    expect(screen.getByText('➖ Line mode active')).toBeInTheDocument();
  });

  it('displays correct status message for text mode', () => {
    // Mock text mode as active
    vi.mocked(require('../src/hooks/useCanvas').useCanvas).mockReturnValue({
      mode: 'text',
      setMode: mockSetMode,
    });

    render(<ShapeSelector />);
    
    expect(screen.getByText('📝 Text mode active')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    render(<ShapeSelector className="custom-class" />);
    
    const container = screen.getByText('Shape Tools').parentElement;
    expect(container).toHaveClass('custom-class');
  });
});
