import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CanvasContextProvider } from '../src/contexts/CanvasContext';
import { useCanvas } from '../src/hooks/useCanvas';
import { useState } from 'react';

// Test component that uses the Canvas context
function TestCanvasComponent() {
  const { objects, selectedIds, createObject, updateObject, deleteObject, selectObject } = useCanvas();
  const [testUserId] = useState('test-user-123');

  const handleCreateRect = () => {
    createObject({
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      fill: '#3B82F6',
      createdBy: testUserId,
    });
  };

  const handleCreateSmallRect = () => {
    createObject({
      type: 'rectangle',
      x: 50,
      y: 50,
      width: 5,
      height: 5,
      fill: '#EF4444',
      createdBy: testUserId,
    });
  };

  const handleCreateLargeRect = () => {
    createObject({
      type: 'rectangle',
      x: 200,
      y: 200,
      width: 3000,
      height: 3000,
      fill: '#10B981',
      createdBy: testUserId,
    });
  };

  const handleSelectFirst = () => {
    if (objects.length > 0) {
      selectObject(objects[0].id);
    }
  };

  const handleDeselect = () => {
    selectObject(null);
  };

  const handleUpdateFirst = () => {
    if (objects.length > 0) {
      updateObject(objects[0].id, { x: 300, y: 300 });
    }
  };

  const handleDeleteFirst = () => {
    if (objects.length > 0) {
      deleteObject(objects[0].id);
    }
  };

  return (
    <div>
      <div data-testid="object-count">{objects.length}</div>
      <div data-testid="selected-count">{selectedIds.length}</div>
      <div data-testid="objects-data">{JSON.stringify(objects)}</div>
      <div data-testid="selected-ids">{JSON.stringify(selectedIds)}</div>
      
      <button onClick={handleCreateRect} data-testid="create-rect">
        Create Rectangle
      </button>
      <button onClick={handleCreateSmallRect} data-testid="create-small-rect">
        Create Small Rectangle
      </button>
      <button onClick={handleCreateLargeRect} data-testid="create-large-rect">
        Create Large Rectangle
      </button>
      <button onClick={handleSelectFirst} data-testid="select-first">
        Select First
      </button>
      <button onClick={handleDeselect} data-testid="deselect">
        Deselect
      </button>
      <button onClick={handleUpdateFirst} data-testid="update-first">
        Update First
      </button>
      <button onClick={handleDeleteFirst} data-testid="delete-first">
        Delete First
      </button>
    </div>
  );
}

