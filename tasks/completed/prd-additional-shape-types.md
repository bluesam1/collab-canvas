# Feature PRD: Additional Shape Types

## Introduction/Overview

This feature adds three new shape types (Circle, Line, and Text) to the CollabCanvas application, expanding the creative capabilities beyond the existing Rectangle shape. This foundational feature is critical for enabling the AI Canvas Agent, which requires multiple shape types to be useful. The feature maintains consistency with existing interaction patterns while introducing new creation methods appropriate for each shape type.

**Problem Solved:** Currently, users can only create rectangles, severely limiting the creative potential of the canvas. The AI agent also needs multiple shape types to perform meaningful operations.

**Goal:** Enable users to create, edit, and collaborate on Circle, Line, and Text shapes with the same real-time sync and interaction patterns as existing Rectangle shapes.

## Goals

1. **Primary Goal:** Implement three new shape types (Circle, Line, Text) with full creation, editing, and collaboration capabilities
2. **Consistency Goal:** Maintain identical interaction patterns with existing Rectangle shapes (selection, dragging, deletion, color changes)
3. **Performance Goal:** Achieve 60 FPS rendering with 500+ mixed shapes on canvas
4. **Sync Goal:** Ensure all new shapes participate in real-time collaboration with existing Firebase patterns
5. **Foundation Goal:** Prepare canvas capabilities for AI agent integration (Priority 3)

## User Stories

### Circle Shape Stories
- **As a user**, I want to create circles by clicking and dragging from center to edge, so that I can draw circular elements in my designs
- **As a user**, I want to resize circles by dragging corner handles, so that I can adjust the size after creation
- **As a user**, I want to change circle colors using the color palette, so that I can match my design theme

### Line Shape Stories  
- **As a user**, I want to create lines by clicking and dragging from start to end point, so that I can draw connecting elements and arrows
- **As a user**, I want to adjust line stroke width, so that I can create both thin and thick lines as needed
- **As a user**, I want to move lines by dragging them, so that I can reposition them after creation

### Text Shape Stories
- **As a user**, I want to add text by clicking on the canvas, so that I can label elements and add descriptions
- **As a user**, I want to edit text by double-clicking, so that I can modify content without recreating the shape
- **As a user**, I want to change text font size and color, so that I can create readable, styled text elements

### Collaboration Stories
- **As a collaborator**, I want to see other users creating and editing all shape types in real-time, so that we can work together effectively
- **As a collaborator**, I want to see presence indicators and cursors for all shape operations, so that I understand what others are working on

## Functional Requirements

### 1. Circle Shape Requirements
1.1. The system must allow users to create circles by clicking and dragging from center point
1.2. The system must enforce minimum radius of 5px and maximum radius of 1000px during creation
1.3. The system must store circle properties: centerX, centerY, radius, fill color
1.4. The system must allow circle selection, dragging, and deletion using existing patterns
1.5. The system must support circle color changes through the color palette
1.6. The system must render circles with smooth edges using appropriate anti-aliasing

### 2. Line Shape Requirements
2.1. The system must allow users to create lines by clicking and dragging from start to end point
2.2. The system must enforce minimum length of 10px and maximum length of 5000px during creation
2.3. The system must store line properties: x1, y1, x2, y2, stroke color, stroke width
2.4. The system must set default stroke width to 2px for new lines
2.5. The system must allow line selection, dragging, and deletion using existing patterns
2.6. The system must support line color and stroke width changes
2.7. The system must render lines with smooth edges and proper stroke caps

### 3. Text Shape Requirements
3.1. The system must allow users to create text by clicking on canvas (no drag required)
3.2. The system must open inline text editor immediately after click
3.3. The system must store text properties: x, y, text content, font size (8-72px), color
3.4. The system must allow text editing by double-clicking existing text
3.5. The system must show visual indication (cursor/selection) when text is in edit mode
3.6. The system must finish editing when user clicks outside or presses Enter
3.7. The system must support single-line text only for MVP
3.8. The system must allow text selection, dragging, and deletion using existing patterns
3.9. The system must support text color and font size changes

### 4. Toolbar Integration Requirements
4.1. The system must add four shape type buttons to toolbar: Rectangle, Circle, Line, Text
4.2. The system must highlight the currently selected shape type
4.3. The system must set Rectangle as default selected tool when canvas loads
4.4. The system must switch creation mode when different shape type is selected

### 5. Real-time Collaboration Requirements
5.1. The system must sync all new shape types to Firebase using existing patterns
5.2. The system must support presence indicators and cursor tracking for all shape operations
5.3. The system must handle optimistic updates with rollback on Firebase write failures
5.4. The system must maintain real-time sync for all shape properties (position, size, color, content)

### 6. Performance Requirements
6.1. The system must maintain 60 FPS rendering with 500+ mixed shapes on canvas
6.2. The system must throttle Firebase updates during drag operations
6.3. The system must use Konva caching for complex shapes when beneficial
6.4. The system must handle shape creation, selection, and dragging without performance degradation

