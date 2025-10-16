# CollabCanvas PRD - Rubric-Optimized Priorities

**Deadline:** Sunday Evening | **Early Submission:** Friday Evening  
**Current Score:** ~50/100 | **Target Score:** 85-90/100

**⚡ Strategy Change:** Building shapes & transforms BEFORE AI agent (dependencies first, then AI can leverage full capabilities)

---

## Current State Summary

### Complete ✅ (43/100 points)
- **Section 1:** Real-time sync, conflict resolution, persistence (28/30 pts)
- **Section 5:** Architecture & authentication (9/10 pts)  
- **Section 6:** Documentation & deployment (5/5 pts)
- Canvas ownership/sharing (PR_15 complete but not scored)

### Critical Gaps 🚨 (57+ points available)
**Build Order Rationale:** Shapes & transforms are foundational. AI agent depends on these capabilities to be useful.

1. **Section 2:** Canvas features (6/20 pts) - Missing shapes, transforms → Build FIRST
2. **Section 4:** AI Canvas Agent (0/25 pts) - Needs shapes to work with → Build SECOND  
3. **Section 3:** Advanced features (2/15 pts) - Polish features → Build THIRD

---

## Priority 1: Additional Shape Types (4-6 points - FOUNDATION)

**Why First:** AI agent needs multiple shape types to be useful. Building shapes first prevents rework later.

**What to Build:**

### Circle Shape
- Click-and-drag creation (radius from center)
- Properties: centerX, centerY, radius, fill color
- Min radius: 5px, Max: 1000px

### Line Shape  
- Click-and-drag creation (start to end point)
- Properties: x1, y1, x2, y2, stroke color, stroke width
- Min length: 10px, Max: 5000px

### Text Shape
- Click to place, opens input for content
- Double-click to edit existing text
- Properties: x, y, text content, font size (8-72px), color
- Single-line only for MVP

**Implementation Notes:**
- Add shape type selector to toolbar (Rectangle/Circle/Line/Text buttons)
- Update Canvas creation logic to handle different shape patterns
- Ensure all shapes work with existing selection, dragging, deletion, real-time sync

**Success Criteria:**
- [ ] All 3 shape types creatable and editable
- [ ] Real-time sync works for all shapes
- [ ] Performance: 60 FPS with 500+ mixed shapes
- [ ] Text editable on double-click

**Time Estimate:** 4-6 hours | **Points:** +4-6 (Section 2: 10-14/20)

---

## Priority 2: Multi-Select & Transforms (3-4 points - FOUNDATION)

**Why Second:** AI agent needs to manipulate shapes (resize, rotate). Multi-select enables powerful AI commands like "arrange these shapes in a grid."

**Multi-Select:**
- Shift+click to add shapes to selection
- Drag-to-select box (rectangular selection area)
- Visual indication of multiple selected shapes
- Group operations on selected shapes (move, delete, color change)

**Transform Operations:**
- Resize handles on selected shapes (8-point corner/edge handles)
- Rotation handle above shape
- Maintains aspect ratio with Shift key
- Updates in real-time for all users
- Works for all shape types (rectangle, circle, line, text)

**Implementation Notes:**
- Update selection system to handle arrays of shape IDs
- Add transform handles component that appears on selection
- Implement drag handlers for resize/rotate
- Update Firebase to sync transform operations

**Success Criteria:**
- [ ] Can select multiple shapes via Shift+click
- [ ] Drag-to-select creates selection box
- [ ] Resize handles work on all shape types
- [ ] Rotation handle rotates shapes smoothly
- [ ] Multi-select enables group move/delete/color change
- [ ] All transforms sync in real-time

**Time Estimate:** 4-6 hours | **Points:** +3-4 (Section 2: 15-18/20)

---

## Priority 3: AI Canvas Agent (25 points - CRITICAL)

**What to Build:**
Natural language AI that creates and manipulates canvas shapes using function calling.

