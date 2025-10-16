# Feature PRD: Multi-Select & Transform Operations

**Feature Name:** Multi-Select & Transform Operations  
**Priority:** P2 (Foundation - before AI Agent)  
**Estimated Points:** 3-4 points (Section 2)  
**Time Estimate:** 4-6 hours  
**Dependencies:** Additional Shape Types (Circle, Line, Text)

---

## 1. Introduction/Overview

This feature adds professional canvas manipulation capabilities by enabling users to select multiple shapes and transform individual shapes through resize and rotation operations. Multi-select enables efficient workflow when working with multiple canvas objects, while transform operations provide fine-grained control over shape appearance.

**Problem Solved:** Currently, users can only select and drag one shape at a time, and cannot resize or rotate shapes after creation. This limits the expressiveness and precision of canvas designs.

**Key Constraint:** Multi-select operations are limited to **moving only**. Individual shapes can be resized and rotated, but groups cannot.

---

## 2. Goals

1. Enable selection of multiple shapes for batch operations (move, delete, color change)
2. Provide resize handles for precise shape dimension control
3. Implement rotation capability for all shape types
4. Maintain real-time sync for all transform operations across users
5. Ensure transforms work consistently across all shape types (rectangle, circle, line, text)
6. Lay groundwork for AI agent to leverage transform operations

---

## 3. User Stories

**Multi-Select:**
- As a canvas user, I want to select multiple shapes with Shift+click so that I can move them together as a group
- As a canvas user, I want to drag a selection box to select multiple shapes so that I can quickly select many objects
- As a canvas user, I want to delete multiple selected shapes at once so that I can clean up my canvas efficiently
- As a canvas user, I want to change the color of multiple shapes simultaneously so that I can maintain consistent styling

**Transform - Resize:**
- As a canvas user, I want to resize shapes after creating them so that I can fine-tune my designs without recreating objects
- As a canvas user, I want resize handles on all four corners and sides so that I have precise control over shape dimensions
- As a canvas user, I want to maintain aspect ratio while resizing (with Shift key) so that my shapes don't become distorted

**Transform - Rotate:**
- As a canvas user, I want to rotate shapes by dragging a rotation handle so that I can create angled designs
- As a canvas user, I want rotation to snap to common angles (15° increments) so that I can easily create aligned layouts
- As a canvas user, I want to see the rotation angle while rotating so that I know the exact angle applied

**Real-time Collaboration:**
- As a collaborator, I want to see other users' transform operations in real-time so that I'm aware of ongoing changes
- As a collaborator, I want transform operations to sync immediately so that everyone sees the same canvas state

---

## 4. Functional Requirements

### Multi-Select (4.1-4.9)

**4.1** The system must allow users to add shapes to selection by Shift+clicking on shapes

**4.2** The system must provide a dedicated Select mode (toolbar button with BoxSelect icon, keyboard shortcut 'S')

**4.2.1** The system must allow users to create a drag-to-select box by clicking and dragging on empty canvas space while in Select mode

**4.3** The drag-to-select box must select only shapes that are completely contained within the selection rectangle (not just intersecting)

**4.4** The system must visually indicate all selected shapes with a selection outline/indicator

**4.5** The system must allow users to move all selected shapes together by dragging, maintaining their relative positions

**4.6** The system must allow users to delete all selected shapes by pressing Delete/Backspace key

**4.7** The system must allow users to change the color of all selected shapes simultaneously via the color picker

**4.8** The system must deselect all shapes when user clicks on empty canvas (without Shift key)

**4.9** The system must preserve multi-selection when switching between toolbar tools (e.g., selecting color)

**4.9.1** The system must allow Ctrl/Cmd+A keyboard shortcut to select all shapes on the canvas

**4.9.2** The system must allow objects to be selected in any mode (not just Pan/Select mode) with a single click

**4.9.3** The system must auto-deselect objects when switching from Pan/Select mode to any creation mode

**4.9.4** The system must prevent selecting underlying shapes immediately after finishing creating a new shape (to avoid accidental selection)

### Transform - Resize (4.10-4.18)

**4.10** The system must display 8 resize handles (4 corners, 4 edges) when a single shape is selected

**4.11** Resize handles must be 8x8px squares, colored for visibility (e.g., blue or black)

**4.12** Corner handles must allow resizing in both dimensions simultaneously

**4.13** Edge handles must constrain resizing to a single dimension (width or height)

**4.14** The system must maintain aspect ratio when Shift key is held during resize

**4.15** The system must enforce minimum shape size of 5x5px to prevent invisible shapes

**4.16** The system must enforce maximum shape size of 5000x5000px to prevent performance issues

**4.17** Resize handles must NOT appear when multiple shapes are selected (multi-select is move-only)

**4.18** The system must update shape dimensions in real-time during resize operation

