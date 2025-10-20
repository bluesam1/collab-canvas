# Feature PRD: Advanced Canvas Tools (Export, Copy/Paste, Lasso, Multi-Select Transform, Nudging)

## Introduction/Overview

This feature adds five essential canvas editing tools that users expect in modern design applications. Currently, CollabCanvas has basic shape creation and selection, but lacks standard editing workflows that power users rely on.

**Problem Solved:** Users cannot export their work for sharing outside the app, lack standard copy/paste workflows for duplicating objects, only have rectangular selection available for multi-select operations, cannot transform multiple objects together as a group, and lack precise keyboard-based positioning controls.

**Target Users:** All CollabCanvas users who want efficient canvas editing workflows and the ability to share their work.

## Goals

1. Enable users to export canvas content as high-quality PNG images
2. Support standard copy/paste/cut keyboard shortcuts for object manipulation
3. Provide free-form lasso selection for flexible multi-object selection
4. Enable scaling and transforming multiple selected objects as a group
5. Support precise keyboard-based positioning with arrow key nudging
6. Maintain consistency with industry-standard design tool behaviors
7. Provide clear visual feedback for all tool interactions
8. Ensure tools work seamlessly with existing real-time collaboration features

## User Stories

### Export Canvas as PNG

**As a canvas user, I want to:**
- Export my canvas as a PNG file, so I can share my work outside the application
- Use a keyboard shortcut (Cmd+E) for quick export, so I can save time
- Get a high-quality export suitable for presentations, so my work looks professional
- Have the exported file automatically download with a descriptive name, so I can easily find it later

### Copy/Paste Functionality

**As a canvas user, I want to:**
- Copy selected objects with Cmd+C, so I can duplicate them using familiar shortcuts
- Paste copied objects with Cmd+V, so I follow standard editing workflows
- Cut objects with Cmd+X, so I can move them efficiently (copy + delete)
- Duplicate selected objects with Cmd+D, so I can quickly create a copy without using clipboard
- Paste multiple times to create several copies, so I can quickly populate my canvas
- Have pasted objects offset from originals, so they don't overlap exactly
- Have pasted objects automatically selected, so I can immediately position them

### Lasso Selection Tool

**As a canvas user, I want to:**
- Draw a free-form selection path around objects, so I can select irregularly-positioned groups
- Use the L key to quickly activate lasso mode, so I don't need to reach for toolbar
- See my lasso path as I draw, so I know what area I'm selecting
- Have objects within my lasso automatically selected on release, so selection feels immediate
- Exit lasso mode automatically after selection, so I can quickly continue working
- See which objects will be selected in real-time preview, so I know what I'll get

### Multi-Select Transform

**As a canvas user, I want to:**
- Scale multiple selected objects together as a group, so I can resize layouts efficiently
- See a bounding box with resize handles around my multi-selection, so I know I can transform them
- Drag corner handles to resize all objects proportionally, so relative sizes are maintained
- Have objects maintain their relative positions during scaling, so the layout structure is preserved
- See the transform happen in real-time as I drag, so I have immediate visual feedback
- Have all scaled objects sync to Firebase, so collaborators see my changes

### Arrow Key Nudging

**As a canvas user, I want to:**
- Move selected objects with arrow keys, so I can precisely position them
- Nudge shapes 5 pixels at a time, so I have fine-grained control
- Use arrow keys to adjust multiple selections, so I can move groups together
- Have nudging support undo/redo, so I can revert mistakes
- Avoid page scrolling when using arrow keys, so navigation doesn't interfere with editing

## Functional Requirements

### Export Canvas as PNG

#### FR1: Export Button UI
- The system MUST provide an "Export PNG" button in the toolbar
- Button icon: Download icon (from lucide-react)
- Button tooltip: "Export canvas as PNG (Cmd+E)" or "Export canvas as PNG (Ctrl+E)" on Windows
- Button position: New section at bottom of toolbar or in utility section

#### FR2: Export Keyboard Shortcut
- The system MUST support Cmd+E (Mac) or Ctrl+E (Windows) to trigger export
- The shortcut MUST prevent default browser behavior
- The shortcut MUST work regardless of current canvas mode or selection

#### FR3: Export Process
- When export is triggered, the system MUST:
  1. Render the entire canvas (5000×5000px workspace) to PNG
  2. Use pixelRatio of 2 for high-quality (Retina) output
  3. Generate PNG with mimeType 'image/png' and quality: 1
  4. Trigger browser download with filename: `CollabCanvas_[timestamp].png`
  5. Show success toast: "Canvas exported successfully" (3 seconds)

#### FR4: Export Quality Settings
- PNG quality MUST be set to maximum (quality: 1)
- PixelRatio MUST be 2 for Retina display quality
- Background MUST be white (or transparent - checkbox optional)
- All canvas objects MUST be included in export