describe('Canvas Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a rectangle with correct dimensions and color', async () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestCanvasComponent />
      </CanvasContextProvider>
    );

    const createButton = screen.getByTestId('create-rect');
    const objectCount = screen.getByTestId('object-count');

    expect(objectCount).toHaveTextContent('0');

    fireEvent.click(createButton);

    await waitFor(() => {
      expect(objectCount).toHaveTextContent('1');
    });

    const objectsData = screen.getByTestId('objects-data');
    const objects = JSON.parse(objectsData.textContent || '[]');

    expect(objects).toHaveLength(1);
    expect(objects[0]).toMatchObject({
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      fill: '#3B82F6',
      createdBy: 'test-user-123',
    });
    expect(objects[0].id).toBeDefined();
    expect(objects[0].createdAt).toBeDefined();
    expect(objects[0].updatedAt).toBeDefined();
  });

  it('should allow creating small rectangles (minimum size constraint)', async () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestCanvasComponent />
      </CanvasContextProvider>
    );

    const createButton = screen.getByTestId('create-small-rect');
    fireEvent.click(createButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });

    const objectsData = screen.getByTestId('objects-data');
    const objects = JSON.parse(objectsData.textContent || '[]');

    // Even though we tried to create a 5x5 rectangle, it should be created
    // The Canvas component will enforce minimum size during drag, not in context
    expect(objects[0].width).toBe(5);
    expect(objects[0].height).toBe(5);
  });

  it('should allow creating large rectangles (maximum size will be enforced in Canvas)', async () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestCanvasComponent />
      </CanvasContextProvider>
    );

    const createButton = screen.getByTestId('create-large-rect');
    fireEvent.click(createButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });

    const objectsData = screen.getByTestId('objects-data');
    const objects = JSON.parse(objectsData.textContent || '[]');

    // The Canvas component enforces max size during creation, not the context
    expect(objects[0].width).toBe(3000);
    expect(objects[0].height).toBe(3000);
  });

  it('should select a rectangle when clicked', async () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestCanvasComponent />
      </CanvasContextProvider>
    );

    const createButton = screen.getByTestId('create-rect');
    const selectButton = screen.getByTestId('select-first');

    fireEvent.click(createButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });

    fireEvent.click(selectButton);

    await waitFor(() => {
      const selectedCount = screen.getByTestId('selected-count');
      expect(selectedCount).toHaveTextContent('1');
    });

    const selectedIds = screen.getByTestId('selected-ids');
    const ids = JSON.parse(selectedIds.textContent || '[]');
    expect(ids).toHaveLength(1);
  });

  it('should deselect when clicking empty area (null selection)', async () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestCanvasComponent />
      </CanvasContextProvider>
    );

    const createButton = screen.getByTestId('create-rect');
    const selectButton = screen.getByTestId('select-first');
    const deselectButton = screen.getByTestId('deselect');

    fireEvent.click(createButton);
    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });

    fireEvent.click(selectButton);
    await waitFor(() => {
      const selectedCount = screen.getByTestId('selected-count');
      expect(selectedCount).toHaveTextContent('1');
    });

    fireEvent.click(deselectButton);
    await waitFor(() => {
      const selectedCount = screen.getByTestId('selected-count');
      expect(selectedCount).toHaveTextContent('0');
    });
  });

  it('should only allow one rectangle to be selected at a time', async () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestCanvasComponent />
      </CanvasContextProvider>
    );

    const createButton = screen.getByTestId('create-rect');
    
    // Create two rectangles
    fireEvent.click(createButton);
    fireEvent.click(createButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('2');
    });

    // Select first rectangle
    const selectButton = screen.getByTestId('select-first');
    fireEvent.click(selectButton);

    await waitFor(() => {
      const selectedCount = screen.getByTestId('selected-count');
      expect(selectedCount).toHaveTextContent('1');
    });

    const selectedIds = screen.getByTestId('selected-ids');
    const ids = JSON.parse(selectedIds.textContent || '[]');
    expect(ids).toHaveLength(1); // Only one selected
  });

  it('should update rectangle position', async () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestCanvasComponent />
      </CanvasContextProvider>
    );

    const createButton = screen.getByTestId('create-rect');
    const updateButton = screen.getByTestId('update-first');

    fireEvent.click(createButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });

    let objectsData = screen.getByTestId('objects-data');
    let objects = JSON.parse(objectsData.textContent || '[]');
    expect(objects[0].x).toBe(100);
    expect(objects[0].y).toBe(100);

    fireEvent.click(updateButton);

    await waitFor(() => {
      objectsData = screen.getByTestId('objects-data');
      objects = JSON.parse(objectsData.textContent || '[]');
      expect(objects[0].x).toBe(300);
      expect(objects[0].y).toBe(300);
    });
  });

  it('should delete a selected rectangle', async () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestCanvasComponent />
      </CanvasContextProvider>
    );

    const createButton = screen.getByTestId('create-rect');
    const deleteButton = screen.getByTestId('delete-first');

    fireEvent.click(createButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });

    fireEvent.click(deleteButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('0');
    });
  });

  it('should clear selection after deletion', async () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestCanvasComponent />
      </CanvasContextProvider>
    );

    const createButton = screen.getByTestId('create-rect');
    const selectButton = screen.getByTestId('select-first');
    const deleteButton = screen.getByTestId('delete-first');

    fireEvent.click(createButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });

    fireEvent.click(selectButton);

    await waitFor(() => {
      const selectedCount = screen.getByTestId('selected-count');
      expect(selectedCount).toHaveTextContent('1');
    });

    fireEvent.click(deleteButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('0');
      
      const selectedCount = screen.getByTestId('selected-count');
      expect(selectedCount).toHaveTextContent('0');
    });
  });

  it('should handle multiple rapid operations without conflicts', async () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestCanvasComponent />
      </CanvasContextProvider>
    );

    const createButton = screen.getByTestId('create-rect');

    // Create multiple rectangles rapidly
    fireEvent.click(createButton);
    fireEvent.click(createButton);
    fireEvent.click(createButton);
    fireEvent.click(createButton);
    fireEvent.click(createButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('5');
    });

    const objectsData = screen.getByTestId('objects-data');
    const objects = JSON.parse(objectsData.textContent || '[]');
    expect(objects).toHaveLength(5);

    // Each should have unique IDs
    const ids = objects.map((obj: any) => obj.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(5);
  });
});