### Transform - Rotation (4.19-4.25)

**4.19** The system must display a rotation handle above the selected shape (single selection only)

**4.20** The rotation handle must be visually distinct (e.g., circular icon, 12px above shape bounds)

**4.21** The system must rotate shapes around their geometric center point

**4.22** The system must snap rotation to 15° increments by default (0°, 15°, 30°, 45°, etc.)

**4.23** The system must allow smooth rotation without snapping when Shift key is held

**4.24** The system must display a tooltip/indicator showing current rotation angle (e.g., "45°")

**4.25** Rotation handle must NOT appear when multiple shapes are selected

### Shape-Specific Behaviors (4.26-4.28)

**4.26** **Circles:** Must maintain circular shape during resize (uniform scaling on both axes)

**4.26.1** **Circles:** Must not display rotation handle (rotation disabled for circles)

**4.26.2** **Circles:** Must display only corner resize handles (no edge handles)

**4.27** **Lines:** Must support rotation normally; resize affects line endpoints

**4.27.1** **Lines:** Must use custom endpoint handles instead of standard bounding box handles

**4.27.2** **Lines:** Endpoint handles must allow free movement to adjust both length and rotation

**4.28** **Text:** Resize must scale font size proportionally (not just container bounds)

**4.28.1** **Text:** Must maintain aspect ratio during scaling (lock to corner handles only)

**4.28.2** **Text:** Must enforce font size limits between 8pt and 72pt during scaling

**4.28.3** **Text:** Must prevent text from moving when scaling hits size limits

### Real-time Sync (4.29-4.32)

**4.29** The system must sync all transform operations (move, resize, rotate) to Firebase in real-time

**4.30** The system must throttle transform updates to Firebase during active dragging (e.g., every 50ms)

**4.30.1** **Performance:** For multi-select dragging, the system must only commit final positions to Firebase at drag end (not during drag)

**4.30.2** **Performance:** The system must provide real-time visual feedback during multi-select drag using local offset tracking

**4.30.3** **Performance:** All shape components must use React.memo to prevent unnecessary re-renders

**4.31** All users must see transform operations reflected in real-time (<100ms latency)

**4.32** Transform handles must only be visible to the user actively selecting the shape

### Visual Feedback (4.33-4.35)

**4.33** Drag-to-select box must have a dashed blue border (2px) with semi-transparent blue fill (opacity: 0.1)

**4.34** Selected shapes must have a visible selection indicator (e.g., blue outline, 2px stroke)

**4.35** Transform handles must provide visual feedback on hover (e.g., cursor change, highlight)

### Mode and Tool Enhancements (4.36-4.40)

**4.36** The Navigation mode must be renamed to "Pan" mode with a Hand icon for clarity

**4.37** The system must provide a line thickness control as a toolbar button (with current width displayed) that opens a flyout menu

**4.37.1** Line thickness menu must display stroke width options (1, 2, 3, 4, 6, 8, 12, 16, 20, 24 px) as visual circles

**4.37.2** Line thickness control must be visible when in line creation mode OR when at least one line is selected

**4.37.3** Selecting a thickness must update all selected lines and close the menu

**4.38** The stroke width selector must persist the user's selection to localStorage

**4.39** All toolbar mode buttons must provide keyboard shortcuts displayed in tooltips

**4.40** The Select mode toolbar button must use a BoxSelect icon (dashed square) to represent the drag-to-select functionality

---

## 5. Non-Goals (Out of Scope)

**5.1** Group resize/rotation operations (only move supported for multi-select)

**5.2** Custom rotation pivot point (always rotates around shape center)

**5.3** Skew/shear transforms

**5.4** 3D perspective transforms

**5.5** Transform animations/easing

**5.6** Flip horizontal/vertical operations

**5.7** Lock aspect ratio toggle UI (only Shift key modifier)

**5.8** Numeric input for precise dimensions/angles (handled via visual manipulation only)

---

## 6. Design Considerations

### Visual Design

**Selection Indicator:**
- 2px solid blue outline around selected shape bounds
- Outline should be visible against all background colors

**Resize Handles:**
- 8x8px solid squares
- Fill: white, Stroke: blue (2px)
- Corner handles: positioned at exact corners
- Edge handles: positioned at midpoint of each edge

**Rotation Handle:**
- 12px circular icon positioned 20px above top-center of shape bounds
- Icon: curved arrow or rotation symbol
- Connected to shape with thin line (1px, dashed)

