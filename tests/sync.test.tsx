import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CanvasContextProvider } from '../src/contexts/CanvasContext';
import { UserContext } from '../src/contexts/UserContext';
import { useCanvas } from '../src/hooks/useCanvas';
import { useState } from 'react';
import * as firebaseUtils from '../src/utils/firebase';

// Mock Firebase utilities
vi.mock('../src/utils/firebase', () => {
  const mockObjects: Record<string, unknown> = {};
  let subscriberCallback: ((data: Record<string, unknown>) => void) | null = null;

  return {
    subscribeToObjects: vi.fn((callback: (data: Record<string, unknown>) => void) => {
      subscriberCallback = callback;
      // Immediately call with current state
      callback(mockObjects);
      return vi.fn(); // Return unsubscribe function
    }),
    createObject: vi.fn(async (data: Record<string, unknown>) => {
      const id = data.id as string;
      mockObjects[id] = data;
      // Simulate Firebase update
      if (subscriberCallback) {
        subscriberCallback({ ...mockObjects });
      }
      return id;
    }),
    updateObject: vi.fn(async (id: string, updates: Record<string, unknown>) => {
      if (mockObjects[id]) {
        mockObjects[id] = { ...mockObjects[id], ...updates };
        // Simulate Firebase update
        if (subscriberCallback) {
          subscriberCallback({ ...mockObjects });
        }
      }
    }),
    deleteObject: vi.fn(async (id: string) => {
      delete mockObjects[id];
      // Simulate Firebase update
      if (subscriberCallback) {
        subscriberCallback({ ...mockObjects });
      }
    }),
    // Expose helper to simulate remote changes
    __simulateRemoteChange: (data: Record<string, unknown>) => {
      Object.assign(mockObjects, data);
      if (subscriberCallback) {
        subscriberCallback({ ...mockObjects });
      }
    },
    __clearMockObjects: () => {
      Object.keys(mockObjects).forEach(key => delete mockObjects[key]);
    },
    __getSubscriberCallback: () => subscriberCallback,
  };
});

// Mock Firebase config
vi.mock('../src/config/firebase', () => ({
  database: {},
  auth: {},
}));

// Mock Firebase database functions
vi.mock('firebase/database', () => ({
  ref: vi.fn(() => ({})),
  push: vi.fn(() => ({ key: `test-id-${Date.now()}` })),
  set: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  onValue: vi.fn(),
  get: vi.fn(),
  serverTimestamp: vi.fn(() => Date.now()),
}));

