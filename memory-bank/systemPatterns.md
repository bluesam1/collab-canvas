# System Patterns

## Architecture Overview

### High-Level Structure
```
React App (Browser)
├── Routing (React Router)
│   ├── / → Canvas List Page
│   └── /canvas/:id → Canvas Editor Page
├── Context Providers (State Management)
│   ├── UserContext (Auth & User Data)
│   ├── CanvasListContext (Canvas Management)
│   ├── CanvasContext (Canvas-specific Objects)
│   ├── PresenceContext (Canvas-specific Users)
│   └── ToastContext (Notifications)
├── Components (UI)
│   ├── Canvas List (Cards, Modals, Search)
│   ├── Canvas Editor (Konva Stage, Shapes, Cursors)
│   ├── Toolbar (Mode buttons, Colors, Delete)
│   └── Common (Toast, Spinner, Dialogs)
└── Firebase Backend
    ├── Authentication (Email Link + Google)
    ├── Realtime Database (Objects, Presence, Canvases)
    └── Hosting (Deployment)
```

## Key Technical Decisions

### 1. State Management Pattern
**Decision**: React Context API (no Redux/Zustand)
**Rationale**: 
- Simple state needs (no complex reducers required)
- Built-in to React (no extra dependencies)
- Context per concern (separation of responsibilities)
- Good performance with proper optimization

**Pattern**:
```
Context → Hook → Component
CanvasContext → useCanvas() → Canvas.tsx
```

### 2. Real-Time Synchronization
**Decision**: Firebase Realtime Database with optimistic updates
**Rationale**:
- Sub-100ms latency for real-time sync
- Built-in presence system
- Simple WebSocket-based protocol
- Automatic reconnection handling

**Pattern**:
```
User Action → Optimistic Local Update → Firebase Write
                     ↓
Firebase Listener → State Update → UI Re-render
```

**Error Handling**: If Firebase write fails, listener reverts to correct state

### 3. Canvas Rendering
**Decision**: Konva.js (not raw Canvas API)
**Rationale**:
- Scene graph abstraction (easier than raw canvas)
- Built-in drag/drop and events
- Excellent performance (60 FPS with 100+ shapes)
- React-Konva wrapper for React integration

**Pattern**:
```
State (objects array) → map() → Rectangle components → Konva renders
```

### 4. Canvas Isolation
**Decision**: Canvas ID in Firebase paths
**Rationale**:
- Each canvas has separate object and presence data
- URL-based routing enables direct sharing
- Security rules can enforce per-canvas access
- Scales to many canvases without conflicts

**Firebase Structure**:
```
/canvases/{canvasId}           - Canvas metadata
/objects/{canvasId}/{objectId} - Canvas objects
/presence/{canvasId}/{userId}  - Canvas presence
```

### 5. Conflict Resolution
**Decision**: Last-write-wins with Firebase server timestamps
**Rationale**:
- Simple to implement and understand
- No complex operational transforms needed
- Good enough for MVP use cases
- Rare conflicts with optimistic updates

**Implementation**:
- Every write includes `updatedAt: Date.now()`
- No client-side conflict detection
- Firebase overwrites previous value

### 6. Cursor Throttling
**Decision**: 50ms throttle with trailing edge (setTimeout debounce)
**Rationale**:
- Reduce Firebase writes (cost optimization)
- Maintain smooth cursor experience
- 20 FPS cursor updates still feels real-time

**Implementation**:
```typescript
const throttledUpdate = setTimeout(() => {
  updateCursorInFirebase(position);
}, 50);
```

### 7. User Color Assignment
**Decision**: 5-color palette cycling by join order
**Rationale**:
- Simple to implement
- Visually distinct colors
- Handles 6+ users gracefully (colors repeat)
- Consistent color per user per session

**Pattern**:
```typescript
const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
const userColor = colors[userIndex % colors.length];
```

## Component Relationships

### Context Hierarchy
```
UserContextProvider (top-level, app-wide)
  └── AuthProvider (gates authenticated content)
      └── ToastProvider (app-wide notifications)
          └── Router
              └── CanvasListProvider (canvas list page)
                  OR
                  CanvasContextProvider (per canvas)
                    └── PresenceContextProvider (per canvas)
```

### Data Flow Patterns

#### Creating a Shape
```
User drags on canvas
  → Canvas.tsx mouseUp handler
  → useCanvas().createObject()
  → CanvasContext optimistic update (local state)
  → Firebase write to /objects/{canvasId}/{objectId}
  → Firebase listener triggers on all clients
  → CanvasContext updates from listener
  → All clients re-render with new shape
```