**Drag-to-Select Box:**
- Border: 2px dashed blue (#3B82F6)
- Fill: semi-transparent blue (rgba(59, 130, 246, 0.1))
- Appears only during active drag gesture

**Rotation Angle Indicator:**
- Small tooltip near cursor showing angle (e.g., "45°")
- Appears only during rotation drag
- Auto-hides 500ms after release

### UX Patterns

**Cursor Changes:**
- Resize cursors: `nwse-resize`, `nesw-resize`, `ew-resize`, `ns-resize` based on handle
- Rotation cursor: `crosshair` or custom rotation cursor
- Move cursor: `move` when hovering over selected shapes

**Keyboard Shortcuts:**
- `V`: Switch to Pan mode
- `S`: Switch to Select mode (multi-select)
- `R`: Switch to Rectangle creation mode
- `C`: Switch to Circle creation mode
- `T`: Switch to Text creation mode
- `L`: Switch to Line creation mode
- Shift+click: Add to selection
- Ctrl/Cmd+A: Select all shapes
- Shift+drag (resize): Maintain aspect ratio
- Shift+drag (rotate): Smooth rotation (no snapping)
- Delete/Backspace: Delete selected shapes
- Escape: Deselect all

---

## 7. Technical Considerations

### Implementation Approach

**Multi-Select State:**
```typescript
// Update selection system to handle arrays
const [selectedIds, setSelectedIds] = useState<string[]>([]);
```

**Transform Handles Component:**
- Create `<TransformHandles>` component that renders when single shape selected
- Position absolutely based on shape bounds
- Handle drag events for resize/rotate
- Update shape properties via context

**Konva Integration:**
- Use Konva's `Transformer` component or build custom handles
- Consider using `react-konva`'s `Transformer` for built-in functionality
- Ensure transforms work with Konva's coordinate system

**Firebase Schema Updates:**
- Add `rotation` field to all shape objects (default: 0)
- Rotation stored in degrees (0-360)
- Existing shapes default to 0° rotation

**Performance Optimization:**
- Throttle Firebase writes during active transforms (50ms intervals)
- Use Konva layer caching for shapes not being transformed
- Batch multi-select operations into single Firebase transaction
- **Multi-Select Drag Performance:**
  - Track drag offset in local state for real-time visual feedback
  - Only commit final positions to Firebase at drag end (not during drag)
  - Apply offset to all selected shapes visually without triggering Firebase writes
  - Expected improvement: ~99.9% reduction in Firebase writes during multi-select drag
- **Component Optimization:**
  - Use React.memo on all shape components (Rectangle, Circle, Line, Text)
  - Prevent unnecessary re-renders when shapes not involved in current operation
- **Accidental Selection Prevention:**
  - Use ref flag to prevent selecting underlying shapes immediately after shape creation
  - Reset flag on next mousedown event

### Dependencies

**Required Before Starting:**
- Circle, Line, Text shape types must be complete
- All shape types must support basic selection and dragging

**Integration Points:**
- CanvasContext: Update shape operations to handle transforms
- Canvas.tsx: Add transform handles rendering and event handlers
- Toolbar: No changes required (uses existing selection/mode system)

---

## 8. Success Metrics

**Functionality:**
- ✅ All 5 selection methods work (single click, Shift+click, drag-to-select, select all, Select mode)
- ✅ Resize handles functional on all shape types with shape-specific behaviors
- ✅ Rotation handles functional on rectangles, lines, and text (disabled for circles)
- ✅ Multi-select operations work (move, delete, color change, line thickness)
- ✅ Custom line endpoint handles for intuitive line editing
- ✅ Objects selectable in any mode (not just Pan/Select)
- ✅ Selection prevention after shape creation to avoid accidental selections

**Performance:**
- ✅ ~99.9% reduction in Firebase writes during multi-select drag operations
- ✅ Real-time visual feedback with local offset tracking
- ✅ React.memo optimization on all shape components
- ✅ No visual lag during multi-select drag with 100+ objects

**Quality:**
- ✅ Transforms work consistently across all shape types
- ✅ Center-based rotation for all shapes
- ✅ Text scaling maintains aspect ratio with font size limits (8-72pt)
- ✅ Circle resize limited to corners with uniform scaling
- ✅ Handles appear/disappear correctly based on selection count
- ✅ Line thickness control with persistent localStorage
- ✅ Intuitive Pan mode with Hand icon
- ✅ BoxSelect icon clearly represents multi-select functionality

---

## 9. Implementation Phases

### Phase 1: Multi-Select Foundation (2 hours)
- Update selection state to handle arrays of IDs
- Implement Shift+click to add to selection
- Visual indication for multi-selected shapes
- Group move operation
- Group delete operation

### Phase 2: Resize Transforms (1.5 hours)
- Create resize handles component
- Implement 8-point handle positioning
- Handle drag events for resize operations
- Enforce min/max size constraints
- Add Shift key for aspect ratio lock
- Sync resize operations to Firebase

### Phase 3: Rotation Transforms (1.5 hours)
- Create rotation handle component
- Implement rotation calculation from drag
- Add angle snapping (15° increments)
- Add Shift key for smooth rotation
- Display rotation angle indicator
- Sync rotation operations to Firebase

### Phase 4: Polish & Testing (1 hour)
- Drag-to-select box implementation
- Shape-specific behavior (circles, text scaling)
- Cross-browser testing
- Multi-user collaboration testing
- Performance optimization

---

## 10. Priority Cutbacks (If Time-Constrained)

### Must-Have (Minimum Viable)
- ✅ Shift+click multi-select
- ✅ Basic resize handles (corners only, no aspect ratio lock)
- ✅ Basic rotation (no snapping)
- ✅ Multi-select move and delete

### Should-Have
- ⚠️ Edge resize handles (in addition to corners)
- ⚠️ Aspect ratio lock with Shift key
- ⚠️ Rotation angle snapping

### Nice-to-Have (Can Skip)
- ⭕ Drag-to-select box
- ⭕ Rotation angle indicator tooltip
- ⭕ Hover feedback on handles

---

## 11. Testing Checklist

### Multi-Select
- [ ] Shift+click adds shapes to selection
- [ ] Shift+click on selected shape removes it from selection
- [ ] Drag-to-select creates selection box
- [ ] Selection box selects all intersecting shapes
- [ ] Multi-selected shapes can be moved together
- [ ] Multi-selected shapes maintain relative positions during move
- [ ] Delete key removes all selected shapes
- [ ] Color picker applies to all selected shapes
- [ ] Click on empty space deselects all

### Resize
- [ ] Resize handles appear on single selected shape
- [ ] All 8 handles are clickable and functional
- [ ] Corner handles resize in both dimensions
- [ ] Edge handles resize in single dimension
- [ ] Shift key maintains aspect ratio
- [ ] Minimum size constraint (5x5px) enforced
- [ ] Maximum size constraint (5000x5000px) enforced
- [ ] Resize syncs to other users in real-time
- [ ] Circles remain circular during resize

### Rotation
- [ ] Rotation handle appears above selected shape
- [ ] Dragging rotation handle rotates shape
- [ ] Rotation snaps to 15° increments by default
- [ ] Shift key enables smooth rotation
- [ ] Rotation angle indicator displays during drag
- [ ] Rotation syncs to other users in real-time
- [ ] All shape types (rectangle, circle, line, text) can rotate

### Real-time Collaboration
- [ ] Other users see transforms in real-time
- [ ] Transform handles only visible to active user
- [ ] No conflicts when multiple users transform different shapes
- [ ] Performance remains smooth with 5+ concurrent users

### Performance
- [ ] 60 FPS maintained during transforms with 500+ shapes
- [ ] No memory leaks during extended transform sessions
- [ ] Throttling works correctly (updates every 50ms, not on every pixel)

---

## 12. Open Questions

**Q1:** Should we use Konva's built-in `Transformer` component or build custom transform handles?
- **Decision:** Start with custom handles for more control, fallback to Konva Transformer if time-constrained

**Q2:** How should rotation interact with shape dragging (should rotated shapes move differently)?
- **Decision:** Rotation affects visual appearance only, dragging still uses bounding box coordinates

**Q3:** Should undo/redo record every intermediate transform state or just the final state?
- **Decision:** Only record final state (on mouse release) to prevent history bloat

**Q4:** What happens if a user tries to resize a shape created by another user?
- **Decision:** All users can transform all shapes (canvas is fully collaborative)

---

## 13. AI Agent Integration Notes

This feature is a **critical dependency** for the AI Canvas Agent (Priority 3). The AI agent will leverage transform operations for:

- `resizeShapes(shapeIds, scale)` - uses resize transform logic
- `rotateShapes(shapeIds, degrees)` - uses rotation transform logic
- `arrangeInGrid()`, `alignShapes()`, `distributeShapes()` - all depend on transform capabilities

**Important:** Ensure transform operations have programmatic API (not just UI-driven) so AI agent can call them directly.

---

## Appendix: Data Schema

### Updated Shape Object
```typescript
interface BaseShape {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'text';
  x: number;           // center x position
  y: number;           // center y position
  fill: string;        // color
  rotation: number;    // NEW: rotation in degrees (0-360)
  createdBy: string;
  createdAt: number;
  updatedAt: number;
}

interface Rectangle extends BaseShape {
  type: 'rectangle';
  width: number;       // can be modified by resize
  height: number;      // can be modified by resize
}

interface Circle extends BaseShape {
  type: 'circle';
  radius: number;      // can be modified by resize
}

interface Line extends BaseShape {
  type: 'line';
  x2: number;          // end point x
  y2: number;          // end point y
  strokeWidth: number;
}

interface Text extends BaseShape {
  type: 'text';
  text: string;
  fontSize: number;    // can be scaled by resize
}
```

### Selection State
```typescript
interface CanvasState {
  selectedIds: string[];  // NEW: array instead of single ID
  // ... existing state
}
```