**Core Requirements:**
- 8+ distinct commands across 4 categories
- **Creation:** "Create red rectangle at 100,200", "Add circle with radius 50", "Make a text layer 'Hello'"
- **Manipulation:** "Move blue rectangle to center", "Rotate text 45 degrees", "Resize circle to twice its size"
- **Layout:** "Arrange shapes in 3x3 grid", "Space elements evenly", "Align shapes to left"
- **Complex:** "Create login form" (must produce text labels + input rectangles + button, properly aligned), "Build nav bar with 4 menu items"

**Technical Requirements:**
- OpenAI/Anthropic function calling integration
- Sub-2 second response time
- Real-time sync to all users
- Access to canvas state for context-aware operations
- Tool schema covering: create (all shape types), move, resize, rotate, color, delete, align, distribute

**Key Tools/Functions Needed:**
- `createRectangle(x, y, width, height, color)`
- `createCircle(x, y, radius, color)`
- `createLine(x1, y1, x2, y2, color, width)`
- `createText(x, y, text, fontSize, color)`
- `moveShapes(shapeIds, x, y)` - absolute or relative positioning
- `resizeShapes(shapeIds, scale)` - scale factor
- `rotateShapes(shapeIds, degrees)` - rotation amount
- `changeColor(shapeIds, color)`
- `deleteShapes(shapeIds)`
- `getCanvasState()` - returns all shapes for context
- `selectShapes(shapeIds)` - select specific shapes
- `arrangeInGrid(shapeIds, rows, cols, spacing)` - layout shapes
- `alignShapes(shapeIds, alignment)` - left/right/center/top/bottom
- `distributeShapes(shapeIds, direction)` - horizontal/vertical spacing

**Complex Command Examples:**

*"Create a login form"* should execute:
1. Create text "Username" at (100, 100)
2. Create rectangle (input field) at (100, 130), 200x40px
3. Create text "Password" at (100, 190)
4. Create rectangle (input field) at (100, 220), 200x40px
5. Create rectangle (button) at (100, 280), 200x40px, different color
6. Create text "Login" centered in button

*"Build a navigation bar with 4 menu items"* should execute:
1. Create rectangle (nav container) at (0, 0), full width x 60px
2. Create text "Home" at (20, 20)
3. Create text "About" at (120, 20)
4. Create text "Services" at (220, 20)
5. Create text "Contact" at (320, 20)

**Success Criteria:**
- [ ] 8+ working commands covering all categories
- [ ] "Create login form" produces 6+ elements in proper layout
- [ ] All users see AI-generated shapes in real-time
- [ ] Sub-2 second responses
- [ ] 90%+ command success rate
- [ ] AI can manipulate all shape types (rectangle, circle, line, text)
- [ ] AI can use transforms (resize, rotate)
- [ ] AI can work with multi-select (arrange, align, distribute)

**Time Estimate:** 8-10 hours | **Points:** 22-25/25

---

## Priority 4: Quick Advanced Features (8-11 points)

**Why:** High point-to-effort ratio. These features are straightforward to implement and significantly boost Section 3 score.

### Undo/Redo (Tier 1 - 2 points)
- Maintain history stack (50 operations deep)
- Keyboard shortcuts: Cmd+Z (undo), Cmd+Shift+Z (redo)
- Track: create, move, resize, delete, color change
- Sync undo/redo to all users
**Time:** 3-4 hours

### Export PNG (Tier 1 - 2 points)
- Export button in toolbar
- Use Konva's `stage.toDataURL()` 
- Download as "canvas-[name]-[timestamp].png"
- Exports entire visible canvas
**Time:** 1-2 hours

### Keyboard Shortcuts (Tier 1 - 2 points)
- Cmd+D: Duplicate selected
- Arrow keys: Nudge 1px (10px with Shift)
- Cmd+A: Select all
- Cmd+C/V: Copy/paste
- Delete: Delete selected (already implemented)
**Time:** 2-3 hours

### Layers Panel (Tier 2 - 3 points)
- Panel showing all shapes as list
- Display: shape icon + name
- Drag to reorder (z-index)
- Click to select
- Position: sidebar or floating panel
**Time:** 4-5 hours

