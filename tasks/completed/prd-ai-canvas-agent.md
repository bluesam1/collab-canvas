# PRD: AI Canvas Agent

**Feature Name:** AI Canvas Agent  
**Priority:** P1 (Critical - 25 points)  
**Estimated Effort:** 8-10 hours  
**Target Completion:** Friday evening (early submission milestone)

---

## ⚡ Critical Performance Requirements (Rubric Scoring Criteria)

These requirements are **mandatory** for full points on Section 4 (AI Canvas Agent - 25 points):

1. **Sub-2 Second Response Time**: 90%+ of commands must complete in <2 seconds from submit to shapes appearing on canvas
2. **90%+ Command Success Rate**: Well-formed commands must execute correctly 90% of the time (manual testing with 20+ sample commands)
3. **Real-Time Sync**: All AI-generated shapes must sync to remote users in <100ms (existing system)
4. **8+ Working Commands**: Minimum 8 distinct commands across 4 categories (creation, manipulation, layout, complex)
5. **Complex Command Support**: "Create login form" must produce 6+ properly arranged elements

**⚠️ These are non-negotiable scoring criteria. Performance testing must verify all metrics before submission.**

---

## 1. Introduction/Overview

The AI Canvas Agent enables users to create and manipulate canvas shapes using natural language commands. Instead of manually clicking and dragging to create shapes, users can type commands like "create a red rectangle" or "arrange shapes in a 3x3 grid" and the AI will execute the appropriate actions on the canvas.

This feature transforms CollabCanvas from a manual drawing tool into an AI-assisted design platform, dramatically improving productivity for complex layouts and repetitive tasks.

**Problem it solves:**
- Creating multiple shapes with precise positioning is tedious
- Complex layouts (forms, navigation bars, grids) require many manual steps
- Repetitive operations (alignment, distribution) are time-consuming
- Users want to focus on design intent, not mechanical operations

**Goal:** Enable natural language control of canvas operations with <2 second response time and 90%+ command success rate.

---

## 2. Goals

1. **Primary Goal:** Implement AI-powered natural language interface for canvas operations with sub-2 second response time
2. **Command Coverage:** Support 8+ distinct commands across 4 categories (creation, manipulation, layout, complex)
3. **Reliability:** Achieve 90%+ success rate for well-formed commands
4. **Real-Time Sync:** All AI-generated shapes sync to all users in <100ms (existing system)
5. **Performance:** Handle complex commands creating up to 500 shapes without performance degradation
6. **User Experience:** Simple, intuitive interface that doesn't disrupt existing workflow

---

## 3. User Stories

### Core User Stories

**US-1: Basic Shape Creation**
> As a canvas user, I want to create shapes using natural language like "create red rectangle at 100,200" so that I can quickly add elements without manual clicking and dragging.

**US-2: Shape Manipulation**
> As a canvas user, I want to manipulate existing shapes with commands like "move blue rectangle to center" so that I can reposition elements without dragging.

**US-3: Layout Operations**
> As a canvas user, I want to arrange multiple shapes using commands like "arrange shapes in 3x3 grid" so that I can create structured layouts efficiently.

**US-4: Complex Commands**
> As a canvas user, I want to create multi-element layouts like "create a login form" so that I can build common UI patterns with a single command.

**US-5: Error Handling**
> As a canvas user, when the AI cannot understand my command, I want to receive a clear error message so that I can rephrase and try again.

### Stretch User Stories

**US-6: Selection-Based Operations**
> As a canvas user, I want the AI to operate on my selected shapes when I say "arrange in grid" so that I can control which shapes are affected.

**US-7: Contextual Commands**
> As a canvas user, I want the AI to understand context like "add another circle to the right" so that I can build on existing elements naturally.

---

## 4. Functional Requirements

### 4.1 User Interface

**FR-1.1:** Display an "AI Assistant" button in the top navigation bar of the canvas editor page, positioned to the right of the canvas name.

**FR-1.2:** When clicked, the AI Assistant button opens a floating chat panel positioned in the bottom-right corner of the canvas (above the canvas, not blocking content).

**FR-1.3:** The chat panel must include:
- Text input field (placeholder: "Describe what you want to create...")
- Submit button (icon: Send or Sparkles)
- Information button (icon: Info or HelpCircle, positioned next to close button)
- Close button (X icon)
- Loading spinner (shown during AI processing)
- Response area (shows success message or error)

**FR-1.4:** The chat panel must be draggable so users can reposition it as needed.

**FR-1.5:** The panel must close when clicking outside of it or pressing Escape key.

**FR-1.6:** When AI is processing, show a spinner in the response area with text "AI is thinking..."

**FR-1.7:** After command execution, show success message: "Done! Created/modified X shapes." or error message: "We couldn't figure out how to handle your request. Please try again."

**FR-1.8:** Clear the input field after successful command execution (but not after errors).

**FR-1.9:** When the information button is clicked, display a modal overlay showing available AI operations.

**FR-1.10:** The information modal must include:
- Modal title: "What can AI do?"
- Four categorized sections with user-friendly examples:
  - **Create Shapes**: Examples with natural language descriptions
  - **Move & Edit**: Examples showing manipulation commands
  - **Arrange & Align**: Examples showing layout commands
  - **Build Layouts**: Examples showing complex commands
- Each category should have 3-5 example commands
- Close button (X icon in top-right)
- Dismiss by clicking outside modal or pressing Escape

**FR-1.11:** Example commands in the information modal should be:
- Written in natural, conversational language
- Easy to understand for non-technical users
- Copy-able (user can click to copy example to input field)
- Grouped logically by what users want to accomplish

**FR-1.12:** Include an AI mode toggle in the chat panel header that switches between two modes:
- **Auto-apply mode** (default): AI executes commands immediately without confirmation
- **Confirm mode**: AI shows preview of planned changes and requires user confirmation before executing

**FR-1.13:** The AI mode toggle must:
- Be clearly labeled with current mode ("Auto" or "Confirm")
- Use a switch/toggle UI component (not checkbox)
- Be positioned in the chat panel header, visible at all times
- Show tooltip explaining the difference between modes
- Persist user's choice in browser localStorage (key: `ai-mode-preference`)

**FR-1.14:** In confirm mode, after AI processes the command:
- Display a confirmation panel showing:
  - Summary of planned changes (e.g., "Create 3 rectangles, 2 circles")
  - List of specific operations to be performed
  - "Apply Changes" button (primary action)
  - "Cancel" button (secondary action)
- Only execute operations when user clicks "Apply Changes"
- Clear confirmation panel on cancel or after applying changes

**FR-1.15:** Load AI mode preference from localStorage on panel open:
- Check for `ai-mode-preference` key (values: "auto" or "confirm")
- Default to "auto" mode if no preference exists
- Apply saved preference immediately when panel opens

### 4.2 AI Integration