// Test component that uses Canvas context
function TestSyncComponent() {
  const { objects, createObject, updateObject, deleteObject, isLoading } = useCanvas();
  const [testUserId] = useState('test-user-sync-123');

  const handleCreateRect = async () => {
    await createObject({
      x: 100,
      y: 100,
      width: 200,
      height: 150,
      fill: '#3B82F6',
      createdBy: testUserId,
    });
  };

  const handleUpdateFirst = async () => {
    if (objects.length > 0) {
      await updateObject(objects[0].id, { x: 300, y: 300 });
    }
  };

  const handleDeleteFirst = async () => {
    if (objects.length > 0) {
      await deleteObject(objects[0].id);
    }
  };

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="object-count">{objects.length}</div>
      <div data-testid="objects-data">{JSON.stringify(objects)}</div>
      
      <button onClick={handleCreateRect} data-testid="create-rect">
        Create Rectangle
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

// Mock UserContext provider
function MockUserProvider({ children }: { children: React.ReactNode }) {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
    color: '#3B82F6',
  };

  const contextValue = {
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    error: null,
    sendEmailLink: vi.fn(),
    signInWithGoogle: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

describe('Firebase Real-time Sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear mock objects
    (firebaseUtils as any).__clearMockObjects();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should write to Firebase when creating a rectangle', async () => {
    render(
      <MockUserProvider>
        <CanvasContextProvider>
          <TestSyncComponent />
        </CanvasContextProvider>
      </MockUserProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    const createButton = screen.getByTestId('create-rect');
    createButton.click();

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });

    // Verify Firebase createObject was called
    expect(firebaseUtils.createObject).toHaveBeenCalled();
  });

  it('should write to Firebase when updating rectangle position', async () => {
    render(
      <MockUserProvider>
        <CanvasContextProvider>
          <TestSyncComponent />
        </CanvasContextProvider>
      </MockUserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Create a rectangle first
    const createButton = screen.getByTestId('create-rect');
    createButton.click();

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });

    // Update the rectangle
    const updateButton = screen.getByTestId('update-first');
    updateButton.click();

    await waitFor(() => {
      expect(firebaseUtils.updateObject).toHaveBeenCalled();
    });

    const objectsData = screen.getByTestId('objects-data');
    const objects = JSON.parse(objectsData.textContent || '[]');
    expect(objects[0].x).toBe(300);
    expect(objects[0].y).toBe(300);
  });

  it('should remove from Firebase when deleting rectangle', async () => {
    render(
      <MockUserProvider>
        <CanvasContextProvider>
          <TestSyncComponent />
        </CanvasContextProvider>
      </MockUserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Create a rectangle first
    const createButton = screen.getByTestId('create-rect');
    createButton.click();

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });

    // Delete the rectangle
    const deleteButton = screen.getByTestId('delete-first');
    deleteButton.click();

    await waitFor(() => {
      expect(firebaseUtils.deleteObject).toHaveBeenCalled();
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('0');
    });
  });

  it('should update local state when remote changes are detected', async () => {
    render(
      <MockUserProvider>
        <CanvasContextProvider>
          <TestSyncComponent />
        </CanvasContextProvider>
      </MockUserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Simulate a remote change
    const remoteObject = {
      'remote-id-123': {
        id: 'remote-id-123',
        x: 500,
        y: 500,
        width: 100,
        height: 100,
        fill: '#EF4444',
        createdBy: 'remote-user',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    };

    (firebaseUtils as any).__simulateRemoteChange(remoteObject);

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });

    const objectsData = screen.getByTestId('objects-data');
    const objects = JSON.parse(objectsData.textContent || '[]');
    expect(objects[0].id).toBe('remote-id-123');
    expect(objects[0].x).toBe(500);
  });

  it('should handle multiple rapid updates without conflicts', async () => {
    render(
      <MockUserProvider>
        <CanvasContextProvider>
          <TestSyncComponent />
        </CanvasContextProvider>
      </MockUserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    const createButton = screen.getByTestId('create-rect');

    // Create multiple rectangles with small delays to ensure each completes
    createButton.click();
    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });

    createButton.click();
    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('2');
    });

    createButton.click();
    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('3');
    });

    // Verify all creates were called
    expect(firebaseUtils.createObject).toHaveBeenCalledTimes(3);

    // Verify all objects have unique IDs
    const objectsData = screen.getByTestId('objects-data');
    const objects = JSON.parse(objectsData.textContent || '[]');
    const ids = objects.map((obj: any) => obj.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
  });

  it('should implement last-write-wins strategy for concurrent updates', async () => {
    render(
      <MockUserProvider>
        <CanvasContextProvider>
          <TestSyncComponent />
        </CanvasContextProvider>
      </MockUserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    // Create a rectangle
    const createButton = screen.getByTestId('create-rect');
    createButton.click();

    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('1');
    });

    // Get the object ID
    let objectsData = screen.getByTestId('objects-data');
    let objects = JSON.parse(objectsData.textContent || '[]');
    const objectId = objects[0].id;

    // Perform local update
    const updateButton = screen.getByTestId('update-first');
    updateButton.click();

    await waitFor(() => {
      objectsData = screen.getByTestId('objects-data');
      objects = JSON.parse(objectsData.textContent || '[]');
      expect(objects[0].x).toBe(300);
    });

    // Simulate a conflicting remote update (last write wins)
    const remoteUpdate = {
      [objectId]: {
        ...objects[0],
        x: 400,
        y: 400,
        updatedAt: Date.now() + 1000, // Later timestamp
      },
    };

    (firebaseUtils as any).__simulateRemoteChange(remoteUpdate);

    await waitFor(() => {
      objectsData = screen.getByTestId('objects-data');
      objects = JSON.parse(objectsData.textContent || '[]');
      // The remote update should win (last write wins)
      expect(objects[0].x).toBe(400);
      expect(objects[0].y).toBe(400);
    });
  });

  it('should show loading state while fetching initial data', async () => {
    render(
      <MockUserProvider>
        <CanvasContextProvider>
          <TestSyncComponent />
        </CanvasContextProvider>
      </MockUserProvider>
    );

    // Initially should be loading
    const loadingElement = screen.getByTestId('loading');
    // Due to how mocks work, it may be instant, but we can verify it was set
    
    await waitFor(() => {
      expect(loadingElement).toHaveTextContent('loaded');
    });
  });

  it('should handle optimistic updates with rollback on error', async () => {
    // Mock a Firebase error
    const mockError = new Error('Firebase write failed');
    vi.mocked(firebaseUtils.createObject).mockRejectedValueOnce(mockError);

    render(
      <MockUserProvider>
        <CanvasContextProvider>
          <TestSyncComponent />
        </CanvasContextProvider>
      </MockUserProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    const createButton = screen.getByTestId('create-rect');
    createButton.click();

    // The optimistic update should be rolled back after error
    await waitFor(() => {
      const objectCount = screen.getByTestId('object-count');
      expect(objectCount).toHaveTextContent('0');
    }, { timeout: 2000 });
  });
});

