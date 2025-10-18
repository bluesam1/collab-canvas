# Coordinate System Documentation

## Overview

CollabCanvas uses a **world coordinate system** for shape positioning and a **screen coordinate system** for user interactions. The transformation between these systems accounts for **panning** (stage position) and **zooming** (scale).

## Coordinate Systems

### 1. World Coordinates
- **Range**: 0 to 5000 in both X and Y directions
- **Canvas Size**: 5000×5000 pixels
- **Usage**: All shapes are positioned using world coordinates
- **Persistence**: Stored in Firebase and synced across clients

### 2. Screen Coordinates
- **Range**: Based on browser window size (e.g., 1920×1080)
- **Origin**: Top-left corner of the browser window
- **Usage**: Mouse events, pointer positions, viewport calculations
- **Dynamic**: Changes with window resize

## Coordinate Transformations

### Screen to World
Converts screen coordinates (e.g., mouse position) to world coordinates (e.g., shape position).

**Formula:**
```
worldX = (screenX - stageX) / scale
worldY = (screenY - stageY) / scale
```

**Where:**
- `screenX`, `screenY`: Coordinates in browser window space
- `stageX`, `stageY`: Current pan offset of the canvas (Konva stage position)
- `scale`: Current zoom level (1.0 = 100%, 0.5 = 50%, 2.0 = 200%)

**Implementation:**
```typescript
const screenToWorld = (screenX: number, screenY: number): { x: number; y: number } => {
  const stage = stageRef.current;
  if (!stage) return { x: screenX, y: screenY };
  
  const worldX = (screenX - stage.x()) / stage.scaleX();
  const worldY = (screenY - stage.y()) / stage.scaleY();
  
  return { x: worldX, y: worldY };
};
```

### World to Screen
Converts world coordinates (e.g., shape position) to screen coordinates (e.g., where to render).

**Formula:**
```
screenX = worldX * scale + stageX
screenY = worldY * scale + stageY
```

**Note:** Konva handles this transformation automatically when rendering shapes.

## Viewport Center Calculation

The **viewport center** is critical for AI operations, as it represents what the user is currently viewing.

**Implementation** (`src/pages/CanvasEditorPage.tsx`):
```typescript
const getViewportCenter = () => {
  // Get screen center
  const screenCenterX = window.innerWidth / 2;
  const screenCenterY = window.innerHeight / 2;
  
  // Convert to world coordinates
  const scale = viewportTransform.scale || 1;
  const worldCenterX = (screenCenterX - viewportTransform.x) / scale;
  const worldCenterY = (screenCenterY - viewportTransform.y) / scale;
  
  // Clamp to canvas bounds (0-5000)
  const clampedX = Math.max(0, Math.min(5000, worldCenterX));
  const clampedY = Math.max(0, Math.min(5000, worldCenterY));
  
  return { x: clampedX, y: clampedY };
};
```

### Safety Features:
1. **Division by zero protection**: `scale || 1` ensures scale is never zero
2. **Bounds clamping**: Ensures viewport center stays within canvas bounds (0-5000)
3. **Real-time sync**: `viewportTransform` state updates whenever user pans/zooms

## Pan (Stage Position)

**Positive values** mean the canvas has moved right/down:
- `stageX = 200`: Canvas panned 200px to the right → world origin appears 200px right of screen origin
- `stageY = 100`: Canvas panned 100px down → world origin appears 100px below screen origin

**Negative values** mean the canvas has moved left/up:
- `stageX = -200`: Canvas panned 200px to the left
- `stageY = -100`: Canvas panned 100px up

## Zoom (Scale)

**Scale values**:
- `scale < 1.0`: Zoomed out (e.g., 0.5 = 50%, see more of canvas)
- `scale = 1.0`: Default zoom (100%, 1:1 pixel mapping)
- `scale > 1.0`: Zoomed in (e.g., 2.0 = 200%, see less of canvas but larger)

**Range**: 0.1 (10%) to 5.0 (500%)

## Usage Examples

### Example 1: Creating a Shape at Mouse Click
```typescript
const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
  const stage = stageRef.current;
  if (!stage) return;
  
  const screenPos = stage.getPointerPosition();
  if (!screenPos) return;
  
  // Convert to world coordinates
  const worldPos = screenToWorld(screenPos.x, screenPos.y);
  
  // Create shape at world position
  createObject({
    type: 'rectangle',
    x: worldPos.x,
    y: worldPos.y,
    width: 100,
    height: 100,
    fill: '#3b82f6',
  });
};
```