**FR-2.1:** Use Firebase Cloud Functions as a secure backend for AI processing to prevent exposing API keys in the client.
- Client sends commands to Cloud Function endpoint
- Cloud Function handles OpenAI API calls server-side
- Cloud Function returns results or tool calls to client
- All API keys stored securely in Firebase Cloud Functions environment

**FR-2.2:** Use OpenAI Agents SDK for AI processing with function calling capabilities.
- Use OpenAI Agents SDK (formerly Assistants API) for structured agent interactions
- Recommended model: `gpt-4-turbo-preview` or `gpt-4-1106-preview`
- Model should be configurable via environment variable for easy updates
- Leverage built-in function calling and tool execution

**FR-2.3:** Store OpenAI API key in Firebase Cloud Functions environment (NOT client-side).
- Use Firebase CLI to set function secrets: `firebase functions:secrets:set OPENAI_API_KEY`
- Never expose API key in client code or environment variables
- Use environment variable for model configuration

**FR-2.4:** Create Firebase Cloud Function endpoint `processAICommand` that:
- Accepts HTTP POST requests with command text and canvas context
- Authenticates requests using Firebase Auth
- Calls OpenAI Agents SDK with function calling
- Returns tool calls or error response to client
- Implements server-side timeout (2 seconds max)
- Validates user has permission to access canvas

**FR-2.5:** Client-side integration with Cloud Function:
- Send authenticated HTTP requests to Cloud Function endpoint
- Include Firebase Auth token in request headers
- Include command text, canvas ID, canvas state, and viewport info
- Handle Cloud Function responses (success, error, timeout)
- Support both local emulator (development) and production Cloud Function endpoints

**FR-2.6:** Local development with Firebase Emulators:
- Use Firebase Emulator Suite to run Cloud Functions locally during development
- Configure client to connect to local emulator when in development mode
- Enable hot-reload for Cloud Functions during local development
- No need to deploy to Firebase for every code change during development

**FR-2.7:** If Cloud Function is unavailable or returns 403/401, disable AI Assistant button and show tooltip: "AI Assistant not available".

**FR-2.8:** Implement timeout of 2 seconds for Cloud Function calls. If exceeded, show error message.

**FR-2.9:** Rate limit AI commands to max 10 requests per minute per user (client-side throttling).

**FR-2.10:** Maximum 500 shapes created per single command. If AI attempts more, truncate and show warning.

### 4.3 Command Categories & Tools

#### Category 1: Creation Commands

**FR-3.1:** Implement `createRectangle(x, y, width, height, color)` tool
- Creates rectangle at specified position
- Example: "Create red rectangle at 100,200 with size 150x100"

**FR-3.2:** Implement `createCircle(x, y, radius, color)` tool
- Creates circle at specified center position
- Example: "Add blue circle with radius 50 at 300,300"

**FR-3.3:** Implement `createLine(x1, y1, x2, y2, color, strokeWidth)` tool
- Creates line from start to end point
- Example: "Draw a black line from 0,0 to 500,500"

**FR-3.4:** Implement `createText(x, y, text, fontSize, color)` tool
- Creates text shape at specified position
- Example: "Add text 'Hello World' at 200,100 in red"

#### Category 2: Manipulation Commands

**FR-3.5:** Implement `moveShapes(shapeIds, x, y, relative)` tool
- Moves shapes to absolute position or by relative offset
- If shapeIds empty, show error
- Example: "Move red rectangle to 500,500" or "Move all circles right by 100"

**FR-3.6:** Implement `resizeShapes(shapeIds, scaleFactor)` tool
- Resizes shapes by scale factor (e.g., 2.0 = double size)
- Respects min/max size constraints for each shape type
- Example: "Make blue circle twice as large"

**FR-3.7:** Implement `rotateShapes(shapeIds, degrees)` tool
- Rotates shapes by specified degrees (0-360)
- Only applies to rectangles, lines, text (not circles)
- Example: "Rotate rectangle 45 degrees"

**FR-3.8:** Implement `changeColor(shapeIds, color)` tool
- Changes fill color for rectangles/circles/text or stroke color for lines
- Example: "Change all rectangles to blue"

**FR-3.9:** Implement `deleteShapes(shapeIds)` tool
- Deletes specified shapes from canvas
- Example: "Delete all red shapes"

#### Category 3: Layout Commands

**FR-3.10:** Implement `arrangeInGrid(shapeIds, rows, cols, spacingX, spacingY)` tool
- Arranges shapes in grid pattern
- If shapeIds empty, use all shapes on canvas
- If shapes are selected, use only selected shapes
- Calculates positions to fit grid with specified spacing
- Example: "Arrange shapes in 3x3 grid with 20px spacing"

**FR-3.11:** Implement `alignShapes(shapeIds, alignment)` tool
- Aligns shapes (options: left, right, center, top, bottom)
- If shapeIds empty, show error (needs multiple shapes)
- Example: "Align all rectangles to the left"

**FR-3.12:** Implement `distributeShapes(shapeIds, direction)` tool
- Distributes shapes evenly (options: horizontal, vertical)
- If shapeIds empty, show error (needs multiple shapes)
- Example: "Distribute circles horizontally"

#### Category 4: Context & Query Commands

**FR-3.13:** Implement `getCanvasState()` tool
- Returns all shapes on canvas with their properties
- AI uses this to understand current canvas state before executing commands
- Automatically called by AI when needed

**FR-3.14:** Implement `selectShapes(shapeIds)` tool
- Programmatically selects shapes on canvas
- Updates selection state in CanvasContext
- Example: "Select all blue rectangles"

### 4.4 Smart Positioning

**FR-4.1:** When AI creates shapes without explicit coordinates, calculate "focal point" as the center of the current viewport (visible canvas area).

**FR-4.2:** Position new shapes near the focal point:
- Single shape: Place at focal point
- Multiple shapes: Arrange around focal point (grid or horizontal line)
- Forms/complex layouts: Start at focal point, expand downward/rightward

**FR-4.3:** When user specifies "center", interpret as canvas center (2500, 2500 for 5000x5000 canvas).

**FR-4.4:** Allow shapes to be created outside canvas boundaries (no boundary enforcement).

### 4.5 Context Awareness

**FR-5.1:** When command references shapes by color, find all shapes with matching fill/stroke color.

**FR-5.2:** When command references shapes by type, find all shapes of that type (rectangle, circle, line, text).

**FR-5.3:** When multiple shapes match criteria, use the first one found (array index 0).

**FR-5.4:** Provide canvas state context to AI in system prompt including:
- Current canvas dimensions (5000x5000)
- Number of existing shapes
- List of shape types and colors present
- Current viewport center (focal point)

**FR-5.5:** When user has shapes selected, pass selected shape IDs to AI as context.

### 4.6 Complex Command Examples

**FR-6.1:** "Create login form" must generate at minimum:
1. Text label "Username" 
2. Rectangle (input field) below username label
3. Text label "Password"
4. Rectangle (input field) below password label
5. Rectangle (button) with contrasting color
6. Text "Login" centered in button