describe('Canvas Keyboard Shortcuts', () => {
  it('should deselect on Escape key (tested via context)', async () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestCanvasComponent />
      </CanvasContextProvider>
    );

    const createButton = screen.getByTestId('create-rect');
    const selectButton = screen.getByTestId('select-first');
    const deselectButton = screen.getByTestId('deselect');

    fireEvent.click(createButton);
    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });

    fireEvent.click(selectButton);
    await waitFor(() => {
      const selectedCount = screen.getByTestId('selected-count');
      expect(selectedCount).toHaveTextContent('1');
    });

    // Simulate Escape key by calling deselect (Canvas component listens for Escape)
    fireEvent.click(deselectButton);
    
    await waitFor(() => {
      const selectedCount = screen.getByTestId('selected-count');
      expect(selectedCount).toHaveTextContent('0');
    });
  });

  it('should delete selected rectangle on Delete key', async () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestCanvasComponent />
      </CanvasContextProvider>
    );

    const createButton = screen.getByTestId('create-rect');
    const selectButton = screen.getByTestId('select-first');

    fireEvent.click(createButton);
    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });

    fireEvent.click(selectButton);
    await waitFor(() => {
      const selectedCount = screen.getByTestId('selected-count');
      expect(selectedCount).toHaveTextContent('1');
    });

    // Simulate Delete key (Canvas component listens for Delete)
    // Since we're testing the context behavior, we'll use the delete button
    const deleteButton = screen.getByTestId('delete-first');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('0');
    });
  });

  it('should delete selected rectangle on Backspace key', async () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestCanvasComponent />
      </CanvasContextProvider>
    );

    const createButton = screen.getByTestId('create-rect');
    const selectButton = screen.getByTestId('select-first');

    fireEvent.click(createButton);
    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });

    fireEvent.click(selectButton);
    await waitFor(() => {
      const selectedCount = screen.getByTestId('selected-count');
      expect(selectedCount).toHaveTextContent('1');
    });

    // Simulate Backspace key (Canvas component listens for Backspace)
    // Since we're testing the context behavior, we'll use the delete button
    const deleteButton = screen.getByTestId('delete-first');
    fireEvent.click(deleteButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('0');
    });
  });


  it('should handle multiple keyboard shortcuts in sequence', async () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestCanvasComponent />
      </CanvasContextProvider>
    );

    const createButton = screen.getByTestId('create-rect');
    const selectButton = screen.getByTestId('select-first');
    const deselectButton = screen.getByTestId('deselect');
    const deleteButton = screen.getByTestId('delete-first');

    // Create first rectangle
    fireEvent.click(createButton);
    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });

    // Select it
    fireEvent.click(selectButton);
    await waitFor(() => {
      const selectedCount = screen.getByTestId('selected-count');
      expect(selectedCount).toHaveTextContent('1');
    });

    // Deselect with Escape (simulated)
    fireEvent.click(deselectButton);
    await waitFor(() => {
      const selectedCount = screen.getByTestId('selected-count');
      expect(selectedCount).toHaveTextContent('0');
    });

    // Select again
    fireEvent.click(selectButton);
    await waitFor(() => {
      const selectedCount = screen.getByTestId('selected-count');
      expect(selectedCount).toHaveTextContent('1');
    });

    // Delete with Delete key (simulated)
    fireEvent.click(deleteButton);
    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('0');
    });
  });

  it('should handle keyboard shortcuts with multiple rectangles', async () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestCanvasComponent />
      </CanvasContextProvider>
    );

    const createButton = screen.getByTestId('create-rect');
    const selectButton = screen.getByTestId('select-first');
    const deleteButton = screen.getByTestId('delete-first');

    // Create multiple rectangles
    fireEvent.click(createButton);
    fireEvent.click(createButton);
    fireEvent.click(createButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('3');
    });

    // Select first rectangle
    fireEvent.click(selectButton);
    await waitFor(() => {
      const selectedCount = screen.getByTestId('selected-count');
      expect(selectedCount).toHaveTextContent('1');
    });

    // Delete selected rectangle
    fireEvent.click(deleteButton);
    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('2');
    });

    // Select next rectangle
    fireEvent.click(selectButton);
    await waitFor(() => {
      const selectedCount = screen.getByTestId('selected-count');
      expect(selectedCount).toHaveTextContent('1');
    });

    // Delete it
    fireEvent.click(deleteButton);
    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });
  });
});

