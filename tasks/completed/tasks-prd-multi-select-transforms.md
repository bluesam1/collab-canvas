# Task List: Multi-Select & Transform Operations

**Source PRD:** `prd-multi-select-transforms.md`  
**Time Estimate:** 4-6 hours  
**Priority:** P2 (Foundation for AI Agent)

---

## Relevant Files

- `src/types/index.ts` - Update shape type definitions to include rotation property
- `src/contexts/CanvasContext.tsx` - Update selection state from single ID to array of IDs, add transform operations
- `src/hooks/useCanvas.ts` - Update hook to expose new multi-select and transform operations
- `src/components/canvas/Canvas.tsx` - Add multi-select logic, drag-to-select box, transform handles rendering
- `src/components/canvas/TransformHandles.tsx` - NEW: Component for resize/rotation handles (to be created)
- `src/components/canvas/SelectionBox.tsx` - NEW: Component for drag-to-select rectangle (to be created)
- `src/components/canvas/Rectangle.tsx` - Update to support rotation property
- `src/components/canvas/Circle.tsx` - Update to support rotation property
- `src/components/canvas/Line.tsx` - Update to support rotation property
- `src/components/canvas/Text.tsx` - Update to support rotation property
- `src/components/toolbar/ColorPalette.tsx` - Update to apply color to all selected shapes
- `tests/multi-select.test.tsx` - NEW: Unit tests for multi-select functionality (to be created)
- `tests/transforms.test.tsx` - NEW: Unit tests for resize/rotate operations (to be created)

### Notes

- Tests should be run with `npm test` or `npm run test`
- All Firebase sync operations should be throttled to 50ms during active transforms
- Rotation property defaults to 0 for backward compatibility with existing shapes

---

## Tasks

- [x] 1.0 Update Selection System to Support Multiple Shapes
  - [x] 1.1 Update type definitions in `src/types/index.ts` to add `rotation: number` property to all shape interfaces
  - [x] 1.2 Change `selectedId: string | null` to `selectedIds: string[]` in CanvasContext state (already was array)
  - [x] 1.3 Update `CanvasContextType` interface to reflect new selection state
  - [x] 1.4 Refactor selection logic in CanvasContext: `selectShape()` to handle adding/removing from array
  - [x] 1.5 Add `selectMultiple(ids: string[])` and `clearSelection()` methods to CanvasContext
  - [x] 1.6 Update all existing selection checks from `selectedId === shape.id` to `selectedIds.includes(shape.id)` (already done)
  - [x] 1.7 Update `deleteSelected()` to handle array of IDs instead of single ID

- [x] 2.0 Implement Multi-Select User Interface
  - [x] 2.1 Update Canvas.tsx click handler to support Shift+click (add to selection vs replace selection)
  - [x] 2.2 Implement drag-to-select box: detect drag start on empty canvas space in Select mode
  - [x] 2.3 Render selection box with dashed blue border and semi-transparent fill
  - [x] 2.4 Implement containment detection: identify shapes completely within selection box bounds
  - [x] 2.5 Add visual selection indicators (blue outline) to all selected shapes in Canvas.tsx (already exists)
  - [x] 2.6 Implement group move: when dragging with multiple selections, move all shapes maintaining relative positions (already works)
  - [x] 2.7 Update delete key handler to remove all selected shapes
  - [x] 2.8 Update ColorPalette.tsx to apply color to all `selectedIds` when multiple shapes selected
  - [x] 2.9 Add click-on-empty-space to clear selection (deselect all)
  - [x] 2.10 Add Select mode toolbar button with BoxSelect icon
  - [x] 2.11 Add keyboard shortcut 'S' to switch to Select mode
  - [x] 2.12 Add keyboard shortcut Ctrl/Cmd+A to select all shapes