### Alignment Tools (Tier 2 - 3 points)
- Toolbar buttons: Align left, right, center, top, bottom
- Distribute horizontally/vertically
- Align relative to canvas or selection bounds
- Works on multi-selected shapes
**Time:** 3-4 hours

**Success Criteria:**
- [ ] Undo/redo works for all operations
- [ ] PNG export produces correct image
- [ ] All keyboard shortcuts functional
- [ ] Layers panel shows all shapes and allows reordering
- [ ] Alignment tools properly arrange selected shapes

**Combined Time:** 13-18 hours | **Points:** +8-11 (Section 3: 10-13/15)

---

## Priority 4: Multi-Select & Transforms (3-4 points)

**Why:** Increases Section 2 score to near-maximum.

**Multi-Select:**
- Shift+click to add shapes to selection
- Drag-to-select box (rectangular selection area)
- Visual indication of multiple selected shapes
- Group operations on selected shapes

**Transform Operations:**
- Resize handles on selected shapes (8-point handles)
- Rotation handle above shape
- Maintains aspect ratio with Shift key
- Updates in real-time for all users

**Success Criteria:**
- [ ] Can select multiple shapes via Shift+click
- [ ] Drag-to-select creates selection box
- [ ] Resize handles work on all shape types
- [ ] Rotation handle rotates shapes smoothly

**Time Estimate:** 4-6 hours | **Points:** +3-4 (Section 2: 15-18/20)

---

## Implementation Timeline

### Friday (Must Complete for Early Submission)
**Goal:** Submit working AI agent + additional shapes

**Morning/Afternoon (8 hours):**
- AI Canvas Agent core implementation
- Test all 8+ command types
- Ensure complex commands work (login form, nav bar)

**Evening (3 hours):**  
- Circle, Line, Text shapes
- Update toolbar and creation logic
- Quick testing

**Friday Submission Score:** ~78-80/100 (C+/B-)

---

### Saturday (Polish & Advanced Features)
**Goal:** Add quick-win advanced features

**Morning (6 hours):**
- Undo/Redo system
- Export PNG
- Enhanced keyboard shortcuts

**Afternoon (5 hours):**
- Layers panel
- Alignment tools
- Integration testing

**Evening (2 hours):**
- Bug fixes
- Performance optimization
- Documentation updates

---

### Sunday (Final Polish & Submission)
**Goal:** Multi-select, final testing, demo video

**Morning (4 hours):**
- Multi-select implementation
- Transform operations (resize, rotate)
- Final integration testing

**Afternoon (3 hours):**
- Record demo video (3-5 minutes)
  - Show real-time collaboration (2 browser windows)
  - Demonstrate AI commands
  - Show advanced features
  - Explain architecture
- Write AI Development Log (1 page)
  - Tools used (Claude, Cursor, etc.)
  - Prompting strategies
  - % AI-generated vs hand-written
  - Strengths & limitations

**Evening:**
- Final deployment
- README updates
- Submit by 10:59 PM CT

**Final Submission Score:** ~85-90/100 (B/A-)

---

## Grade Projection

| Priority | Time | Points Gained | Cumulative Score |
|----------|------|---------------|------------------|
| Current State | - | - | 50/100 (F) |
| Priority 1: AI Agent | 8-10h | +22-25 | 72-75/100 (C) |
| Priority 2: Shapes | 4-6h | +4-6 | 78-80/100 (C+/B-) |
| **Friday Submission** | **12-16h** | **+26-31** | **~78/100** |
| Priority 3: Advanced Features | 13-18h | +8-11 | 86-91/100 (B+/A-) |
| Priority 4: Multi-select | 4-6h | +3-4 | 89-95/100 (A-/A) |
| **Sunday Final** | **29-40h** | **+37-46** | **~87-90/100** |

---

## Risk Mitigation

**If Running Behind Schedule:**

**Drop Priority 4** (Advanced Features)
- Focus: Shapes → Multi-select/Transforms → AI Agent only
- Still achieves 79-85/100 (C+/B)
- AI agent is fully functional but missing polish features

