# Task List: Advanced Canvas Tools (Export, Copy/Paste, Lasso, Multi-Select Transform, Nudging)

Generated from: `prd-canvas-tools.md`

## Relevant Files

- `src/components/toolbar/Toolbar.tsx` - Main toolbar component, add export and lasso buttons
- `src/components/canvas/Canvas.tsx` - Main canvas component, implement export, lasso drawing, transformer
- `src/contexts/CanvasContext.tsx` - Canvas state management, add clipboard state and copy/paste/duplicate logic
- `src/types/index.ts` - Type definitions, add clipboard types and lasso mode
- `src/hooks/useCanvas.ts` - Canvas hook, expose new functions
- `src/pages/CanvasEditorPage.tsx` - Main editor page, add keyboard event listeners
- `src/utils/canvasHelpers.ts` - Helper functions for point-in-polygon algorithm

### Notes

- Konva provides `toDataURL()` for export and `Transformer` component for multi-select transform
- Point-in-polygon algorithm uses ray casting method
- Clipboard state is internal (React state), not browser clipboard API
- Transform origin is handled automatically by Konva Transformer with opposite anchor behavior

## Tasks

- [x] 1.0 Implement Export Canvas as PNG
  - [x] 1.1 Add export button to toolbar with Download icon and tooltip
  - [x] 1.2 Add keyboard shortcut handler for Cmd/Ctrl+E in CanvasEditorPage
  - [x] 1.3 Implement handleExport function in Canvas component using stage.toDataURL()
  - [x] 1.4 Configure export options (pixelRatio: 2, mimeType: 'image/png', quality: 1)
  - [x] 1.5 Implement download trigger with filename `CollabCanvas_[timestamp].png`
  - [x] 1.6 Add success toast notification "Canvas exported successfully"
  - [x] 1.7 Add error handling with error toast for large canvas/memory issues
  - [x] 1.8 Prevent default browser behavior for Cmd+E shortcut

- [x] 2.0 Implement Copy/Paste/Duplicate Functionality
  - [x] 2.1 Add clipboard state to CanvasContext (objects array, pasteOffset number)
  - [x] 2.2 Implement handleCopy function - copy selected objects to clipboard state
  - [x] 2.3 Add copy toast notification showing count of copied objects
  - [x] 2.4 Implement handlePaste function - clone objects with incremental offset (+20px)
  - [x] 2.5 Generate new IDs for pasted objects and create in Firebase
  - [x] 2.6 Auto-select pasted objects and show "Pasted" toast
  - [x] 2.7 Increment pasteOffset on each paste operation
  - [x] 2.8 Implement handleCut function - copy then delete selected objects
  - [x] 2.9 Implement handleDuplicate function - clone with fixed +50px offset
  - [x] 2.10 Add keyboard shortcuts (Cmd/Ctrl+C/V/X/D) in CanvasEditorPage
  - [x] 2.11 Prevent default browser behavior for all shortcuts
  - [x] 2.12 Reset pasteOffset to 0 when copying new objects
  - [x] 2.13 Handle empty clipboard and empty selection gracefully (silent)

- [x] 3.0 Implement Lasso Selection Tool
  - [x] 3.1 Add 'lasso' to CanvasMode type in types/index.ts
  - [x] 3.2 Add lasso button to toolbar with lasso icon and tooltip "Lasso Select (L)"
  - [x] 3.3 Add keyboard shortcut handler for L key to toggle lasso mode
  - [x] 3.4 Add lasso path state (array of {x, y} points) to Canvas component
  - [x] 3.5 Implement mouse down handler - start lasso path with initial point
  - [x] 3.6 Implement mouse move handler - append points to lasso path
  - [x] 3.7 Implement mouse up handler - complete lasso and perform selection
  - [x] 3.8 Render lasso path as Konva Line with dashed stroke (blue, [5, 5])
  - [x] 3.9 Implement point-in-polygon algorithm (ray casting) in canvasHelpers
  - [x] 3.10 Calculate which objects have center point within lasso path
  - [x] 3.11 Update selectedIds with objects inside lasso
  - [x] 3.12 Clear lasso path and auto-exit to pan mode after selection
  - [x] 3.13 Handle lasso with < 3 points (no selection, silent exit)
  - [x] 3.14 Add Escape key handler to cancel lasso without selecting
  - [x] 3.15 Change cursor to crosshair when in lasso mode
  - [x] 3.16 Account for stage transform (pan/zoom) in coordinate calculations