### Example 2: AI Shape Placement at Viewport Center
```typescript
// Get where the user is looking (viewport center in world coordinates)
const viewportCenter = getViewportCenter();

// AI creates shape at this position
await createObject({
  type: 'circle',
  centerX: viewportCenter.x,
  centerY: viewportCenter.y,
  radius: 50,
  fill: 'red',
});
```

### Example 3: Pan and Zoom
```typescript
// User scrolls to zoom
const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
  const stage = stageRef.current;
  const pointer = stage.getPointerPosition();
  
  // Calculate new scale
  const oldScale = stage.scaleX();
  const newScale = oldScale + (e.evt.deltaY > 0 ? -0.1 : 0.1);
  
  // Calculate new position to zoom towards cursor
  const mousePointTo = {
    x: (pointer.x - stage.x()) / oldScale,
    y: (pointer.y - stage.y()) / oldScale,
  };
  
  const newPos = {
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  };
  
  // Apply transformation
  setStagePos(newPos);
  setStageScale(newScale);
};
```

## Common Pitfalls

### ❌ Wrong: Using Screen Coordinates for Shape Position
```typescript
// BAD: Mouse position is in screen coordinates
const screenPos = stage.getPointerPosition();
createObject({ x: screenPos.x, y: screenPos.y }); // Wrong!
```

### ✅ Correct: Convert to World Coordinates First
```typescript
// GOOD: Convert to world coordinates
const screenPos = stage.getPointerPosition();
const worldPos = screenToWorld(screenPos.x, screenPos.y);
createObject({ x: worldPos.x, y: worldPos.y }); // Correct!
```

### ❌ Wrong: Forgetting Scale in Calculations
```typescript
// BAD: Doesn't account for zoom
const worldX = screenX - stageX; // Missing division by scale
```

### ✅ Correct: Always Account for Scale
```typescript
// GOOD: Full transformation
const worldX = (screenX - stageX) / scale;
```

## Viewport State Management

The viewport state is maintained in `CanvasEditorPage.tsx`:

```typescript
const [viewportTransform, setViewportTransform] = useState({ 
  x: 0,    // Initial pan: no offset
  y: 0, 
  scale: 1 // Initial zoom: 100%
});

// Updated whenever user pans or zooms
const handleViewportChange = useCallback((x: number, y: number, scale: number) => {
  setViewportTransform({ x, y, scale });
}, []);
```

This state is:
1. **Updated** by `Canvas.tsx` via `onViewportChange` callback
2. **Used** to calculate viewport center for AI operations
3. **Synced** in real-time as user interacts with canvas

## Testing the Coordinate System

### Manual Tests:
1. **Test Pan**: Drag canvas, create shape → shape stays at world position
2. **Test Zoom**: Zoom in/out, create shape → shape appears at correct position
3. **Test AI Placement**: Ask AI to create shape "here" → appears at viewport center
4. **Test Multi-user**: User A pans/zooms, User B sees shapes in correct position

### Validation:
- Shapes should never "jump" when panning/zooming
- Multiple users with different pan/zoom should see shapes at same world positions
- AI-created shapes should appear where user is looking

## Architecture

```
User Interaction (screen coords)
         ↓
    screenToWorld()
         ↓
   World Coordinates (0-5000)
         ↓
    Firebase Storage
         ↓
    Real-time Sync
         ↓
   All Clients (world coords)
         ↓
    Konva Rendering (auto transforms to screen)
         ↓
   Display (screen coords)
```

## References

- **Canvas Component**: `src/components/canvas/Canvas.tsx`
  - Contains `screenToWorld()` helper function
  - Handles all coordinate transformations for interactions

- **Canvas Editor Page**: `src/pages/CanvasEditorPage.tsx`
  - Contains `getViewportCenter()` function
  - Manages viewport state and passes to AI

- **AI Tools**: `src/services/aiTools.ts`
  - Uses world coordinates for all shape operations
  - Receives viewport center for "create here" commands

- **Konva Documentation**: https://konvajs.org/
  - Reference for stage transformations and coordinate systems