#### FR5: Export Error Handling
- If export fails due to memory issues, show error toast: "Export failed. Canvas may be too large."
- If browser blocks download, show toast: "Please allow downloads from this site"
- Console.error any export errors for debugging

### Copy/Paste Functionality

#### FR6: Copy Function (Cmd+C)
- When Cmd+C is pressed with objects selected, the system MUST:
  1. Copy all selected objects to internal clipboard
  2. Store complete object data (id, type, position, dimensions, color, etc.)
  3. Show toast: "1 object copied" or "[N] objects copied"
  4. Reset paste offset counter to 0

#### FR7: Paste Function (Cmd+V)
- When Cmd+V is pressed with clipboard populated, the system MUST:
  1. Clone all objects from clipboard
  2. Generate new unique IDs for each cloned object
  3. Apply offset to x/y positions: +20px for first paste, +40px for second, etc.
  4. Create all new objects in Firebase (for real-time sync)
  5. Automatically select all pasted objects
  6. Show toast: "Pasted" (2 seconds)
  7. Increment paste offset for next paste

#### FR8: Cut Function (Cmd+X)
- When Cmd+X is pressed with objects selected, the system MUST:
  1. Copy selected objects to clipboard (same as Cmd+C)
  2. Delete selected objects from canvas (same as Delete key)
  3. Show only delete notification (no separate copy notification)

#### FR9: Duplicate Function (Cmd+D)
- When Cmd+D is pressed with objects selected, the system MUST:
  1. Clone all selected objects
  2. Generate new unique IDs for each cloned object
  3. Apply fixed offset to x/y positions: +50px right, +50px down
  4. Create all new objects in Firebase (for real-time sync)
  5. Automatically select all duplicated objects
  6. Show toast: "Duplicated" (2 seconds)
- Duplicate MUST NOT affect the clipboard (independent of copy/paste)
- Duplicate MUST work with single or multiple selected objects

#### FR10: Copy/Paste/Duplicate Keyboard Shortcuts
- The system MUST support:
  - Cmd+C / Ctrl+C for copy
  - Cmd+V / Ctrl+V for paste
  - Cmd+X / Ctrl+X for cut
  - Cmd+D / Ctrl+D for duplicate
- Shortcuts MUST prevent default browser behavior
- Shortcuts MUST work in all canvas modes (pan, rectangle, lasso)

#### FR11: Internal Clipboard Management
- Clipboard MUST be stored in React state (not browser clipboard API)
- Clipboard MUST persist until new objects are copied
- Copying new objects MUST replace clipboard contents and reset offset
- Paste offset MUST increment by 20px for each successive paste
- Empty clipboard MUST be handled silently (no action, no error)

#### FR12: Copy/Paste/Duplicate Edge Cases
- Pasting with no clipboard → No action (silent)
- Copying with no selection → No action (silent)
- Duplicating with no selection → No action (silent)
- Pasting objects off visible canvas → Allow (user can pan to find them)
- Duplicating objects off visible canvas → Allow (user can pan to find them)
- Multiple paste operations → Each paste increments offset
- Duplicate always uses fixed +50px offset (does not increment)
- Reset offset when copying new objects → Prevents excessive offset buildup

### Lasso Selection Tool

#### FR13: Lasso Mode Activation
- The system MUST provide a "Lasso Select" button in the toolbar
- Button icon: Lasso/rope icon (or appropriate selection icon)
- Button tooltip: "Lasso Select (L)"
- Keyboard shortcut: L key toggles lasso mode on/off
- Active state: Button highlighted when lasso mode active

#### FR14: Lasso Mode Behavior
- When lasso mode is activated:
  1. Canvas cursor changes to crosshair
  2. Pan/zoom disabled while in lasso mode
  3. Rectangle creation disabled
  4. Other shape creation disabled
  5. Existing selections cleared

#### FR15: Lasso Drawing Interaction
- On mouse down: Begin lasso path with initial point
- On mouse move: Append point to lasso path array
- On mouse up: Complete lasso path and perform selection
- Minimum 3 points required to form valid selection area