- [x] 3.0 Implement Resize Transform Operations
  - [x] 3.1 Create `TransformHandles.tsx` component that renders when `selectedIds.length === 1` (Used Konva Transformer)
  - [x] 3.2 Calculate and render 8 resize handles (4 corners, 4 edges) based on selected shape bounds
  - [x] 3.3 Style resize handles: 8x8px white squares with blue 2px border
  - [x] 3.4 Implement corner handle drag logic: resize both width and height simultaneously
  - [x] 3.5 Implement edge handle drag logic: resize only width (left/right) or height (top/bottom)
  - [x] 3.6 Add Shift key detection to maintain aspect ratio during resize (Konva built-in with keepRatio)
  - [x] 3.7 Enforce minimum size constraint (5x5px) and maximum size constraint (5000x5000px)
  - [x] 3.8 Implement special resize behavior for circles: maintain circular shape (uniform scaling)
  - [x] 3.9 Implement special resize behavior for text: scale fontSize proportionally
  - [x] 3.10 Throttle Firebase updates during resize drag (50ms intervals) (handled by Konva onTransformEnd)
  - [x] 3.11 Update shape in Firebase with new dimensions on drag end
  - [x] 3.12 Add appropriate cursors to handles (nwse-resize, nesw-resize, ew-resize, ns-resize) (Konva built-in)

- [x] 4.0 Implement Rotation Transform Operations
  - [x] 4.1 Add rotation handle to TransformHandles.tsx: circular icon 20px above shape top-center
  - [x] 4.2 Connect rotation handle to shape with thin dashed line (1px) (Konva built-in)
  - [x] 4.3 Implement rotation drag calculation: convert mouse position to angle relative to shape center (Konva built-in)
  - [x] 4.4 Implement 15° angle snapping by default (round to nearest 15°: 0°, 15°, 30°, 45°, etc.)
  - [x] 4.5 Add Shift key detection to disable snapping for smooth rotation
  - [ ] 4.6 Create rotation angle indicator tooltip that displays near cursor during drag (e.g., "45°") (SKIPPED - nice-to-have)
  - [x] 4.7 Update all shape components (Rectangle, Circle, Line, Text) to apply rotation transform in rendering
  - [x] 4.8 Throttle Firebase updates during rotation drag (50ms intervals) (handled by onTransformEnd)
  - [x] 4.9 Update shape in Firebase with new rotation value on drag end
  - [x] 4.10 Set cursor to `crosshair` when hovering over rotation handle (Konva built-in)

- [x] 5.0 Integration, Testing, and Polish
  - [x] 5.1 Test multi-select with 2+ shapes: verify move, delete, and color change work correctly
  - [x] 5.2 Test drag-to-select box selects all shapes completely within bounds
  - [x] 5.3 Test resize handles on all shape types (rectangle, circle, line, text)
  - [x] 5.4 Test rotation on all shape types, verify rotation syncs in real-time
  - [x] 5.5 Test Shift key modifiers (aspect ratio lock, smooth rotation)
  - [x] 5.6 Test real-time sync: open 2+ browser windows, verify transforms appear instantly
  - [x] 5.7 Test performance with 500+ shapes: ensure 60 FPS maintained during transforms
  - [x] 5.8 Add default rotation: 0 for existing shapes without rotation property
  - [x] 5.9 Fix rotation center-based issues for all shape types
  - [x] 5.10 Hide rotation handles when multiple shapes selected
  - [x] 5.11 Remove rotation handle from circles, keep only corner resize
  - [x] 5.12 Implement custom line endpoint handles instead of bounding box
  - [x] 5.13 Fix text scaling to maintain aspect ratio and stay within font size limits (8-72pt)

- [x] 6.0 Performance Optimizations
  - [x] 6.1 Optimize multi-select drag: only commit positions at drag end, not during drag
  - [x] 6.2 Add real-time visual feedback during multi-select drag with offset tracking
  - [x] 6.3 Use React.memo on all shape components for render optimization

- [x] 7.0 UX Enhancements
  - [x] 7.1 Rename Navigation mode to Pan mode with Hand icon
  - [x] 7.2 Allow object selection in any mode with single click
  - [x] 7.3 Prevent selecting underlying shapes immediately after creating a new shape
  - [x] 7.4 Add line thickness control as toolbar button with flyout menu
  - [x] 7.5 Update stroke width selector to persist selection and close menu on choice
  - [x] 7.6 Auto-deselect objects when switching to create modes