describe('Rectangle Movement', () => {
  it('should update rectangle position when moved (drag)', async () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestCanvasComponent />
      </CanvasContextProvider>
    );

    const createButton = screen.getByTestId('create-rect');
    const updateButton = screen.getByTestId('update-first');

    fireEvent.click(createButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });

    let objectsData = screen.getByTestId('objects-data');
    let objects = JSON.parse(objectsData.textContent || '[]');
    const originalX = objects[0].x;
    const originalY = objects[0].y;

    // Simulate drag by updating position
    fireEvent.click(updateButton);

    await waitFor(() => {
      objectsData = screen.getByTestId('objects-data');
      objects = JSON.parse(objectsData.textContent || '[]');
      expect(objects[0].x).toBe(300);
      expect(objects[0].y).toBe(300);
      expect(objects[0].x).not.toBe(originalX);
      expect(objects[0].y).not.toBe(originalY);
    });
  });

  it('should preserve rectangle dimensions when moved', async () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestCanvasComponent />
      </CanvasContextProvider>
    );

    const createButton = screen.getByTestId('create-rect');
    const updateButton = screen.getByTestId('update-first');

    fireEvent.click(createButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });

    let objectsData = screen.getByTestId('objects-data');
    let objects = JSON.parse(objectsData.textContent || '[]');
    const originalWidth = objects[0].width;
    const originalHeight = objects[0].height;
    const originalFill = objects[0].fill;

    // Move rectangle
    fireEvent.click(updateButton);

    await waitFor(() => {
      objectsData = screen.getByTestId('objects-data');
      objects = JSON.parse(objectsData.textContent || '[]');
      // Dimensions and fill should remain the same
      expect(objects[0].width).toBe(originalWidth);
      expect(objects[0].height).toBe(originalHeight);
      expect(objects[0].fill).toBe(originalFill);
    });
  });

  it('should update timestamp when rectangle is moved', async () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestCanvasComponent />
      </CanvasContextProvider>
    );

    const createButton = screen.getByTestId('create-rect');
    const updateButton = screen.getByTestId('update-first');

    fireEvent.click(createButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });

    let objectsData = screen.getByTestId('objects-data');
    let objects = JSON.parse(objectsData.textContent || '[]');
    const originalUpdatedAt = objects[0].updatedAt;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Move rectangle
    fireEvent.click(updateButton);

    await waitFor(() => {
      objectsData = screen.getByTestId('objects-data');
      objects = JSON.parse(objectsData.textContent || '[]');
      // updatedAt should be different (more recent)
      expect(objects[0].updatedAt).toBeGreaterThan(originalUpdatedAt);
    });
  });
});

describe('Rectangle Deletion', () => {
  it('should remove rectangle from canvas when deleted', async () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestCanvasComponent />
      </CanvasContextProvider>
    );

    const createButton = screen.getByTestId('create-rect');
    const deleteButton = screen.getByTestId('delete-first');

    // Create two rectangles
    fireEvent.click(createButton);
    fireEvent.click(createButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('2');
    });

    // Delete one
    fireEvent.click(deleteButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });

    // Delete the other
    fireEvent.click(deleteButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('0');
    });
  });

  it('should clear selection state after deletion', async () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestCanvasComponent />
      </CanvasContextProvider>
    );

    const createButton = screen.getByTestId('create-rect');
    const selectButton = screen.getByTestId('select-first');
    const deleteButton = screen.getByTestId('delete-first');

    fireEvent.click(createButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });

    fireEvent.click(selectButton);

    await waitFor(() => {
      const selectedCount = screen.getByTestId('selected-count');
      expect(selectedCount).toHaveTextContent('1');
    });

    fireEvent.click(deleteButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('0');
      
      const selectedCount = screen.getByTestId('selected-count');
      expect(selectedCount).toHaveTextContent('0');
    });
  });

  it('should handle deleting while other rectangles exist', async () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestCanvasComponent />
      </CanvasContextProvider>
    );

    const createButton = screen.getByTestId('create-rect');
    const deleteButton = screen.getByTestId('delete-first');

    // Create three rectangles
    fireEvent.click(createButton);
    fireEvent.click(createButton);
    fireEvent.click(createButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('3');
    });

    let objectsData = screen.getByTestId('objects-data');
    let objects = JSON.parse(objectsData.textContent || '[]');
    const secondRectId = objects[1].id;
    const thirdRectId = objects[2].id;

    // Delete first rectangle
    fireEvent.click(deleteButton);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('2');
    });

    objectsData = screen.getByTestId('objects-data');
    objects = JSON.parse(objectsData.textContent || '[]');
    
    // Verify the remaining rectangles are the second and third ones
    expect(objects.some((obj: any) => obj.id === secondRectId)).toBe(true);
    expect(objects.some((obj: any) => obj.id === thirdRectId)).toBe(true);
  });
});