#### FR16: Lasso Path Visualization
- While drawing, the system MUST render the lasso path as:
  - Dashed line (dash pattern: [5, 5])
  - Blue color (#3B82F6 - matches theme)
  - Line width: 2px
  - Animated dashes (optional enhancement)
- Path MUST be visible in real-time as user drags
- Path MUST be removed after selection completes

#### FR17: Lasso Selection Algorithm
- The system MUST use point-in-polygon algorithm (ray casting)
- Check if object center point is within lasso path
- Alternative: Check if any object corner is within path
- Select all objects that pass the test
- Account for stage transform (pan/zoom) when calculating positions

#### FR18: Selection Completion
- After mouse up, the system MUST:
  1. Calculate which objects are within lasso path
  2. Select all matched objects
  3. Remove lasso path from canvas
  4. Automatically exit lasso mode (return to pan mode)
  5. If 0 objects selected, show no notification (silent)
  6. If 1+ objects selected, highlight them immediately

#### FR19: Lasso Mode Exit
- Lasso mode MUST automatically exit after completing selection
- User can manually exit by pressing L key again or V key (pan mode)
- Escape key MUST cancel lasso and exit mode without selecting
- Clicking toolbar button for another mode MUST exit lasso mode

#### FR20: Lasso Visual Feedback
- Active lasso button MUST show highlighted state (different background/border)
- Canvas cursor MUST change to crosshair while in lasso mode
- Objects within lasso path MAY show preview highlight (optional enhancement)
- Lasso path MUST be clearly visible against canvas objects

#### FR21: Lasso Edge Cases
- Lasso with < 3 points → No selection, exit mode silently
- Very complex lasso path (100+ points) → Simplify path if performance issues
- Lasso around 0 objects → Exit mode, show no notification
- Account for canvas pan/zoom in coordinate calculations
- Handle rapid mode switching gracefully

### Multi-Select Transform

#### FR22: Multi-Select Transformer Display
- When 2+ objects are selected, the system MUST:
  1. Display a bounding box (transformer) around all selected objects
  2. Show 4 corner resize handles only (no edge handles to prevent aspect ratio changes)
  3. Calculate bounding box to encompass all selected objects
  4. Update bounding box when selection changes
  5. Hide transformer when selection is cleared or reduced to 1 object

#### FR23: Group Scaling Behavior
- When user drags any corner handle, the system MUST:
  1. Calculate scale factor from drag distance
  2. Apply scale to all selected objects relative to transform origin
  3. Scale each object's width and height by the scale factor
  4. Adjust each object's x/y position to maintain relative layout
  5. Update all objects in real-time during drag
  6. **Always maintain aspect ratio** - locked proportions for all corner handles
- Only corner handles are enabled to prevent accidental aspect ratio changes
- Aspect ratio locking ensures the group scales uniformly

#### FR24: Transform Origin Point
- Scale origin MUST be the opposite corner from the dragged handle
- **Corner handles** (only option available):
  - Example: Dragging bottom-right → scales from top-left origin
  - Example: Dragging top-left → scales from bottom-right origin
  - Example: Dragging top-right → scales from bottom-left origin
  - Example: Dragging bottom-left → scales from top-right origin
- All objects scale away from or toward this fixed opposite corner
- This matches standard design tool behavior (Figma, Sketch, etc.) and feels most intuitive
- User expects objects to "grow away from" or "shrink toward" the opposite point

#### FR25: Real-Time Transform Updates
- While dragging, the system MUST:
  1. Update object positions and sizes locally (optimistic update)
  2. Throttle Firebase writes to every 50ms during drag
  3. Apply transform to all selected objects simultaneously
  4. Maintain smooth 60 FPS rendering during transform
  5. Handle edge cases (very small objects, negative scales)

#### FR26: Transform Completion
- On mouse up (drag end), the system MUST:
  1. Write final positions/sizes of all objects to Firebase
  2. Stop throttled updates
  3. Maintain object selection after transform
  4. Ensure all collaborators see final state
  5. No toast notification (transform is continuous action)

#### FR27: Multi-Select Transform Edge Cases
- Scaling to very small size (< 5px) → Prevent, enforce minimum size
- Rapid transforms → Throttle Firebase writes, batch updates
- Transform during network disconnect → Queue writes, sync when reconnected
- Single object selected → Use existing single-object transformer (no change)
- Objects of different types selected → All scale uniformly (rectangles, circles, lines, text)

### Arrow Key Nudging

#### FR28: Arrow Key Detection
- When one or more shapes are selected, the system MUST listen for arrow key presses
- Arrow keys: ArrowUp, ArrowDown, ArrowLeft, ArrowRight
- Prevent default browser behavior (page scrolling)
- Do not trigger nudging when focus is in an input field or textarea

#### FR29: Nudge Distance
- Each arrow key press MUST move selected shapes 5 pixels in the direction pressed
- ArrowUp: Move -5px on Y axis (up)
- ArrowDown: Move +5px on Y axis (down)
- ArrowLeft: Move -5px on X axis (left)
- ArrowRight: Move +5px on X axis (right)

#### FR30: Multi-Shape Nudging
- When multiple shapes are selected, all MUST move together by the same amount
- Works for any combination of shape types (rectangles, circles, lines, text)
- Position updates based on shape type:
  - Rectangles/Text/Lines: Update `x` and `y` properties
  - Circles: Update `centerX` and `centerY` properties

#### FR31: Nudge Undo/Redo Support
- Each arrow key press MUST create an undo snapshot before moving
- User can undo/redo individual nudge operations
- Operation type: "modify" with all selected shape IDs

#### FR32: Nudge Firebase Sync
- Position updates MUST be written to Firebase immediately
- Batch updates for multiple shapes (efficient write operation)
- Real-time sync to all collaborators
- Optimistic UI update (local state updates before Firebase write)

## Non-Goals (Out of Scope)

### Export Feature
1. **Export viewport only** - Nice to have but not required for MVP
2. **Export with grid/guides** - Export canvas content only
3. **Export to other formats** (SVG, PDF, JPG) - PNG only
4. **Export selected objects only** - Full canvas only
5. **Custom export dimensions** - Use canvas dimensions (5000×5000)
6. **Batch export multiple canvases** - Single canvas per export

### Copy/Paste Feature
1. **Cross-canvas copy/paste** - Single canvas only
2. **Paste at cursor position** - Offset from original position
3. **Paste formatting/styles separately** - All properties copied together
4. **Browser clipboard integration** - Internal clipboard only
5. **Undo/redo for paste/duplicate** - General undo/redo out of scope

### Lasso Feature
1. **Additive lasso selection** (Shift+Lasso) - Single operation only
2. **Subtractive lasso selection** (Alt+Lasso) - Single operation only
3. **Lasso mode stays active** - Auto-exit after selection
4. **Magnetic lasso** (snap to object edges) - Simple geometric calculation only
5. **Lasso configuration** (tolerance, smoothing) - Default behavior only
6. **Path simplification algorithm** - Use raw points unless performance issues arise

### Multi-Select Transform Feature
1. **Rotation of multiple objects** - Scaling only, no rotation
2. **Skew/shear transforms** - Scale only
3. **Individual object transform controls within group** - Group acts as single unit
4. **Flip horizontal/vertical for group** - Not in this phase
5. **Lock aspect ratio toggle** - Aspect ratio is ALWAYS locked (no toggle needed)
6. **Non-uniform scaling** - Always proportional scaling only
7. **Smart guides/snapping during transform** - Free transform only
8. **Transform with keyboard input** (enter dimensions) - Mouse drag only

## Design Considerations

### Export Button Design
```
Position: Toolbar bottom section (or utility area)
Icon: Download (20×20px)
Style: Consistent with existing toolbar buttons
Tooltip: "Export canvas as PNG (Cmd+E)"
Hover state: Light background
```

### Copy/Paste/Duplicate Visual Feedback
```
Toast Notification (Copy):
  - Message: "1 object copied" or "3 objects copied"
  - Duration: 2 seconds
  - Position: Top-right

Toast Notification (Paste):
  - Message: "Pasted"
  - Duration: 2 seconds
  - Position: Top-right

Toast Notification (Duplicate):
  - Message: "Duplicated"
  - Duration: 2 seconds
  - Position: Top-right

Pasted Object Offset:
  - First paste: +20px X, +20px Y
  - Second paste: +40px X, +40px Y
  - Third paste: +60px X, +60px Y
  - (etc., incrementing by 20px each time)

Duplicated Object Offset:
  - Always: +50px X, +50px Y (fixed offset)
  - Does not increment on successive duplicates
```

### Lasso Mode Design
```
Lasso Button:
  - Position: Toolbar, near selection tools
  - Icon: Lasso or free-form selection icon
  - Active state: Highlighted background (blue-100)
  - Tooltip: "Lasso Select (L)"

Lasso Path Styling:
  - Stroke: #3B82F6 (blue-500)
  - Stroke width: 2px
  - Dash: [5, 5]
  - Opacity: 0.8
  - Line cap: round
  - Line join: round

Cursor in Lasso Mode:
  - Style: crosshair
  - Shows user is in selection mode
```

### Multi-Select Transform Design
```
Transformer Bounding Box:
  - Stroke: #3B82F6 (blue-500)
  - Stroke width: 2px
  - Dash: None (solid line)
  - Padding: 0px (tight fit around objects)

Resize Handles:
  - Size: 10×10px squares
  - Fill: White
  - Stroke: #3B82F6 (blue-500)
  - Stroke width: 2px
  - Visible at corners and midpoints of edges

Transform Behavior:
  - Cursor changes to resize cursors (nwse-resize, nesw-resize, etc.)
  - Real-time preview during drag
  - Smooth animations (60 FPS target)
  - All objects scale proportionally (aspect ratio ALWAYS locked)
  - Transform origin is opposite point from dragged handle

Visual Feedback:
  - No toast notification (continuous action)
  - Objects update in real-time
  - Collaborators see smooth transform via throttled sync
  - All 8 handles behave consistently (proportional scaling)
```

### Keyboard Shortcuts Reference
```
Cmd/Ctrl + E: Export canvas as PNG
Cmd/Ctrl + C: Copy selected objects
Cmd/Ctrl + V: Paste copied objects
Cmd/Ctrl + X: Cut selected objects
Cmd/Ctrl + D: Duplicate selected objects
L: Toggle lasso selection mode
V: Return to pan mode (exit lasso)
Escape: Cancel lasso (if drawing)
```

## Technical Considerations

### Export Implementation with Konva

```typescript
import { useRef } from 'react';
import type { Stage } from 'konva/lib/Stage';

const stageRef = useRef<Stage>(null);

const handleExport = () => {
  if (!stageRef.current) return;
  
  try {
    // Generate PNG data URL
    const dataURL = stageRef.current.toDataURL({
      pixelRatio: 2,
      mimeType: 'image/png',
      quality: 1,
    });
    
    // Trigger download
    const link = document.createElement('a');
    link.download = `CollabCanvas_${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Canvas exported successfully', 'success');
  } catch (error) {
    console.error('Export failed:', error);
    showToast('Export failed. Canvas may be too large.', 'error');
  }
};
```

### Copy/Paste State Management

```typescript
// In CanvasContext
interface ClipboardState {
  objects: CanvasObject[];
  pasteOffset: number;
}