Positioning: Start at focal point, stack vertically with ~20px spacing, 200px width for inputs/button.

**FR-6.2:** "Create navigation bar" must generate:
1. Rectangle (nav container) at top of canvas, full width (5000px) x 60px height
2. Text elements for menu items spaced horizontally
3. At least 4 menu items: "Home", "About", "Services", "Contact"

**FR-6.3:** "Create 3x3 grid of circles" must generate:
1. 9 circles arranged in 3 rows and 3 columns
2. Even spacing (e.g., 100px between centers)
3. Positioned near focal point
4. Random colors or single color if specified

### 4.7 Error Handling

**FR-7.1:** If OpenAI API returns error, show message: "We couldn't figure out how to handle your request. Please try again."

**FR-7.2:** If OpenAI request times out (>2s), show message: "Request took too long. Please try a simpler command."

**FR-7.3:** If rate limit exceeded, show message: "Too many requests. Please wait a moment and try again."

**FR-7.4:** If API key invalid/missing, disable button with tooltip: "AI Assistant not configured."

**FR-7.5:** If command attempts to create >500 shapes, create first 500 and show warning: "Command limited to 500 shapes."

**FR-7.6:** Log all errors to console with full error details for debugging.

### 4.8 Real-Time Synchronization

**FR-8.1:** All AI-generated shapes must sync to Firebase using existing optimistic update pattern.

**FR-8.2:** Remote users see AI-generated shapes appear in real-time (<100ms sync).

**FR-8.3:** No special indicators shown to remote users (appears as normal shape creation).

**FR-8.4:** Multiple users can invoke AI simultaneously; last write wins (standard conflict resolution).

**FR-8.5:** AI-generated shapes are indistinguishable from manually created shapes in Firebase.

**FR-8.6:** All shapes created or updated by AI commands must be automatically selected on the canvas after the command completes.
- Replaces any existing selection (clears previous selection first)
- Applies to all shapes affected by the command (created, moved, resized, rotated, color changed)
- Does not apply to deleted shapes (obviously)
- Helps users immediately see what the AI just did
- Remote users do not see this selection (selection is local to the user who invoked the AI)

### 4.9 Performance Requirements

**⚡ CRITICAL FOR SCORING:**

**FR-9.1:** AI command processing must complete in <2 seconds from submit to shapes appearing on canvas. This is a **rubric requirement** - 90%+ of commands must meet this threshold for full points.

**FR-9.2:** Command success rate must be 90%+ for well-formed commands (verified through manual testing with 20+ diverse sample commands).

**FR-9.3:** Creating 100 shapes via AI must not cause frame drops (<60 FPS maintained).

**FR-9.4:** Chat panel open/close animations must be smooth (no jank).

**FR-9.5:** Rate limiting must prevent more than 10 AI requests per minute per user.

---

## 5. Non-Goals (Out of Scope)

**NG-1:** Command history or conversation history (future enhancement)

**NG-2:** Undo/redo for AI-generated shapes (use existing undo system in future)

**NG-3:** User-provided API keys via UI (environment variable only for MVP)

**NG-4:** Multi-turn conversations with the AI (single command → response only)

**NG-5:** Grouping of shapes created by AI (all shapes are independent)

**NG-6:** Confirmation prompts for complex commands (trust user intent)

**NG-7:** Template library for common layouts (construct from scratch each time)

**NG-8:** AI indicators for remote users (maintain transparency)

**NG-9:** Command queueing system for simultaneous users (standard conflict resolution applies)

**NG-10:** Boundary enforcement (allow shapes outside canvas)

**NG-11:** Smart context like "add another circle to the right" (explicit commands only)

**NG-12:** Support for Anthropic Claude or other AI providers (OpenAI only for MVP)

**NG-13:** Advanced help features like interactive tutorials or command autocomplete (simple information modal is in scope)

**NG-14:** Per-command mode override (e.g., "apply this without confirmation") - global mode toggle only

**NG-15:** Detailed diff preview showing before/after visual comparison (text summary is in scope)

---

## 6. Design Considerations

### 6.1 UI Design

**Chat Panel Specifications:**
- Width: 400px
- Max height: 500px
- Position: Bottom-right corner, 20px from edges
- Background: White with shadow (elevation: 8)
- Border radius: 12px
- Z-index: 100 (above canvas, below modals)

**Information Modal Specifications:**
- Width: 600px
- Max height: 80vh (scrollable if content exceeds)
- Position: Centered on screen
- Background: White with shadow (elevation: 16)
- Border radius: 16px
- Z-index: 200 (above chat panel)
- Backdrop: Semi-transparent black overlay (rgba(0,0,0,0.5))

**AI Assistant Button:**
- Icon: Sparkles (lucide-react)
- Position: Top nav, right of canvas name
- Tooltip: "AI Assistant (Beta)"
- Disabled state: Grayed out with tooltip

**Input Field:**
- Placeholder: "Describe what you want to create..."
- Height: 80px (multiline textarea)
- Font size: 14px
- Border: 1px solid gray-300 (focus: blue-500)

**Response Area:**
- Height: Auto (max 200px with scroll)
- Success message: Green background, checkmark icon
- Error message: Red background, warning icon
- Font size: 14px

**Information Button:**
- Icon: HelpCircle from lucide-react
- Size: 24px
- Position: Header area, next to close button
- Tooltip: "See examples"
- Color: Gray-500 (hover: blue-500)

**AI Mode Toggle:**
- Component: Switch/toggle (e.g., from shadcn/ui or custom)
- Width: 60px
- Height: 28px
- Position: Header area, between info button and close button
- Label: Small text showing current mode ("Auto" / "Confirm")
- Colors:
  - Auto mode: Blue background when active
  - Confirm mode: Orange/amber background when active
- Tooltip: "Toggle between auto-apply and confirm mode"

**Confirmation Panel (Confirm Mode):**
- Width: Full width of chat panel
- Background: Light blue/info background (blue-50)
- Border: 1px solid blue-200
- Padding: 16px
- Position: Above response area, below input field
- Layout:
  - Summary text (bold): "AI wants to make these changes:"
  - Bulleted list of operations
  - Button row: Cancel (gray) + Apply Changes (blue, primary)

### 6.2 Interaction Flow

