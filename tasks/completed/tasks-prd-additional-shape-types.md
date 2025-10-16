# Task List: Additional Shape Types

Based on PRD: `prd/prd-additional-shape-types.md`

## Relevant Files

- `src/types/index.ts` - Update type definitions to include Circle, Line, and Text shapes
- `src/components/canvas/Circle.tsx` - New Circle shape component
- `src/components/canvas/Line.tsx` - New Line shape component  
- `src/components/canvas/Text.tsx` - New Text shape component
- `src/components/canvas/Text.tsx.test.tsx` - Unit tests for Text component
- `src/components/toolbar/ShapeSelector.tsx` - New toolbar component for shape type selection
- `src/components/toolbar/ShapeSelector.tsx.test.tsx` - Unit tests for ShapeSelector
- `src/components/toolbar/Toolbar.tsx` - Update existing toolbar to include shape selector
- `src/contexts/CanvasContext.tsx` - Update context to handle new shape types
- `src/hooks/useCanvas.ts` - Update canvas hook for new shape creation logic
- `src/utils/firebase.ts` - Update Firebase operations for new shape types
- `src/components/canvas/Canvas.tsx` - Update main canvas component to render new shapes
- `tests/circle.test.tsx` - Unit tests for Circle component
- `tests/line.test.tsx` - Unit tests for Line component  
- `tests/text.test.tsx` - Unit tests for Text component
- `tests/canvas.test.tsx` - Updated tests for Canvas component with new shapes

### Notes

- Unit tests are located in the `tests/` directory using Vitest framework
- Use `npm test` to run all tests, or `npm test -- --testPathPattern=circle` for circle-specific tests
- Follow existing patterns from Rectangle component for consistency
- Tests use `@testing-library/react` and `@testing-library/jest-dom` for assertions

## Tasks

- [x] 1.0 Update Type System and Data Structure
  - [x] 1.1 Add new shape type definitions to `src/types/index.ts` (Circle, Line, Text interfaces)
  - [x] 1.2 Update existing Rectangle interface to include `type: 'rectangle'` field
  - [x] 1.3 Create union type `ShapeType = 'rectangle' | 'circle' | 'line' | 'text'`
  - [x] 1.4 Update base Shape interface to include `type: ShapeType` field
  - [x] 1.5 Add type guards for shape type validation (`isCircle`, `isLine`, `isText`)

- [x] 2.0 Create Circle Shape Component
  - [x] 2.1 Create `src/components/canvas/Circle.tsx` with Konva Circle component
  - [x] 2.2 Implement click-and-drag creation logic (center to edge radius calculation)
  - [x] 2.3 Add radius constraints (5px min, 1000px max) during creation
  - [x] 2.4 Implement selection, dragging, and deletion using existing patterns
  - [x] 2.5 Add color change support through color palette integration
  - [x] 2.6 Add React.memo optimization for performance
  - [x] 2.7 Create unit tests for Circle component

- [x] 3.0 Create Line Shape Component
  - [x] 3.1 Create `src/components/canvas/Line.tsx` with Konva Line component
  - [x] 3.2 Implement click-and-drag creation logic (start to end point)
  - [x] 3.3 Add length constraints (10px min, 5000px max) during creation
  - [x] 3.4 Set default stroke width to 2px for new lines
  - [x] 3.5 Implement selection, dragging, and deletion using existing patterns
  - [x] 3.6 Add stroke color and width change support
  - [x] 3.7 Add rounded end caps for modern appearance
  - [x] 3.8 Add React.memo optimization for performance
  - [x] 3.9 Create unit tests for Line component

- [x] 4.0 Create Text Shape Component
  - [x] 4.1 Create `src/components/canvas/Text.tsx` with Konva Text component
  - [x] 4.2 Implement click-to-place creation (no drag required)
  - [x] 4.3 Add inline text editor that opens immediately after click
  - [x] 4.4 Implement double-click to edit existing text
  - [x] 4.5 Add visual indication (cursor/selection) when text is in edit mode
  - [x] 4.6 Implement click outside or Enter key to finish editing
  - [x] 4.7 Add font size constraints (8-72px) and color change support
  - [x] 4.8 Use system default font family for consistency
  - [x] 4.9 Add React.memo optimization for performance
  - [x] 4.10 Create unit tests for Text component