const [clipboard, setClipboard] = useState<ClipboardState>({
  objects: [],
  pasteOffset: 0,
});

const handleCopy = () => {
  const selectedObjects = objects.filter(obj => 
    selectedIds.includes(obj.id)
  );
  
  if (selectedObjects.length === 0) return;
  
  setClipboard({
    objects: selectedObjects,
    pasteOffset: 0, // Reset offset
  });
  
  showToast(`${selectedObjects.length} object${selectedObjects.length > 1 ? 's' : ''} copied`, 'success');
};

const handlePaste = async () => {
  if (clipboard.objects.length === 0) return;
  
  const offset = (clipboard.pasteOffset + 1) * 20;
  const newIds: string[] = [];
  
  // Clone and create objects
  for (const obj of clipboard.objects) {
    const newId = generateId();
    const newObject = {
      ...obj,
      id: newId,
      x: obj.x + offset,
      y: obj.y + offset,
    };
    
    await createObject(newObject);
    newIds.push(newId);
  }
  
  // Select pasted objects
  setSelectedIds(newIds);
  
  // Increment paste offset
  setClipboard(prev => ({
    ...prev,
    pasteOffset: prev.pasteOffset + 1,
  }));
  
  showToast('Pasted', 'success');
};

const handleDuplicate = async () => {
  const selectedObjects = objects.filter(obj => 
    selectedIds.includes(obj.id)
  );
  
  if (selectedObjects.length === 0) return;
  
  const newIds: string[] = [];
  const DUPLICATE_OFFSET = 50; // Fixed 50px offset
  
  // Clone and create objects
  for (const obj of selectedObjects) {
    const newId = generateId();
    const newObject = {
      ...obj,
      id: newId,
      x: obj.x + DUPLICATE_OFFSET,
      y: obj.y + DUPLICATE_OFFSET,
    };
    
    await createObject(newObject);
    newIds.push(newId);
  }
  
  // Select duplicated objects
  setSelectedIds(newIds);
  
  showToast('Duplicated', 'success');
};
```

### Lasso Selection Algorithm

```typescript
// Point-in-polygon using ray casting
const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    const intersect = ((yi > point.y) !== (yj > point.y))
      && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
};