### 7. Data Structure Requirements
7.1. The system must add `type` field to shape objects in Firebase
7.2. The system must maintain backward compatibility with existing Rectangle shapes
7.3. The system must store all shape properties in consistent Firebase structure
7.4. The system must handle shape type validation and error recovery

## Non-Goals (Out of Scope)

1. **Multi-line Text:** Single-line text only for MVP
2. **Text Formatting:** No bold, italic, or font family changes
3. **Shape Grouping:** No grouping or ungrouping of shapes
4. **Shape Locking:** No ability to lock shapes from editing
5. **Custom Shapes:** No user-defined or imported shape types
6. **Shape Templates:** No pre-defined shape templates or libraries
7. **Advanced Text Features:** No text alignment, line spacing, or paragraph formatting
8. **Shape Animation:** No animation or transition effects
9. **Shape Cloning:** No duplicate/copy functionality (handled in later priorities)
10. **Shape Layers:** No z-index management or layer ordering (handled in later priorities)

## Design Considerations

### Visual Design
- **Shape Type Icons:** Use clear, recognizable icons for Circle, Line, and Text in toolbar
- **Selection Indicators:** Maintain consistent selection styling across all shape types
- **Text Editing:** Show clear visual feedback when text is in edit mode (cursor, selection highlight)
- **Color Consistency:** Use existing color palette for all new shape types

### User Experience
- **Creation Patterns:** Maintain familiar click-and-drag for Circle/Line, click-to-place for Text
- **Editing Flow:** Double-click to edit text should feel natural and intuitive
- **Tool Switching:** Clear visual indication of currently selected tool
- **Error States:** Graceful handling of invalid inputs and network failures

### Accessibility
- **Keyboard Navigation:** Support existing keyboard shortcuts (Delete, etc.) for all shape types
- **Screen Readers:** Ensure shape types are properly labeled for assistive technology
- **Focus Management:** Maintain proper focus handling during text editing

## Technical Considerations

### Architecture
- **Component Reuse:** Follow existing Rectangle component pattern for consistency
- **Context Integration:** Use existing CanvasContext for state management
- **Firebase Integration:** Extend existing Firebase patterns for new shape types
- **Type Safety:** Maintain TypeScript strict mode compliance

### Dependencies
- **Konva Integration:** Use appropriate Konva shapes (Circle, Line, Text) for rendering
- **React Patterns:** Follow existing React.memo patterns for performance
- **Firebase Schema:** Extend existing Firebase data structure with type field

### Performance
- **Rendering Optimization:** Use React.memo for all new shape components
- **Firebase Throttling:** Implement throttling for rapid updates during drag operations
- **Memory Management:** Ensure proper cleanup of event listeners and Firebase subscriptions

### Error Handling
- **Input Validation:** Validate text input, trim whitespace, handle edge cases
- **Network Resilience:** Implement optimistic updates with proper rollback mechanisms
- **Shape Constraints:** Enforce size limits during creation and editing

## Success Metrics

### Functional Success
- [ ] All 3 shape types (Circle, Line, Text) are creatable and editable
- [ ] Real-time sync works for all new shape types
- [ ] Performance maintains 60 FPS with 500+ mixed shapes
- [ ] Text editing works smoothly with double-click and inline editing
- [ ] All shapes integrate with existing selection, dragging, and deletion patterns

### User Experience Success
- [ ] Users can switch between shape types intuitively
- [ ] Text editing feels natural and responsive
- [ ] All shapes maintain consistent visual styling
- [ ] Real-time collaboration works seamlessly across all shape types

### Technical Success
- [ ] Firebase data structure supports all new shape types
- [ ] Performance benchmarks are met under load testing
- [ ] Error handling gracefully manages edge cases
- [ ] Code follows existing patterns and maintains consistency

## Implementation Decisions

### Text Font Family
**Decision:** Use system default font family for consistency with user's system and simplicity. This ensures text looks familiar to users and reduces complexity.

### Line End Caps
**Decision:** Use rounded end caps for a modern, professional appearance. This provides better visual consistency and a softer look that works well in collaborative environments.

### Shape Naming
**Decision:** Skip shape naming for MVP to maintain focus on core functionality. Auto-generated names can be added in future iterations if needed.

### Undo/Redo Integration
**Decision:** Skip undo/redo for this feature as it's handled in Priority 4 (Advanced Features) according to PRD_Phase2.md. This keeps the scope focused and prevents feature overlap.

### Mobile Support
**Decision:** Focus on desktop/web experience for MVP. Mobile touch interactions can be addressed in future iterations once core functionality is solid.

### Shape Validation
**Decision:** Implement only the specified size constraints (5px-1000px radius, 10px-5000px length, 8-72px font) plus basic text content validation (trim whitespace, prevent empty text). Additional validation can be added based on user feedback.

---

**Target Completion:** 4-6 hours | **Points Value:** +4-6 (Section 2: 10-14/20) | **Priority:** Foundation for AI Agent