```
User clicks "AI Assistant" button
  → Chat panel slides in from bottom-right
  → Load AI mode preference from localStorage
  → Set toggle to saved mode (default: "auto")
  → Input field auto-focused
  → User types command
  → User presses Enter or clicks Submit
  → Show spinner "AI is thinking..."
  → Call OpenAI API with command + canvas context
  → Parse function calls from AI response
  
  IF auto-apply mode:
    → Execute tools immediately (createRectangle, arrangeInGrid, etc.)
    → Update canvas via CanvasContext
    → Firebase sync (standard optimistic update)
    → Show success/error message
    → Clear input field (on success)
  
  IF confirm mode:
    → Generate preview/summary of planned changes
    → Show confirmation panel with operations list
    → Wait for user decision
    
    IF user clicks "Apply Changes":
      → Execute tools (createRectangle, arrangeInGrid, etc.)
      → Update canvas via CanvasContext
      → Firebase sync (standard optimistic update)
      → Show success message
      → Clear input field and confirmation panel
    
    IF user clicks "Cancel":
      → Clear confirmation panel
      → Do not execute any operations
      → Keep input field as-is for editing
  
  → User can enter another command or close panel
```

**Information Modal Flow:**
```
User clicks Info button in chat panel
  → Information modal opens (centered overlay)
  → Show categorized examples of AI commands
  → User can click example to copy to input field
  → Modal auto-closes, example appears in input field
  → User can edit and submit
  OR
  → User closes modal (X button, click outside, Escape key)
  → Returns to chat panel
```

**AI Mode Toggle Flow:**
```
User clicks toggle switch in chat panel header
  → Toggle switches between "Auto" and "Confirm" modes
  → Visual feedback (color change, label update)
  → Save new mode to localStorage ("ai-mode-preference")
  → Future commands use new mode immediately
```

### 6.3 Information Modal Content

The information modal should display examples in the following format:

```markdown
# What can AI do?

## Create Shapes
Create various shapes with simple commands:
- "Create a red rectangle at 100,200"
- "Add a blue circle with radius 50"
- "Draw a line from top-left to bottom-right"
- "Add text that says 'Welcome'"

## Move & Edit
Move and modify existing shapes:
- "Move the red rectangle to the center"
- "Make the blue circle twice as large"
- "Rotate the rectangle 45 degrees"
- "Change all circles to green"
- "Delete all red shapes"

## Arrange & Align
Organize multiple shapes:
- "Arrange shapes in a 3x3 grid"
- "Align all rectangles to the left"
- "Distribute circles evenly horizontally"
- "Space out the selected shapes"

## Build Layouts
Create complex UI layouts instantly:
- "Create a login form"
- "Build a navigation bar with 4 menu items"
- "Make a contact form"
- "Create a dashboard with 6 cards"
```

**Implementation Note:** Each example should be a clickable button/link that copies the text to the input field when clicked.

### 6.4 AI System Prompt

Provide the following context to OpenAI (model: `gpt-4-turbo-preview` or configured model):

```
You are an AI assistant for a collaborative canvas application. Users can create and manipulate shapes (rectangles, circles, lines, text) on a 5000x5000px canvas.

Current canvas state:
- Canvas dimensions: 5000x5000px
- Focal point (viewport center): {x}, {y}
- Existing shapes: {shapeCount}
- Selected shapes: {selectedIds}

You have access to the following tools:
[List of all 14 tools with descriptions]

Guidelines:
- When user doesn't specify coordinates, position near focal point
- When user says "center", use canvas center (2500, 2500)
- Colors can be hex codes or CSS color names
- Default sizes: rectangles 100x100, circles radius 50, text fontSize 16
- For complex commands (login form, nav bar), create multiple elements in logical layout
- Maximum 500 shapes per command
```

---

## 7. Technical Considerations

### 7.1 Dependencies

**Client-Side Dependencies:**
```json
{
  "firebase": "^10.0.0" (already installed - use Functions SDK)
}
```

**Cloud Functions Dependencies** (in `functions/package.json`):
```json
{
  "firebase-functions": "^4.0.0",
  "firebase-admin": "^11.0.0",
  "openai": "^4.20.0"
}
```

**Note:** OpenAI SDK includes the Agents SDK functionality built-in.

### 7.2 Environment Variables & Secrets

**Firebase Cloud Functions Configuration** (set via Firebase CLI):
```bash
# Set via: firebase functions:secrets:set OPENAI_API_KEY
OPENAI_API_KEY=sk-...

# Set via: firebase functions:config:set
firebase functions:config:set openai.model="gpt-4-turbo-preview"
```

**Local Development** (`functions/.env.local` for emulator):
```bash
# Create this file for local development only (add to .gitignore)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
```

**Client-Side** (`.env`):
```
# Enable Firebase Emulator in development
VITE_USE_FIREBASE_EMULATOR=true  # Set to false for production
```

**Note:** All sensitive API keys are stored server-side. For local development, use Firebase Emulator Suite.

### 7.3 File Structure

Create the following files:

```
src/
  services/
    ai.ts              - Cloud Function client and tool execution (client-side)
  components/
    ai/
      AIAssistantButton.tsx   - Top nav button
      AIChatPanel.tsx         - Floating chat panel
      AIInfoModal.tsx         - Information modal with examples
      AIConfirmPanel.tsx      - Confirmation panel for confirm mode
      AIModeToggle.tsx        - Toggle switch component
  hooks/
    useAI.ts           - Hook for AI state management
    useAIMode.ts       - Hook for managing AI mode (localStorage)
  types/
    ai.ts              - AI-specific types
  utils/
    aiStorage.ts       - localStorage helpers for AI preferences

functions/
  src/
    index.ts           - Cloud Function entry point
    ai/
      openai.ts        - OpenAI Agents SDK client initialization
      tools.ts         - Tool schema definitions (14 tools)
      executor.ts      - Agent execution logic with function calling
    types/
      ai.ts            - Shared TypeScript types
  package.json         - Cloud Functions dependencies
  tsconfig.json        - TypeScript config for functions
```

### 7.4 Integration Points

**Client-Side:**
- `CanvasContext`: Call `createObject`, `updateObject`, `deleteObject`, `selectObjects`
- `useCanvas()` hook: Access canvas state and viewport info
- Firebase Authentication: Get auth token for Cloud Function requests
- Firebase Functions SDK: Call Cloud Function endpoint
- Firebase Realtime Database: Standard optimistic update flow (no changes needed)
- Toast system: Show rate limit warnings if needed

**Cloud Function:**
- Firebase Admin SDK: Verify auth tokens, access Realtime Database
- OpenAI Agents SDK: Create agents with function calling capabilities

### 7.5 Cloud Function Architecture

**Request Flow:**
```
Client (Browser)
  → Firebase Auth (get token)
  → HTTP POST to Cloud Function (local emulator or production)
  → Cloud Function verifies auth token
  → Cloud Function calls OpenAI Agents SDK
  → OpenAI Agent processes command and returns function calls
  → Cloud Function returns tool calls to client
  → Client executes tools locally (updates CanvasContext)
  → Firebase syncs shapes to all users
```

**Local Development Setup:**
```bash
# Terminal 1: Start Firebase Emulators
firebase emulators:start --only functions,auth

# Terminal 2: Start Vite dev server
npm run dev

# Client automatically connects to local emulator when VITE_USE_FIREBASE_EMULATOR=true
```