const selectObjectsInLasso = (lassoPath: Point[]) => {
  if (lassoPath.length < 3) return []; // Need closed shape
  
  const selected = objects.filter(obj => {
    // Get object center point
    const center = {
      x: obj.x + (obj.width || 0) / 2,
      y: obj.y + (obj.height || 0) / 2,
    };
    
    // Account for stage transform
    const stageTransform = stageRef.current?.getTransform();
    const transformedCenter = stageTransform 
      ? stageTransform.point(center)
      : center;
    
    return isPointInPolygon(transformedCenter, lassoPath);
  });
  
  return selected.map(obj => obj.id);
};
```

### Multi-Select Transform Implementation

```typescript
import { Transformer } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';

// In Canvas component
const transformerRef = useRef<Konva.Transformer>(null);
const [selectedShapes, setSelectedShapes] = useState<Konva.Shape[]>([]);

// Update transformer when selection changes
useEffect(() => {
  if (transformerRef.current && selectedShapes.length > 1) {
    transformerRef.current.nodes(selectedShapes);
    transformerRef.current.getLayer()?.batchDraw();
  }
}, [selectedShapes, selectedIds]);

// Handle transform end (scale/resize)
const handleTransformEnd = async (e: KonvaEventObject<Event>) => {
  const node = e.target;
  
  // Get scale from transformer
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();
  
  // Apply scale to all selected objects
  const updates = selectedIds.map(id => {
    const obj = objects.find(o => o.id === id);
    if (!obj) return null;
    
    return {
      ...obj,
      x: obj.x * scaleX,
      y: obj.y * scaleY,
      width: obj.width * scaleX,
      height: obj.height * scaleY,
      // Reset scale to 1 after applying to dimensions
      scaleX: 1,
      scaleY: 1,
    };
  }).filter(Boolean);
  
  // Batch update all objects
  await updateObjectsBatch(updates);
  
  // Reset node scale
  node.scaleX(1);
  node.scaleY(1);
};