#### Cursor Tracking
```
User moves mouse
  → Canvas.tsx mousemove handler (throttled 50ms)
  → usePresence().updateCursor()
  → Firebase write to /presence/{canvasId}/{userId}/cursor
  → Firebase listener triggers on other clients
  → PresenceContext updates cursors map
  → Canvas renders Cursor components for remote users
```

#### Canvas Sharing
```
User copies canvas URL
  → New user opens URL
  → Router extracts canvasId from path
  → CanvasEditor fetches canvas metadata
  → If canvas exists and user authenticated:
      → Update /canvases/{canvasId}/lastOpenedBy/{userId}
      → Canvas added to user's accessible list
      → Initialize CanvasContext and PresenceContext
      → Render canvas with all existing objects
```

## Design Patterns in Use

### 1. Provider Pattern
- All contexts use Provider pattern
- Centralized state management
- Easy to test and mock

### 2. Custom Hooks
- Each context has a corresponding hook
- Encapsulates context access logic
- Throws error if used outside provider

### 3. Optimistic Updates
- Update local state immediately
- Write to Firebase asynchronously
- Listener reverts on failure
- Improves perceived performance

### 4. Compound Components
- Toolbar contains multiple sub-components
- Canvas List contains cards, modals
- Each component is independently testable

### 5. Render Props / Children Pattern
- Context providers wrap children
- AuthProvider conditionally renders based on auth state
- ErrorBoundary wraps entire app

## Firebase Security Patterns

### Authentication-Required Reads/Writes
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

### Owner-Only Writes
```json
{
  "canvases": {
    "$canvasId": {
      ".write": "data.child('ownerId').val() === auth.uid || !data.exists()"
    }
  }
}
```

### User-Specific Writes
```json
{
  "presence": {
    "$canvasId": {
      "$uid": {
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

## Performance Optimizations

### 1. Memoization
- Konva components use React.memo
- Expensive computations cached
- Prevent unnecessary re-renders

### 2. Throttling
- Cursor updates throttled to 50ms
- Search input debounced to 300ms
- Reduces Firebase operations

### 3. Listener Cleanup
- All Firebase listeners cleaned up on unmount
- Prevents memory leaks
- Essential for canvas switching

### 4. Optimistic Updates
- Immediate feedback without waiting for server
- Reduces perceived latency
- Improves user experience

### 5. Canvas Scoping
- Only load objects for current canvas
- Only track presence for current canvas
- Reduces memory footprint

## Testing Strategy

### Testing Framework & Organization
- **Framework**: Vitest (not Jest) for Vite-native performance
- **Location**: All tests in `tests/` directory (NOT alongside components)
- **Naming**: `tests/[component-name].test.tsx` format
- **Mocking**: Use `vi.mock()` instead of `jest.mock()`
- **Assertions**: Use `@testing-library/jest-dom` matchers

### Unit Tests
- Context logic (state updates, CRUD operations)
- Utility functions (colors, Firebase helpers)
- Component interactions
- Shape components (Circle, Line, Text)
- Toolbar and UI components

### Integration Tests
- Auth flow (email link, Google)
- Canvas operations (create, move, delete)
- Real-time sync (optimistic updates, listener updates)
- Presence system (join, leave, cursor tracking)
- Multi-shape type operations

### Manual Tests
- Multi-browser collaboration
- Network disconnection scenarios
- Performance under load (100+ shapes)
- Cross-browser compatibility
- Shape creation and editing workflows

## Error Handling Strategy

### Firebase Errors
- Connection errors → Show toast, auto-retry
- Permission errors → Show error page, redirect
- Write failures → Revert optimistic update

### Component Errors
- ErrorBoundary catches React errors
- Shows friendly error message
- Logs error for debugging

### User Input Validation
- Canvas names validated (not empty after trim)
- Shape sizes constrained (10×10 to 2000×2000)
- Empty clicks (no drag) ignored

## Deployment Architecture

### Build Process
1. TypeScript compilation
2. Vite bundling (optimized production build)
3. Environment variables baked in at build time
4. Output to `dist/` directory

### Firebase Hosting
- Static file hosting on Firebase CDN
- Automatic SSL/HTTPS
- Security rules deployed separately
- Single command deployment: `firebase deploy`

### Environment Configuration
- `.env` file for local development
- Environment variables prefixed with `VITE_`
- Firebase config loaded at runtime
- No secrets in client code (Firebase config is public)