**Emulator Configuration:**
```typescript
// src/config/firebase.ts
import { connectFunctionsEmulator } from 'firebase/functions';
import { connectAuthEmulator } from 'firebase/auth';

if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
  connectAuthEmulator(auth, 'http://localhost:9099');
}
```

### 7.6 OpenAI Agents SDK Implementation

**Cloud Function Implementation:**
```typescript
// functions/src/index.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import OpenAI from "openai";

initializeApp();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const processAICommand = onCall(async (request) => {
  // Verify authentication
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { command, canvasId, canvasState, viewportCenter } = request.data;

  // Validate inputs
  if (!command || !canvasId) {
    throw new HttpsError("invalid-argument", "Missing required fields");
  }

  // Call OpenAI with function calling
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: `You are an AI assistant for a collaborative canvas application...
        Canvas dimensions: 5000x5000px
        Focal point: ${viewportCenter.x}, ${viewportCenter.y}
        Existing shapes: ${canvasState.length}`,
      },
      {
        role: "user",
        content: command,
      },
    ],
    tools: tools, // 14 tool definitions
    tool_choice: "auto",
  });

  return {
    success: true,
    toolCalls: response.choices[0].message.tool_calls,
  };
});
```

### 7.7 OpenAI Function Calling Schema

Define tools as OpenAI function calling schema:

```typescript
const tools = [
  {
    type: "function",
    function: {
      name: "createRectangle",
      description: "Creates a rectangle on the canvas",
      parameters: {
        type: "object",
        properties: {
          x: { type: "number", description: "X coordinate" },
          y: { type: "number", description: "Y coordinate" },
          width: { type: "number", description: "Width (10-2000)" },
          height: { type: "number", description: "Height (10-2000)" },
          color: { type: "string", description: "Fill color (hex or CSS name)" }
        },
        required: ["x", "y", "width", "height", "color"]
      }
    }
  },
  // ... 13 more tool definitions
];
```

### 7.8 Rate Limiting Implementation

```typescript
const rateLimiter = {
  requests: [] as number[],
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  
  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.windowMs);
    return this.requests.length < this.maxRequests;
  },
  
  recordRequest(): void {
    this.requests.push(Date.now());
  }
};
```

### 7.9 Performance Optimization

- Batch shape creation: Create all shapes in single loop, then trigger one Firebase write
- Debounce panel open/close animations
- Lazy load OpenAI SDK (dynamic import) to reduce initial bundle size
- Cache `getCanvasState()` result for 1 second to avoid repeated serialization

### 7.10 LocalStorage Persistence

Store AI mode preference in localStorage:

```typescript
// src/utils/aiStorage.ts
export type AIMode = 'auto' | 'confirm';

export const AI_MODE_KEY = 'ai-mode-preference';

export const getAIMode = (): AIMode => {
  const stored = localStorage.getItem(AI_MODE_KEY);
  return stored === 'confirm' ? 'confirm' : 'auto';
};

export const setAIMode = (mode: AIMode): void => {
  localStorage.setItem(AI_MODE_KEY, mode);
};
```

**Hook Implementation:**
```typescript
// src/hooks/useAIMode.ts
import { useState, useEffect } from 'react';
import { getAIMode, setAIMode, AIMode } from '../utils/aiStorage';

export const useAIMode = () => {
  const [mode, setMode] = useState<AIMode>(() => getAIMode());

  const toggleMode = () => {
    const newMode: AIMode = mode === 'auto' ? 'confirm' : 'auto';
    setMode(newMode);
    setAIMode(newMode);
  };

  return { mode, toggleMode, setMode };
};
```

### 7.11 Auto-Selection Implementation

Each tool function should return an array of shape IDs that were affected:

```typescript
// Example tool implementation
const createRectangle = (x, y, width, height, color) => {
  const shapeId = generateId();
  // Create shape in CanvasContext...
  return [shapeId]; // Return affected shape IDs
};

// After all tools execute
const executeAICommand = async (command) => {
  const response = await openai.chat.completions.create({...});
  const affectedShapeIds: string[] = [];
  
  // Execute each tool call
  for (const toolCall of response.tool_calls) {
    const shapeIds = await executeTool(toolCall);
    affectedShapeIds.push(...shapeIds);
  }
  
  // Select all affected shapes
  if (affectedShapeIds.length > 0) {
    canvasContext.setSelectedIds(affectedShapeIds);
  }
};
```

---

## 8. Success Metrics

### 8.1 Functional Success Criteria