**Minimum Viable Friday Submission:**
- All 3 shape types working (Circle, Line, Text)
- Basic multi-select (Shift+click, no drag-to-select box)
- Basic transforms (resize only, skip rotation)
- Score: ~58-60/100 (F/D-)
- Sets foundation for Saturday AI work

**Minimum Viable Saturday Submission:**
- Complete Friday work above
- AI Agent with 8 basic commands working (even if imperfect)
- Skip complex commands if struggling
- Score: ~75-80/100 (C/C+)

**Time Savers:**
- Skip rotation transforms (resize only)
- Skip drag-to-select box (Shift+click only)
- Simple AI tool schema (fewer layout functions)
- Skip optional advanced features (layers panel, alignment tools)
- Basic demo video (2 minutes instead of 5)

---

## Testing Priorities

**Must Test (Critical for Points):**
- [ ] All 3 shape types (circle, line, text) creatable and editable
- [ ] Multi-select works via Shift+click
- [ ] Resize and rotate transforms work on all shapes
- [ ] Real-time sync works with all shape types and transforms
- [ ] AI agent: all 8+ commands work correctly across all shape types
- [ ] AI complex commands: login form has 3+ elements, properly arranged
- [ ] All users see AI-generated shapes in real-time
- [ ] Sub-2 second AI response time
- [ ] Performance: 60 FPS with 500+ mixed shapes

**Should Test (Important but not scoring):**
- [ ] Canvas ownership/sharing works correctly
- [ ] Browser compatibility (Chrome, Firefox, Safari)
- [ ] Error handling for AI failures
- [ ] Keyboard shortcuts don't conflict

**Nice to Test (Polish):**
- [ ] Mobile responsiveness
- [ ] Slow network performance
- [ ] 5+ concurrent users

---

## Success Metrics

**Minimum Success (Pass):**
- 3 shape types working (rectangle, circle, text)
- Basic multi-select and resize transforms
- AI agent functional with 6+ basic commands
- Score: 70-75/100 (C)

**Target Success (Good Grade):**
- All shape types + full multi-select + resize & rotate transforms
- AI agent excellent with 8+ commands, complex operations working
- Undo/redo + export PNG + keyboard shortcuts
- Score: 82-87/100 (B-/B+)

**Stretch Success (Excellent Grade):**
- Everything above + layers panel + alignment tools
- AI agent perfect with sub-2 second responses, 95%+ accuracy
- Score: 88-93/100 (A-/A)

---

## Key Implementation Notes

**Shape Priority (Foundation First):**
- Build all shape types before starting AI agent
- Ensures AI can leverage full canvas capabilities from the start
- Prevents having to retrofit AI commands later
- Makes testing more comprehensive

**AI Agent (Depends on Shapes):**
- Use OpenAI GPT-4 or Claude with function calling
- Store API key in environment variables
- Implement retry logic for API failures
- Show clear "AI is thinking" indicator
- Allow users to cancel long-running operations
- Tool schema must cover all shape types (rectangle, circle, line, text)

**Shape Types:**
- Reuse Rectangle component pattern for consistency
- All shapes must support: creation, selection, dragging, deletion, color change
- Add resize and rotate transforms for all shape types
- Add shape type icons to toolbar

**Multi-Select & Transforms:**
- Selection system needs to handle arrays, not just single ID
- Transform handles should work universally on all shapes
- Shift+click is minimum viable, drag-to-select is nice-to-have
- Resize maintains aspect ratio with Shift key held

**Advanced Features:**
- Undo/redo: use command pattern or snapshot approach
- Export: leverage Konva built-in methods
- Keyboard shortcuts: use global event listeners, disable during text input
- Layers panel: can be simple list, drag-and-drop optional
- Alignment: calculate bounds, apply transformations

**Performance:**
- Throttle Firebase updates during drag operations
- Use Konva caching for complex shapes
- Limit undo history to prevent memory issues
- Debounce AI command input
- Test with 500+ shapes regularly