- [x] 5.0 Implement Shape Type Selection in Toolbar
  - [x] 5.1 Create `src/components/toolbar/ShapeSelector.tsx` component
  - [x] 5.2 Add four shape type buttons: Rectangle, Circle, Line, Text
  - [x] 5.3 Implement active/highlighted state for currently selected tool
  - [x] 5.4 Set Rectangle as default selected tool
  - [x] 5.5 Add clear, recognizable icons for each shape type
  - [x] 5.6 Update `src/components/toolbar/Toolbar.tsx` to include shape selector
  - [x] 5.7 Create unit tests for ShapeSelector component

- [x] 6.0 Update Canvas Context and Firebase Integration
  - [x] 6.1 Update `src/contexts/CanvasContext.tsx` to handle new shape types
  - [x] 6.2 Add shape type state management to context
  - [x] 6.3 Update `src/hooks/useCanvas.ts` for new shape creation logic
  - [x] 6.4 Update `src/utils/firebase.ts` to support new shape types in Firebase
  - [x] 6.5 Add `type` field to Firebase data structure
  - [x] 6.6 Ensure backward compatibility with existing Rectangle shapes
  - [x] 6.7 Implement optimistic updates with rollback for new shapes
  - [x] 6.8 Add throttling for Firebase updates during drag operations

- [x] 7.0 Update Main Canvas Component for New Shapes
  - [x] 7.1 Update `src/components/canvas/Canvas.tsx` to render all shape types
  - [x] 7.2 Add shape type switching logic based on selected tool
  - [x] 7.3 Implement different creation patterns (click-drag vs click-to-place)
  - [x] 7.4 Add shape type validation and error handling
  - [x] 7.5 Ensure all shapes work with existing selection, dragging, deletion
  - [x] 7.6 Update unit tests for Canvas component

- [x] 8.0 Testing and Performance Validation
  - [x] 8.1 Run comprehensive tests for all new shape types
  - [x] 8.2 Test real-time sync with multiple users and new shapes
  - [x] 8.3 Performance testing with 500+ mixed shapes (60 FPS target)
  - [x] 8.4 Test shape constraints and validation
  - [x] 8.5 Test text editing functionality (modal editing with formatting)
  - [x] 8.6 Test toolbar shape type switching
  - [x] 8.7 Test Firebase integration and error handling
  - [x] 8.8 Verify backward compatibility with existing Rectangle shapes
  - [x] 8.9 Fix text formatting persistence to database (bold, italic, underline, fontSize)
  - [x] 8.10 Update Firebase security rules to allow text formatting properties
  - [x] 8.11 Simplify text editing modal to single-line input
  - [x] 8.12 Streamline modal UI: remove header, buttons, and help text; add autofocus
  - [x] 8.13 Fix text formatting not persisting: update Firebase listener to parse bold/italic/underline
  - [x] 8.14 Fix Konva text rendering: separate fontStyle (italic) from fontWeight (bold)
  - [x] 8.15 Fix autofocus with setTimeout delay to ensure modal is fully rendered
  - [x] 8.16 Add save (check) and cancel (X) icon buttons next to text input
  - [x] 8.17 Fix bold text rendering: use combined fontStyle for bold and italic in Konva
  - [x] 8.18 Fix text modal not resetting: change initial text from 'Text' to empty string
  - [x] 8.19 Redesign toolbar with modern dark theme (zinc-900 background)
  - [x] 8.20 Replace color palette with flexible HexColorPicker from react-colorful
  - [x] 8.21 Add hover tooltips and visual feedback to all toolbar buttons
  - [x] 8.22 Reposition toolbar to right side of screen with gray-800 background to match header
  - [x] 8.23 Update toolbar to use fixed positioning below header (top-16)
  - [x] 8.24 Reposition toolbar to left side, full height, touching left edge with shadow
  - [x] 8.25 Fix selection not clearing when clicking empty space on canvas
  - [x] 8.26 Add info button at bottom of toolbar to toggle info panel visibility
  - [x] 8.27 Update info panel to show all shape modes and position next to toolbar