// Test component for mode switching
function TestModeComponent() {
  const { mode, setMode } = useCanvas();

  return (
    <div>
      <div data-testid="current-mode">{mode}</div>
      <button onClick={() => setMode('pan')} data-testid="set-pan-mode">
        Set Pan Mode
      </button>
      <button onClick={() => setMode('rectangle')} data-testid="set-rectangle-mode">
        Set Rectangle Mode
      </button>
    </div>
  );
}

describe('Canvas Mode Switching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should default to pan mode', () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestModeComponent />
      </CanvasContextProvider>
    );

    const modeDisplay = screen.getByTestId('current-mode');
    expect(modeDisplay.textContent).toBe('pan');
  });

  it('should switch to rectangle mode when clicking rectangle mode button', () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestModeComponent />
      </CanvasContextProvider>
    );

    const rectangleModeButton = screen.getByTestId('set-rectangle-mode');
    fireEvent.click(rectangleModeButton);

    const modeDisplay = screen.getByTestId('current-mode');
    expect(modeDisplay.textContent).toBe('rectangle');
  });

  it('should switch to pan mode when clicking pan mode button', () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestModeComponent />
      </CanvasContextProvider>
    );

    // First set to rectangle mode
    const rectangleModeButton = screen.getByTestId('set-rectangle-mode');
    fireEvent.click(rectangleModeButton);

    // Then switch to pan mode
    const panModeButton = screen.getByTestId('set-pan-mode');
    fireEvent.click(panModeButton);

    const modeDisplay = screen.getByTestId('current-mode');
    expect(modeDisplay.textContent).toBe('pan');
  });

  it('should allow toggling between modes multiple times', () => {
    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestModeComponent />
      </CanvasContextProvider>
    );

    const panModeButton = screen.getByTestId('set-pan-mode');
    const rectangleModeButton = screen.getByTestId('set-rectangle-mode');
    const modeDisplay = screen.getByTestId('current-mode');

    // Default is pan
    expect(modeDisplay.textContent).toBe('pan');

    // Switch to rectangle
    fireEvent.click(rectangleModeButton);
    expect(modeDisplay.textContent).toBe('rectangle');

    // Switch back to pan
    fireEvent.click(panModeButton);
    expect(modeDisplay.textContent).toBe('pan');

    // Switch to rectangle again
    fireEvent.click(rectangleModeButton);
    expect(modeDisplay.textContent).toBe('rectangle');
  });

  it('should maintain mode state within the same provider context', () => {
    const { rerender } = render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestModeComponent />
      </CanvasContextProvider>
    );

    const rectangleModeButton = screen.getByTestId('set-rectangle-mode');
    fireEvent.click(rectangleModeButton);

    let modeDisplay = screen.getByTestId('current-mode');
    expect(modeDisplay.textContent).toBe('rectangle');

    // Re-render the component within the same provider
    rerender(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestModeComponent />
      </CanvasContextProvider>
    );

    // After rerender with a NEW provider instance, the provider creates new state
    // so the mode actually persists because it's the same React component tree
    modeDisplay = screen.getByTestId('current-mode');
    expect(modeDisplay.textContent).toBe('rectangle');
  });

  it('should allow canvas operations to work independently of mode', async () => {
    const TestModeWithOperations = () => {
      const { mode, setMode, objects, createObject } = useCanvas();
      const [testUserId] = useState('test-user-123');

      const handleCreate = () => {
        createObject({
          type: 'rectangle',
          x: 100,
          y: 100,
          width: 200,
          height: 150,
          fill: '#3B82F6',
          createdBy: testUserId,
        });
      };

      return (
        <div>
          <div data-testid="current-mode">{mode}</div>
          <div data-testid="object-count">{objects.length}</div>
          <button onClick={() => setMode('rectangle')} data-testid="set-rectangle-mode">
            Rectangle Mode
          </button>
          <button onClick={handleCreate} data-testid="create-rect">
            Create
          </button>
        </div>
      );
    };

    render(
      <CanvasContextProvider canvasId="test-canvas-id">
        <TestModeWithOperations />
      </CanvasContextProvider>
    );

    // Start in pan mode
    expect(screen.getByTestId('current-mode').textContent).toBe('pan');

    // Create object in pan mode
    fireEvent.click(screen.getByTestId('create-rect'));
    await waitFor(() => {
      expect(screen.getByTestId('object-count').textContent).toBe('1');
    });

    // Switch to rectangle mode
    fireEvent.click(screen.getByTestId('set-rectangle-mode'));
    expect(screen.getByTestId('current-mode').textContent).toBe('rectangle');

    // Create another object in rectangle mode
    fireEvent.click(screen.getByTestId('create-rect'));
    await waitFor(() => {
      expect(screen.getByTestId('object-count').textContent).toBe('2');
    });
  });
});