- [x] 4.0 Implement Multi-Select Transform
  - [x] 4.1 Import Transformer from react-konva in Canvas component
  - [x] 4.2 Add transformerRef using useRef<Konva.Transformer>
  - [x] 4.3 Add selectedShapes state to track Konva shape node references
  - [x] 4.4 Implement useEffect to update transformer nodes when selection changes
  - [x] 4.5 Conditionally render Transformer when selectedIds.length > 1
  - [x] 4.6 Configure Transformer with all 8 anchors (corners + edges)
  - [x] 4.7 Set keepRatio={true} to always lock aspect ratio
  - [x] 4.8 Implement boundBoxFunc to enforce minimum size (5px)
  - [x] 4.9 Implement handleTransformEnd to get scale values from transformer
  - [x] 4.10 Calculate new positions and dimensions for all selected objects
  - [x] 4.11 Apply scale relative to transform origin (opposite point)
  - [x] 4.12 Handle different shape types (rectangles, circles, lines, text)
  - [x] 4.13 Use updateObjectsBatch to batch update all objects to Firebase
  - [x] 4.14 Reset transformer scale to 1 after applying to object dimensions
  - [x] 4.15 Ensure single-object selection still uses existing transformer behavior

- [x] 5.0 Implement Arrow Key Nudging
  - [x] 5.1 Add keyboard event listener in Canvas component for arrow keys
  - [x] 5.2 Detect ArrowUp, ArrowDown, ArrowLeft, ArrowRight key presses
  - [x] 5.3 Check that one or more shapes are selected before nudging
  - [x] 5.4 Prevent default browser behavior (page scrolling) for arrow keys
  - [x] 5.5 Calculate delta (±5px) based on arrow key direction
  - [x] 5.6 Capture undo snapshot before nudging (operation: 'modify')
  - [x] 5.7 Create batch updates object for all selected shapes
  - [x] 5.8 Handle different shape types (rectangles/text/lines use x/y, circles use centerX/centerY)
  - [x] 5.9 Apply updates to all selected shapes using updateObject
  - [x] 5.10 Ensure nudging doesn't trigger when focus is in input field
  - [x] 5.11 Test nudging syncs to Firebase and other users
  - [x] 5.12 Verify undo/redo works for nudge operations

- [x] 6.0 Testing and Refinement
  - [x] 6.1 Test export produces valid PNG with all objects
  - [x] 6.2 Test all keyboard shortcuts (Cmd+E/C/V/X/D, L key, Arrow keys)
  - [x] 6.3 Test copy/paste with incremental offset (20px, 40px, 60px)
  - [x] 6.4 Test duplicate with fixed 50px offset
  - [x] 6.5 Test lasso selection with various shapes and zoom levels
  - [x] 6.6 Test multi-select transform with 2+ objects
  - [x] 6.7 Test aspect ratio locking on corner handles
  - [x] 6.8 Test transform with mixed object types
  - [x] 6.9 Test arrow key nudging with single and multiple shapes
  - [x] 6.10 Test arrow key nudging with different shape types
  - [x] 6.11 Test real-time sync for all features with multiple users
  - [x] 6.12 Test edge cases (empty canvas, network disconnect, 100+ objects)
  - [x] 6.13 Verify no console errors during any operations
  - [x] 6.14 Test performance with large selections (50+ objects)

---

## Implementation Complete!

All tasks for the Advanced Canvas Tools feature are now defined and ready for implementation.