- [ ] AI Assistant button appears in canvas editor nav
- [ ] Chat panel opens/closes smoothly
- [ ] AI mode toggle appears in chat panel header
- [ ] Toggle switches between Auto and Confirm modes
- [ ] AI mode preference persists across browser sessions
- [ ] Information button appears in chat panel header
- [ ] Information modal opens when info button clicked
- [ ] Information modal shows 4 categories with examples
- [ ] Clicking example copies it to input field and closes modal
- [ ] User can submit commands and receive responses in Auto mode
- [ ] In Confirm mode, confirmation panel shows before execution
- [ ] User can approve or cancel operations in Confirm mode
- [ ] All 14 tools (FR-3.1 to FR-3.14) are implemented and working
- [ ] "Create login form" generates 6+ properly arranged elements
- [ ] "Create nav bar" generates navigation layout
- [ ] "Arrange in 3x3 grid" arranges shapes correctly
- [ ] AI-generated shapes sync to all users in <100ms
- [ ] AI-created/updated shapes are automatically selected after command completes
- [ ] Selection is local to user who invoked AI (remote users don't see selection)
- [ ] Rate limiting prevents >10 requests/minute
- [ ] Error messages shown for failed commands

### 8.2 Performance Success Criteria (⚡ RUBRIC REQUIREMENTS)

**MANDATORY for full 25 points:**

- [ ] **90%+ of commands complete in <2 seconds** (measure with 20+ diverse test commands, record actual times)
- [ ] **Command success rate ≥90%** (manual testing with 20+ commands, track failures)
- [ ] **Real-time sync <100ms** (verify AI-generated shapes appear on remote clients within 100ms)
- [ ] Creating 100 shapes maintains 60 FPS
- [ ] Chat panel animations are smooth (no jank)
- [ ] No memory leaks from OpenAI client
- [ ] Bundle size increase <100KB (OpenAI SDK lazy loaded)

**Test Documentation Required:** Record response times and success rates for all test commands to prove rubric compliance.

### 8.3 Quality Success Criteria

- [ ] 90%+ success rate for well-formed commands (manual testing with 20+ sample commands)
- [ ] Error handling graceful for all failure modes
- [ ] No console errors or warnings
- [ ] TypeScript strict mode passes
- [ ] Code follows existing patterns (see `.cursor/rules/`)

### 8.4 User Experience Success Criteria

- [ ] AI button discoverable (clear icon and tooltip)
- [ ] AI mode toggle is intuitive and clearly labeled
- [ ] Users understand difference between Auto and Confirm modes
- [ ] Confirm mode provides clear preview of planned changes
- [ ] Apply/Cancel buttons in confirm mode are obvious
- [ ] Information modal helps users discover available commands
- [ ] Example commands are easy to understand and copy
- [ ] Input placeholder guides user on how to phrase commands
- [ ] Loading state clear when AI is processing
- [ ] Success/error feedback is immediate and understandable
- [ ] Panel can be repositioned without interfering with canvas work
- [ ] Information modal is visually appealing and well-organized
- [ ] Mode preference persistence feels natural and expected

---

## 9. Open Questions

**Q1:** Should we implement a fallback if OpenAI API is down? (e.g., show "AI service temporarily unavailable")
- **Answer TBD:** Decide during implementation

**Q2:** Should the chat panel remember its position across page reloads? (localStorage)
- **Answer TBD:** Nice-to-have, implement if time permits

**Q3:** What should max viewport focal point tolerance be? (e.g., if viewport is zoomed way out, should we still use viewport center?)
- **Answer TBD:** Use viewport center regardless of zoom for consistency

**Q4:** Should we add telemetry to track which commands are most used?
- **Answer TBD:** Out of scope for MVP, consider for future

**Q5:** How should we handle very long command text? (e.g., 500 character command)
- **Answer TBD:** Let OpenAI handle it; our input field has no character limit

**Q6:** Should keyboard shortcut (e.g., Cmd+K) open AI panel?
- **Answer TBD:** Nice-to-have, implement if time permits (use Cmd+/) to avoid conflict with existing shortcuts

**Q7:** Which OpenAI model provides best balance of speed, accuracy, and cost?
- **Answer:** Use `gpt-4-turbo-preview` for reliability, make configurable via environment variable

**Q8:** Should we implement logging/monitoring for AI commands?
- **Answer:** Use Firebase Cloud Functions logging (built-in). OpenAI Agents SDK has built-in usage tracking.

**Q9:** Should AI mode default to Auto or Confirm for new users?
- **Answer:** Default to Auto mode for faster onboarding; users can switch to Confirm if they prefer more control

**Q10:** Should confirm mode show a visual preview of shapes or just text description?
- **Answer:** Text summary for MVP (e.g., "Create 3 rectangles, 2 circles at positions..."); visual preview is future enhancement

---

## 10. Testing Plan

### 10.1 Unit Tests

Create `tests/ai.test.tsx`:
- Test tool execution functions (createRectangle, moveShapes, etc.)
- Test rate limiting logic
- Test focal point calculation
- Test command parsing (mock OpenAI responses)
- Test error handling for various failure modes

### 10.2 Integration Tests

- Test full flow: user input → OpenAI call → shape creation → Firebase sync
- Test complex commands (login form, nav bar, grid arrangement)
- Test selection-based operations (arrange selected shapes only)
- Test multi-user scenario (two users invoking AI simultaneously)

### 10.3 Manual Testing Checklist

**UI Tests:**
- [ ] AI mode toggle appears in chat panel header
- [ ] Toggle shows current mode ("Auto" or "Confirm")
- [ ] Toggle switches modes when clicked
- [ ] Toggle visual feedback (color change, label update)
- [ ] Info button appears in chat panel
- [ ] Info button opens information modal
- [ ] Modal shows all 4 categories (Create, Move & Edit, Arrange, Build Layouts)
- [ ] Each category has 3-5 examples
- [ ] Clicking example copies to input field
- [ ] Modal closes after clicking example
- [ ] Modal closes when clicking outside
- [ ] Modal closes when pressing Escape

**AI Mode Tests:**
- [ ] Auto mode: Commands execute immediately without confirmation
- [ ] Confirm mode: Confirmation panel appears after AI processes command
- [ ] Confirm panel shows summary of planned changes
- [ ] Confirm panel shows list of operations
- [ ] "Apply Changes" button executes operations
- [ ] "Cancel" button aborts operations without executing
- [ ] AI mode preference saves to localStorage
- [ ] AI mode preference loads on panel open
- [ ] Switching modes persists across page reloads

**Basic Commands:**
- [ ] "Create red rectangle at 100,200"
- [ ] "Add blue circle with radius 50"
- [ ] "Draw a line from 0,0 to 500,500"
- [ ] "Add text 'Hello World'"

**Manipulation Commands:**
- [ ] "Move red rectangle to center"
- [ ] "Rotate rectangle 45 degrees"
- [ ] "Make circle twice as large"
- [ ] "Change all rectangles to blue"
- [ ] "Delete all red shapes"

**Layout Commands:**
- [ ] "Arrange shapes in 3x3 grid"
- [ ] "Align all shapes to the left"
- [ ] "Distribute circles horizontally"

**Complex Commands:**
- [ ] "Create a login form"
- [ ] "Create navigation bar with 4 menu items"
- [ ] "Create 10 random colored circles"

**Error Cases:**
- [ ] Submit empty command → error message
- [ ] Submit gibberish → error message
- [ ] Exceed rate limit → rate limit message
- [ ] Timeout (if possible to simulate) → timeout message
- [ ] Invalid API key → button disabled

**Selection Tests:**
- [ ] Create shapes via AI → all created shapes are selected
- [ ] Move shapes via AI → moved shapes remain selected
- [ ] Color change via AI → affected shapes are selected
- [ ] Delete shapes via AI → selection cleared
- [ ] Remote user does not see AI-invoker's selection

**Performance Tests (⚡ CRITICAL FOR RUBRIC SCORING):**

**Response Time Testing (Sub-2 Second Requirement):**
- [ ] Test 20+ diverse commands and record actual response times
- [ ] Verify 90%+ complete in <2 seconds (18+ out of 20 must pass)
- [ ] Document any commands that exceed 2 seconds and reasons why
- [ ] Test commands in both Auto and Confirm modes (confirm mode should still process in <2s)
- [ ] Include: simple commands (1 shape), medium commands (5-10 shapes), complex commands (login form, nav bar)

**Success Rate Testing (90%+ Requirement):**
- [ ] Test same 20+ commands and record success/failure
- [ ] Verify 90%+ execute correctly (18+ out of 20 must work as intended)
- [ ] Document any failed commands and reasons for failure
- [ ] Include all 4 command categories: creation, manipulation, layout, complex

**Real-Time Sync Testing (<100ms Requirement):**
- [ ] Multi-user: Two browser windows, one user invokes AI, measure time for shapes to appear on remote client
- [ ] Verify sync happens in <100ms (use performance.now() or similar)
- [ ] Test with simple command (1 shape) and complex command (10+ shapes)

**Additional Performance Tests:**
- [ ] Create 100 shapes → <2s, 60 FPS maintained
- [ ] Create 500 shapes → <2s (hard limit test)
- [ ] Rapid-fire 5 commands in a row → all process correctly, no rate limiting issues
- [ ] Multi-user: Two users create shapes via AI simultaneously → both sync correctly, no conflicts

**Test Documentation:**
Create a test results document (e.g., `AI_PERFORMANCE_TESTS.md`) with:
- Command text, expected behavior, actual response time, success/failure, notes
- Summary: X/20 commands <2s (X%), Y/20 successful (Y%)
- Include this in project submission as proof of rubric compliance

---

## 11. Implementation Phases

### Phase 1: Foundation (3-4 hours)
1. Initialize Firebase Cloud Functions project (if not already exists)
2. Set up Firebase Emulator Suite for local development
3. Configure emulator to use local environment variables (functions/.env.local)
4. Set up Cloud Functions dependencies (OpenAI, LangSmith SDKs)
5. Configure Firebase secrets for production deployment (OpenAI, LangSmith)
6. Create Cloud Function endpoint `processAICommand` with auth
7. Set up OpenAI client in Cloud Function
8. Set up LangSmith tracing in Cloud Function (optional)
9. Define all 14 tool schemas in Cloud Function
10. Configure client to connect to emulator in development mode
11. Create client-side service to call Cloud Function (works with emulator and production)
12. Test Cloud Function locally with emulator
13. Build basic chat panel UI (no styling)
14. Build AI mode toggle component
15. Implement localStorage persistence for AI mode
16. Build information modal component with example content
17. Build confirmation panel component for confirm mode
18. Connect button to panel open/close
19. Connect info button to modal open/close
20. Implement click-to-copy example functionality

### Phase 2: Core Tools (3-4 hours)
1. Implement all creation tools client-side (createRectangle, createCircle, createLine, createText)
2. Implement manipulation tools client-side (move, resize, rotate, changeColor, delete)
3. Implement `getCanvasState()` for context (sent to Cloud Function)
4. Implement tool execution dispatcher on client (receives tool calls from Cloud Function)
5. Implement auto-selection of affected shapes after each tool execution
6. Implement command preview/summary generation for confirm mode
7. Test each tool individually in both Auto and Confirm modes
8. Test Cloud Function authentication and error handling

### Phase 3: Layout & Complex Commands (2-3 hours)
1. Implement layout tools (arrangeInGrid, alignShapes, distributeShapes)
2. Implement `selectShapes()` tool
3. Build complex command logic (login form, nav bar)
4. Test focal point positioning

### Phase 4: Polish & Error Handling (1-2 hours)
1. Add rate limiting
2. Add error handling for all failure modes
3. Add loading states and success/error messages
4. Style chat panel, information modal, and confirmation panel (match app theme)
5. Style AI mode toggle (visual feedback, colors)
6. Add keyboard shortcuts (Cmd+/)
7. Make panel draggable
8. Polish information modal and confirmation panel styling and interactions

### Phase 5: Testing & Optimization (2-3 hours) ⚡ CRITICAL PHASE

**⚠️ THIS PHASE IS MANDATORY FOR RUBRIC COMPLIANCE - DO NOT SKIP**

**Performance Testing (Required for Full Points):**
1. **Response Time Testing**: Test 20+ diverse commands, record actual times
   - Verify 90%+ complete in <2 seconds (18+ out of 20 must pass)
   - Document results in `AI_PERFORMANCE_TESTS.md`
2. **Success Rate Testing**: Test 20+ commands from all 4 categories
   - Verify 90%+ execute correctly (18+ out of 20 must work as intended)
   - Document failures and reasons
3. **Real-Time Sync Testing**: Multi-user testing with performance measurement
   - Verify AI shapes sync to remote users in <100ms
   - Use performance.now() to measure actual sync times

**Additional Testing:**
4. Test extensively with local Firebase Emulator
5. Run all manual test cases (locally first, then staging)
6. Performance testing (100+ shapes, 60 FPS maintained)
7. Test Cloud Function cold start times (staging/production)
8. Test Cloud Function timeout handling
9. Verify API keys are never exposed client-side
10. Deploy Cloud Functions to staging: `firebase deploy --only functions --project staging`
11. Test in staging environment
12. Fix bugs found during testing
13. Final polish and documentation
14. Deploy Cloud Functions to production: `firebase deploy --only functions --project production`

**Deliverable:** `AI_PERFORMANCE_TESTS.md` document proving 90%+ response time and success rate compliance

**Total Estimated Time:** 10-16 hours (target: 12 hours with Cloud Functions)

**Note:** Local emulator development significantly speeds up iteration time during development. Performance testing is CRITICAL for full points - allocate sufficient time for this phase.

---

## 12. Dependencies & Risks

### Dependencies
- Firebase Cloud Functions availability and performance
- OpenAI API availability and response time
- Existing CanvasContext CRUD operations
- Firebase Authentication for Cloud Function security
- Firebase Realtime Database sync infrastructure

### Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Cloud Function cold starts | Medium | Medium | Use min instances (paid), show loading state |
| OpenAI API slow/unreliable | Medium | High | Implement 2s timeout, show clear errors |
| Cloud Function timeout (60s max) | Low | High | Enforce 2s client timeout, fail fast |
| Rate limiting too restrictive | Low | Medium | Make configurable, tune based on testing |
| Complex commands inconsistent | Medium | Medium | Provide detailed system prompt, add examples |
| API costs exceed budget | Low | Medium | Implement rate limiting, monitor via Firebase logs |
| Cloud Function deployment issues | Low | Medium | Test thoroughly in development, have rollback plan |

---

## 13. Future Enhancements (Post-MVP)

These are explicitly **out of scope** for this PRD but documented for future consideration:

1. **Command History:** Show previous commands, allow re-running
2. **Conversation Context:** Multi-turn conversations ("now make it blue", "add another one")
3. **Undo Integration:** Single undo for all AI-generated shapes in one command
4. **Templates:** Pre-built layouts for common UI patterns
5. **User API Keys:** Allow users to input their own OpenAI keys
6. **AI Providers:** Support Claude, Gemini, local models
7. **Grouping:** Automatically group shapes created by single AI command
8. **Smart Context:** "Add another shape to the right of the last one"
9. **Confirmation Prompts:** Warn before creating 100+ shapes
10. **Command Suggestions:** Autocomplete or suggestion dropdown as-you-type
11. **Voice Input:** Speak commands instead of typing
12. **Enhanced Telemetry:** Advanced analytics dashboard for command usage patterns
13. **Interactive Tutorial:** Step-by-step guided tutorial for first-time users
14. **Favorites:** Allow users to save frequently-used commands
15. **A/B Testing:** Test different system prompts and models for optimization
16. **OpenAI Assistants API:** Migrate to full Assistants API for persistent threads and memory

---

## Appendix A: Example Commands

### Creation
- "Create red rectangle at 100,200 with size 150x100"
- "Add blue circle with radius 50 at 300,300"
- "Draw black line from 0,0 to 500,500"
- "Add text 'Hello World' at 200,100 in red with font size 24"
- "Create 10 random colored circles"

### Manipulation
- "Move red rectangle to center"
- "Move all circles right by 100"
- "Make blue circle twice as large"
- "Rotate rectangle 45 degrees"
- "Change all rectangles to blue"
- "Delete all red shapes"

### Layout
- "Arrange shapes in 3x3 grid with 50px spacing"
- "Arrange selected shapes in 2x4 grid"
- "Align all rectangles to the left"
- "Align selected shapes to top"
- "Distribute circles horizontally"
- "Distribute selected shapes vertically"

### Complex
- "Create a login form"
- "Create navigation bar with 4 menu items"
- "Create a contact form with name, email, message fields and submit button"
- "Create a dashboard with 6 cards arranged in 2 rows"
- "Create a color palette with 8 circles in different colors"

---

## Appendix B: Tool Reference

| Tool Name | Parameters | Description | Example Command |
|-----------|------------|-------------|-----------------|
| `createRectangle` | x, y, width, height, color | Creates rectangle | "Create red rectangle" |
| `createCircle` | x, y, radius, color | Creates circle | "Add blue circle" |
| `createLine` | x1, y1, x2, y2, color, strokeWidth | Creates line | "Draw line from 0,0 to 500,500" |
| `createText` | x, y, text, fontSize, color | Creates text | "Add text 'Hello'" |
| `moveShapes` | shapeIds, x, y, relative | Moves shapes | "Move rectangle to 300,300" |
| `resizeShapes` | shapeIds, scaleFactor | Resizes shapes | "Make circle twice as large" |
| `rotateShapes` | shapeIds, degrees | Rotates shapes | "Rotate rectangle 45 degrees" |
| `changeColor` | shapeIds, color | Changes color | "Make rectangle blue" |
| `deleteShapes` | shapeIds | Deletes shapes | "Delete all circles" |
| `arrangeInGrid` | shapeIds, rows, cols, spacingX, spacingY | Arranges in grid | "Arrange in 3x3 grid" |
| `alignShapes` | shapeIds, alignment | Aligns shapes | "Align to left" |
| `distributeShapes` | shapeIds, direction | Distributes evenly | "Distribute horizontally" |
| `getCanvasState` | - | Gets all shapes | (AI uses automatically) |
| `selectShapes` | shapeIds | Selects shapes | "Select all blue rectangles" |

---

## Appendix C: Performance Test Documentation Template

**⚡ REQUIRED FOR RUBRIC COMPLIANCE**

Create `AI_PERFORMANCE_TESTS.md` with the following format:

```markdown
# AI Canvas Agent - Performance Test Results

**Date:** [Test Date]  
**Tester:** [Your Name]  
**Environment:** [Staging/Production]  
**OpenAI Model:** gpt-4-turbo-preview

---

## Summary

**Response Time Compliance:**
- Commands Tested: 20
- Commands <2 seconds: X (X%)
- Commands >2 seconds: Y (Y%)
- **PASS/FAIL:** [PASS if ≥90% (18+), FAIL if <90%]

**Success Rate Compliance:**
- Commands Tested: 20
- Successful Commands: X (X%)
- Failed Commands: Y (Y%)
- **PASS/FAIL:** [PASS if ≥90% (18+), FAIL if <90%]

**Real-Time Sync Compliance:**
- Sync Time (Simple Command): X ms
- Sync Time (Complex Command): X ms
- **PASS/FAIL:** [PASS if <100ms, FAIL if ≥100ms]

---

## Detailed Test Results

### Test 1: [Command Category - e.g., Creation]
| # | Command | Category | Expected Behavior | Response Time (ms) | Success? | Notes |
|---|---------|----------|-------------------|-------------------|----------|-------|
| 1 | "Create red rectangle at 100,200" | Creation | Single rectangle at coordinates | 850 | ✅ | Worked perfectly |
| 2 | "Add blue circle with radius 50" | Creation | Circle with radius 50 | 920 | ✅ | |
| 3 | ... | ... | ... | ... | ... | ... |

### Test 2: [Manipulation Commands]
| # | Command | Category | Expected Behavior | Response Time (ms) | Success? | Notes |
|---|---------|----------|-------------------|-------------------|----------|-------|
| 6 | "Move red rectangle to center" | Manipulation | Rectangle moves to canvas center | 1100 | ✅ | |
| 7 | ... | ... | ... | ... | ... | ... |

### Test 3: [Layout Commands]
| # | Command | Category | Expected Behavior | Response Time (ms) | Success? | Notes |
|---|---------|----------|-------------------|-------------------|----------|-------|
| 11 | "Arrange shapes in 3x3 grid" | Layout | 9 shapes arranged in grid | 1450 | ✅ | |
| 12 | ... | ... | ... | ... | ... | ... |

### Test 4: [Complex Commands]
| # | Command | Category | Expected Behavior | Response Time (ms) | Success? | Notes |
|---|---------|----------|-------------------|-------------------|----------|-------|
| 16 | "Create a login form" | Complex | 6+ elements (labels, inputs, button) | 1800 | ✅ | All elements properly positioned |
| 17 | "Create navigation bar with 4 menu items" | Complex | Nav bar with 4 text elements | 1650 | ✅ | |
| 18 | ... | ... | ... | ... | ... | ... |

---

## Real-Time Sync Tests

**Test Setup:**
- Browser 1: User A invokes AI command
- Browser 2: User B observes canvas (no interaction)
- Measurement: performance.now() before command submit → performance.now() when shapes appear on Browser 2

| Command | Shapes Created | Sync Time (ms) | PASS/FAIL |
|---------|---------------|----------------|-----------|
| "Create red rectangle" | 1 | 45 | ✅ PASS |
| "Create login form" | 6 | 78 | ✅ PASS |
| "Create 10 circles" | 10 | 92 | ✅ PASS |

---

## Failures & Issues

**Commands that exceeded 2 seconds:**
1. [Command text] - Actual time: X ms - Reason: [e.g., Complex layout with many shapes]

**Commands that failed:**
1. [Command text] - Reason: [e.g., AI misunderstood intent, created wrong shapes]

**Recommendations for improvement:**
- [List any improvements needed]

---

## Rubric Compliance Verification

✅ **Sub-2 Second Response Time**: X/20 commands (X%) - **PASS** (≥90% required)  
✅ **90%+ Success Rate**: X/20 commands (X%) - **PASS** (≥90% required)  
✅ **Real-Time Sync <100ms**: All tests passed - **PASS**  
✅ **8+ Working Commands**: 14 tools implemented - **PASS**  
✅ **Complex Commands**: "Create login form" produces 6+ elements - **PASS**

**OVERALL RESULT: PASS / FAIL**

---

**Conclusion:**
[Brief summary of test results and readiness for submission]
```

**Include this document in your project submission as proof of rubric compliance.**

---

**End of PRD**