// Render transformer for multi-select
{selectedIds.length > 1 && (
  <Transformer
    ref={transformerRef}
    boundBoxFunc={(oldBox, newBox) => {
      // Prevent negative scaling
      if (newBox.width < 5 || newBox.height < 5) {
        return oldBox;
      }
      return newBox;
    }}
    enabledAnchors={[
      'top-left',
      'top-right',
      'bottom-left',
      'bottom-right',
    ]} // Only corners - prevents aspect ratio changes
    keepRatio={true} // ALWAYS lock aspect ratio
    onTransformEnd={handleTransformEnd}
  />
)}
```

**Group Transform Algorithm:**

```typescript
// Calculate scale from transformer
const scaleX = transformer.scaleX();
const scaleY = transformer.scaleY();

// Get bounding box center (transform origin)
const boundBox = transformer.getClientRect();
const originX = boundBox.x + boundBox.width / 2;
const originY = boundBox.y + boundBox.height / 2;

// Apply scale to each object relative to origin
selectedObjects.forEach(obj => {
  // Calculate offset from origin
  const offsetX = obj.x - originX;
  const offsetY = obj.y - originY;
  
  // Scale position relative to origin
  obj.x = originX + (offsetX * scaleX);
  obj.y = originY + (offsetY * scaleY);
  
  // Scale dimensions
  obj.width = obj.width * scaleX;
  obj.height = obj.height * scaleY;
  
  // For circles, scale radius
  if (obj.type === 'circle') {
    obj.radius = obj.radius * scaleX;
  }
  
  // For lines, scale points
  if (obj.type === 'line' && obj.points) {
    obj.points = obj.points.map((p, i) => 
      i % 2 === 0 ? p * scaleX : p * scaleY
    );
  }
});
```

### Performance Considerations

**Export:**
- Large canvases (5000×5000) at pixelRatio 2 = 10,000×10,000 pixel image
- May consume significant memory (~100-400MB depending on content)
- Consider warning user if canvas has 200+ objects
- Fallback: Reduce pixelRatio to 1 if export fails

**Copy/Paste:**
- Minimal performance impact - operations are synchronous
- Firebase writes are already optimized with batching
- Clipboard stored in memory (negligible for <1000 objects)

**Lasso:**
- Point-in-polygon calculation is O(n) per object
- With 100 objects and 100 path points, ~10,000 operations
- Should complete in <50ms on modern hardware
- If performance issues arise, simplify path or use bounding box pre-filter

**Multi-Select Transform:**
- Transform calculations are O(n) where n = number of selected objects
- Transformer updates managed by Konva (optimized)
- Throttle Firebase writes to 50ms during drag
- Batch update all objects in single write operation
- Should maintain 60 FPS with up to 50 selected objects
- For 100+ selected objects, may drop to 30 FPS (acceptable)
- Most expensive operation: Calculating new positions for each object

## Success Metrics

### Export Feature
- ✅ Export produces valid PNG file 100% of the time
- ✅ Exported PNG includes all canvas objects
- ✅ Export quality is high (sharp, no artifacts)
- ✅ Keyboard shortcut works reliably
- ✅ File downloads with descriptive name
- ✅ No browser console errors during export

### Copy/Paste/Duplicate Feature
- ✅ Copy stores selected objects correctly
- ✅ Paste creates new objects at offset position
- ✅ Multiple pastes stack correctly (+20px each)
- ✅ Duplicate creates new objects at fixed +50px offset
- ✅ Duplicate does not affect clipboard
- ✅ Cut removes original objects after copy
- ✅ All keyboard shortcuts work reliably
- ✅ Pasted and duplicated objects automatically selected
- ✅ Toast notifications appear at correct times

### Lasso Selection Feature
- ✅ Lasso path draws smoothly without lag
- ✅ Point-in-polygon algorithm is accurate (95%+ correct selections)
- ✅ Selected objects highlight immediately
- ✅ Mode exits automatically after selection
- ✅ L key toggles lasso mode reliably
- ✅ Works correctly with canvas pan/zoom
- ✅ No performance issues with 100+ objects

### Multi-Select Transform Feature
- ✅ Transformer appears when 2+ objects selected
- ✅ All 8 resize handles are visible and functional
- ✅ Scaling maintains relative positions of objects
- ✅ Scaling ALWAYS maintains proportions (aspect ratio locked for all handles)
- ✅ Transform origin is opposite point from dragged handle (intuitive behavior)
- ✅ Transform updates in real-time (60 FPS)
- ✅ All objects sync to Firebase after transform
- ✅ Collaborators see smooth transforms
- ✅ Minimum size constraints work (no negative scales)
- ✅ Works with all object types (rectangles, circles, lines, text)
- ✅ Single object selection uses existing transformer (no regression)

### User Experience
- ✅ Users report tools feel natural and responsive
- ✅ Keyboard shortcuts feel standard and familiar
- ✅ Export quality meets user expectations
- ✅ Copy/paste workflow efficient for duplication
- ✅ Duplicate (Cmd+D) faster than copy/paste for single duplicates
- ✅ Lasso selection more convenient than box selection for irregular groups
- ✅ Multi-select transform feels like Figma/Sketch (industry standard)
- ✅ Scaling multiple objects is intuitive and predictable

## Open Questions

1. **Q: Should export include transparent background option?**
   - Decision: White background for MVP. Transparent as checkbox enhancement later.

2. **Q: Should paste position relative to cursor or original objects?**
   - Decision: Relative to original objects with offset. More predictable.

3. **Q: Should lasso mode stay active for multiple selections?**
   - Decision: No, auto-exit after each selection. Faster workflow.

4. **Q: Should we support Cmd+D for duplicate (paste in place)?**
   - Decision: Yes. Cmd+D duplicates with fixed +50px offset (right and down).

5. **Q: What if lasso path is extremely complex (500+ points)?**
   - Decision: Allow it, but monitor performance. Simplify path if needed.

6. **Q: Should export show progress indicator for large canvases?**
   - Decision: Not in MVP. Export is typically fast (<2 seconds).

7. **Q: Should we validate clipboard contents before paste?**
   - Decision: Yes, ensure object structure is valid. Prevent errors.

8. **Q: Should lasso selection include partially intersecting objects?**
   - Decision: Only objects with center inside lasso. Clear and predictable.

9. **Q: Should multi-select transform lock aspect ratio?**
   - Decision: Yes, ALWAYS maintain aspect ratio. Only corner handles enabled (4 anchors) to prevent accidental aspect ratio changes. This ensures uniform scaling and matches most intuitive behavior. No edge handles, no toggle - proportional scaling only.

10. **Q: What transform origin should we use for scaling?**
    - Decision: Opposite corner from dragged handle. Since only corner anchors are enabled, objects grow/shrink away from the opposite corner. This is the most predictable and standard behavior.

11. **Q: Should we support rotation in multi-select transform?**
    - Decision: Not in this phase. Scaling only. Rotation can be added later.

12. **Q: How should we handle very large selections (50+ objects)?**
    - Decision: Allow it, but accept 30 FPS performance. Batch Firebase updates for efficiency.

## Testing Checklist

### Export Testing
- [ ] Export button appears in toolbar
- [ ] Export button has correct icon and tooltip
- [ ] Cmd+E / Ctrl+E triggers export
- [ ] PNG file downloads with timestamp filename
- [ ] Exported PNG includes all canvas objects
- [ ] Export quality is high (sharp at 2× zoom)
- [ ] Success toast appears after export
- [ ] Export works with 0 objects (empty canvas)
- [ ] Export works with 100+ objects
- [ ] Export works with various object types (rectangles, circles, lines, text)
- [ ] No console errors during export

### Copy/Paste/Duplicate Testing
- [ ] Cmd+C copies selected objects
- [ ] Copy toast shows correct count
- [ ] Cmd+V pastes copied objects
- [ ] Pasted objects appear at +20px offset
- [ ] Second paste appears at +40px offset
- [ ] Third paste appears at +60px offset
- [ ] Pasted objects automatically selected
- [ ] Cmd+X cuts objects (copies and deletes)
- [ ] Cut shows delete notification only
- [ ] Cmd+D duplicates selected objects
- [ ] Duplicated objects appear at +50px X, +50px Y offset
- [ ] Duplicated objects automatically selected
- [ ] Second duplicate also appears at +50px offset (no increment)
- [ ] Duplicate shows "Duplicated" toast
- [ ] Duplicate does not affect clipboard
- [ ] Copy with no selection does nothing
- [ ] Paste with empty clipboard does nothing
- [ ] Duplicate with no selection does nothing
- [ ] Multiple objects copy/paste/duplicate correctly
- [ ] Copying new objects resets paste offset

### Lasso Selection Testing
- [ ] Lasso button appears in toolbar
- [ ] L key activates lasso mode
- [ ] Cursor changes to crosshair in lasso mode
- [ ] Mouse down starts lasso path
- [ ] Mouse move draws lasso path in real-time
- [ ] Lasso path is dashed blue line
- [ ] Mouse up completes selection
- [ ] Objects inside lasso are selected
- [ ] Objects outside lasso are not selected
- [ ] Lasso mode exits after selection
- [ ] L key toggles lasso mode off
- [ ] Escape cancels lasso without selecting
- [ ] Lasso with < 3 points does nothing
- [ ] Lasso works correctly with canvas pan
- [ ] Lasso works correctly with canvas zoom
- [ ] No performance issues with complex paths

### Multi-Select Transform Testing
- [ ] Select 2 objects - transformer appears
- [ ] Select 3+ objects - transformer appears
- [ ] Transformer shows 4 corner resize handles only (no edge handles)
- [ ] Transformer bounding box encompasses all objects
- [ ] Drag any corner handle scales all objects proportionally (aspect ratio locked)
- [ ] No edge handles available (prevents aspect ratio changes)
- [ ] Aspect ratio is ALWAYS maintained regardless of which handle is dragged
- [ ] Objects maintain relative positions during scale
- [ ] Objects maintain relative sizes during scale
- [ ] Cursor changes to resize cursor on hover
- [ ] Transform updates in real-time (smooth)
- [ ] Release mouse completes transform
- [ ] All objects sync to Firebase after transform
- [ ] Collaborators see transform in real-time
- [ ] Minimum size constraint works (5px minimum)
- [ ] Cannot scale to negative dimensions
- [ ] Select 1 object - single transformer appears (existing behavior)
- [ ] Deselect all - transformer disappears
- [ ] Works with rectangles only
- [ ] Works with circles only
- [ ] Works with lines only
- [ ] Works with text only
- [ ] Works with mixed object types
- [ ] Works with 50+ objects (acceptable performance)
- [ ] Transform works with canvas pan/zoom

### Arrow Key Nudging Testing
- [ ] Arrow Up moves selected shape 5px up
- [ ] Arrow Down moves selected shape 5px down
- [ ] Arrow Left moves selected shape 5px left
- [ ] Arrow Right moves selected shape 5px right
- [ ] Nudging works with single rectangle
- [ ] Nudging works with single circle
- [ ] Nudging works with single line
- [ ] Nudging works with single text
- [ ] Nudging works with multiple selected shapes (all move together)
- [ ] Nudging works with mixed shape types
- [ ] Arrow keys don't scroll the page when shapes selected
- [ ] Arrow keys don't trigger when focus is in input field
- [ ] Nudging creates undo history (can undo each nudge)
- [ ] Nudging syncs to Firebase and other users
- [ ] Multiple rapid nudges work smoothly
- [ ] Nudging works after lasso selection
- [ ] Nudging works after box selection
- [ ] Nudging works with 50+ objects selected

### Integration Testing
- [ ] Export works while objects are selected
- [ ] Copy/paste/duplicate work in all canvas modes
- [ ] Lasso selection integrates with existing selection system
- [ ] Multi-select transform works after lasso selection
- [ ] Multi-select transform works after box selection
- [ ] Copy/paste works on transformed objects
- [ ] Duplicate works on transformed objects
- [ ] Export includes transformed objects correctly
- [ ] All keyboard shortcuts work together without conflicts
- [ ] Real-time sync works with copy/paste/duplicate
- [ ] Real-time sync works with multi-select transform
- [ ] Notifications work correctly with all tools
- [ ] Multi-user collaboration: simultaneous transforms work

### Edge Cases
- [ ] Export very large canvas (test memory limits)
- [ ] Paste 100 times (test offset limits)
- [ ] Duplicate 100 times (test with fixed offset)
- [ ] Lasso with 500+ points (test performance)
- [ ] Transform 100+ objects (test performance)
- [ ] Copy/paste/duplicate during network disconnect
- [ ] Transform during network disconnect
- [ ] Export during object creation
- [ ] Export during active transform
- [ ] Multiple users copying/pasting/duplicating simultaneously
- [ ] Multiple users transforming same objects simultaneously
- [ ] Transform then immediately duplicate
- [ ] Very small objects (1-2px) - test transform visibility

