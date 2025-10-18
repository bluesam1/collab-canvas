# Task List: AI Canvas Agent

**Source PRD:** `prd-ai-canvas-agent.md`  
**Priority:** P1 (Critical - 25 points)  
**Estimated Effort:** 8-10 hours

---

## ⚡ Critical Performance Requirements (Rubric Scoring)

**These requirements are MANDATORY for full 25 points:**

1. **Sub-2 Second Response Time**: 90%+ of commands must complete in <2 seconds
2. **90%+ Command Success Rate**: Well-formed commands must work 90% of the time
3. **Real-Time Sync**: AI-generated shapes sync to remote users in <100ms
4. **8+ Working Commands**: Across 4 categories (creation, manipulation, layout, complex)
5. **Complex Command Support**: "Create login form" produces 6+ properly arranged elements

**⚠️ Task 6.0 includes explicit testing tasks to verify and document these requirements.**

---

## Relevant Files

**Client-Side:**
- `src/components/ai/AIAssistantButton.tsx` - Button in top nav to open AI panel
- `src/components/ai/AIChatPanel.tsx` - Main floating chat panel component
- `src/components/ai/AIInfoModal.tsx` - Modal showing AI command examples
- `src/components/ai/AIConfirmPanel.tsx` - Confirmation panel for confirm mode
- `src/components/ai/AIModeToggle.tsx` - Toggle switch for Auto/Confirm modes
- `src/hooks/useAI.ts` - Hook for AI state management
- `src/hooks/useAIMode.ts` - Hook for managing AI mode with localStorage
- `src/services/ai.ts` - Cloud Function client and tool execution (client-side)
- `src/types/ai.ts` - TypeScript types for AI features
- `src/utils/aiStorage.ts` - localStorage helpers for AI preferences
- `src/pages/CanvasEditorPage.tsx` - Add AI Assistant button to nav
- `tests/ai.test.tsx` - Unit tests for AI service and tools
- `tests/ai-panel.test.tsx` - Component tests for AI UI

**Cloud Functions:**
- `functions/src/index.ts` - Cloud Function entry point with processAICommand endpoint
- `functions/src/ai/openai.ts` - OpenAI Agents SDK client initialization (server-side)
- `functions/src/ai/tools.ts` - Tool schema definitions (14 tools)
- `functions/src/ai/executor.ts` - Agent execution logic with function calling
- `functions/src/types/ai.ts` - Shared TypeScript types
- `functions/package.json` - Cloud Functions dependencies (openai, firebase-functions, firebase-admin)
- `functions/tsconfig.json` - TypeScript config for functions
- `functions/.env.local` - Local development environment variables (add to .gitignore)
- `firebase.json` - Firebase configuration (update for functions and emulators)
- `.firebaserc` - Firebase project configuration
- `src/config/firebase.ts` - Update to connect to emulators in development

### Notes

- Tests should be placed in the `tests/` directory (not alongside components)
- Use `npm test` or `npm run test` to run all tests
- Use Vitest framework (not Jest) with `vi.mock()` for mocking
- **Local Development**: Run `firebase emulators:start --only functions,auth` in one terminal and `npm run dev` in another
- **Deployment**: Use `firebase deploy --only functions` to deploy Cloud Functions
- **Environment**: Add `functions/.env.local` to `.gitignore` (contains API keys for local development)

---

## Tasks

- [x] 1.0 Set up Firebase Cloud Functions and local development environment
  - [x] 1.1 Initialize Firebase Cloud Functions project (if not exists): `firebase init functions`
  - [x] 1.2 Select TypeScript for Cloud Functions
  - [x] 1.3 Initialize Firebase Emulators: `firebase init emulators` (select Functions and Auth)
  - [x] 1.4 Install Cloud Functions dependencies in `functions/`: `firebase-functions`, `firebase-admin`, `openai`
  - [x] 1.5 Create `functions/.env.local` file with API keys for local development (add to .gitignore)
  - [x] 1.6 Add OPENAI_API_KEY and OPENAI_MODEL to `functions/.env.local`
  - [ ] 1.7 Configure Firebase secrets for production: `firebase functions:secrets:set OPENAI_API_KEY` - **OPTIONAL FOR NOW**
  - [ ] 1.8 Configure Firebase config for production: `firebase functions:config:set openai.model="gpt-4-turbo-preview"` - **OPTIONAL FOR NOW**
  - [x] 1.9 Update `firebase.json` to configure emulator ports (functions: 5001, auth: 9099)
  - [x] 1.10 Create `functions/src/types/ai.ts` with shared TypeScript types
  - [x] 1.11 Create `src/types/ai.ts` with client-side TypeScript types (AIMode, ToolCall, etc.)
  - [x] 1.12 Add `VITE_USE_FIREBASE_EMULATOR=true` to client `.env` file
  - [x] 1.13 Update `src/config/firebase.ts` to connect to emulators when in development mode
  - [x] 1.14 Verify Firebase project is configured and authenticated
  - [x] 1.15 Test emulator startup: `firebase emulators:start --only functions,auth` (database uses production)

- [x] 2.0 Build UI components (chat panel, modals, toggle)
  - [x] 2.1 Create `AIAssistantButton.tsx` component with Sparkles icon for top nav
  - [x] 2.2 Add AI Assistant button to `CanvasEditorPage.tsx` nav bar (right of canvas name)
  - [x] 2.3 Create `AIChatPanel.tsx` with basic structure (header, input, response area, buttons)
  - [x] 2.4 Make chat panel draggable (positioned bottom-right by default)
  - [x] 2.5 Implement panel open/close logic (click outside, Escape key)
  - [x] 2.6 Add text input field with placeholder "Describe what you want to create..."
  - [x] 2.7 Add submit button (Send or Sparkles icon)
  - [x] 2.8 Add close button (X icon) to panel header
  - [x] 2.9 Add loading spinner with "AI is thinking..." text
  - [x] 2.10 Add response area for success/error messages
  - [x] 2.11 Create `AIInfoModal.tsx` with "What can AI do?" title
  - [x] 2.12 Add four categorized sections to info modal (Create Shapes, Move & Edit, Arrange & Align, Build Layouts)
  - [x] 2.13 Add 3-5 example commands per category (17 total examples)
  - [x] 2.14 Implement click-to-copy functionality for examples (copies to input field)
  - [x] 2.15 Add info button (HelpCircle icon) to chat panel header
  - [x] 2.16 Connect info button to open/close modal
  - [x] 2.17 Create `AIConfirmPanel.tsx` for confirm mode with summary and buttons
  - [x] 2.18 Add "Apply Changes" (primary) and "Cancel" (secondary) buttons to confirm panel

- [ ] 3.0 Implement Cloud Function backend with OpenAI Agents SDK
  - [x] 3.1 Create `functions/src/index.ts` with `processAICommand` Cloud Function endpoint
  - [x] 3.2 Implement Firebase Auth verification in Cloud Function (check request.auth)
  - [x] 3.3 Create `functions/src/ai/openai.ts` with OpenAI Agents SDK client initialization
  - [x] 3.4 Configure OpenAI to read from environment variables (works with .env.local and Firebase config)
  - [x] 3.5 Define OpenAI function calling schema for all 14 tools in `functions/src/ai/tools.ts`
  - [x] 3.6 Create `functions/src/ai/executor.ts` with agent execution logic
  - [x] 3.7 Implement AI system prompt with canvas context (dimensions, focal point, shapes)
  - [x] 3.8 Implement OpenAI chat.completions.create() with tools parameter
  - [x] 3.9 Set tool_choice to "auto" to let AI decide when to use tools
  - [x] 3.10 Implement 2-second timeout for OpenAI API calls (server-side)
  - [x] 3.11 Add error handling for API failures, timeouts, authentication errors
  - [x] 3.12 Implement response parsing to extract function calls from AI response
  - [x] 3.13 Return tool calls to client in structured format
  - [x] 3.14 Test Cloud Function locally with Firebase Emulator
  - [x] 3.15 Verify emulator loads environment variables from `.env.local`
  - [x] 3.16 Create client-side `src/services/ai.ts` to call Cloud Function
  - [x] 3.17 Implement authenticated HTTP requests to Cloud Function (include Firebase Auth token)
  - [x] 3.18 Ensure client uses emulator endpoint when `VITE_USE_FIREBASE_EMULATOR=true`
  - [x] 3.19 Implement client-side rate limiting (10 requests per minute per user)
  - [x] 3.20 Add client-side timeout for Cloud Function calls (2 seconds)
  - [x] 3.21 Create tool execution dispatcher on client that receives tool calls from Cloud Function
  - [ ] 3.22 Test full flow locally: client → emulator → OpenAI Agents SDK → emulator → client
    - **Status:** Ready to test! See `START_AI_TEST.md` and `TESTING_AI_AGENT.md`
    - **Requirements:**
      1. Add real OpenAI API key to `functions/.env.local`
      2. Start Firebase emulator: `firebase emulators:start --only functions,auth,database`
      3. Start dev server: `npm run dev` (already running on localhost:5174)
      4. Test commands in AI Assistant panel
    - **Test Commands:**
      - `Create 3 blue rectangles in a row`
      - `Create a red circle at the center`
      - `Arrange all shapes in a 3x3 grid`
      - `Change selected shapes to purple`
    - **Mark complete after:** Verifying all 14 tools work correctly

- [x] 4.0 Implement AI tools (14 tools across 4 categories)
  - [x] 4.1 Implement `createRectangle(x, y, width, height, color)` tool
  - [x] 4.2 Implement `createCircle(x, y, radius, color)` tool
  - [x] 4.3 Implement `createLine(x1, y1, x2, y2, color, strokeWidth)` tool
  - [x] 4.4 Implement `createText(x, y, text, fontSize, color)` tool
  - [x] 4.5 Implement `moveShapes(shapeIds, x, y, relative)` tool
  - [x] 4.6 Implement `resizeShapes(shapeIds, scaleFactor)` tool
  - [x] 4.7 Implement `rotateShapes(shapeIds, degrees)` tool
  - [x] 4.8 Implement `changeColor(shapeIds, color)` tool
  - [x] 4.9 Implement `deleteShapes(shapeIds)` tool
  - [x] 4.10 Implement `arrangeInGrid(shapeIds, rows, cols, spacingX, spacingY)` tool
  - [x] 4.11 Implement `alignShapes(shapeIds, alignment)` tool (left, right, center, top, bottom)
  - [x] 4.12 Implement `distributeShapes(shapeIds, direction)` tool (horizontal, vertical)
  - [x] 4.13 Implement `getCanvasState()` tool to return all shapes with properties
  - [x] 4.14 Implement `selectShapes(shapeIds)` tool to programmatically select shapes
  - [x] 4.15 Ensure all tools integrate with CanvasContext (createObject, updateObject, deleteObject, setSelectedIds)
  - [x] 4.16 Implement focal point calculation (viewport center) for smart positioning
  - [x] 4.17 Make each tool return array of affected shape IDs for auto-selection
  - [x] 4.18 Implement auto-selection of AI-created/modified shapes after command execution
  - [ ] 4.19 Implement command preview/summary generation for confirm mode (e.g., "Create 3 rectangles, 2 circles") - **OPTIONAL FOR NOW**
  - [ ] 4.20 Add 500 shape limit per command with truncation and warning - **OPTIONAL FOR NOW**
  - [ ] 4.21 Test each tool individually with sample commands - **See TESTING_AI_AGENT.md**

- [ ] 5.0 Implement AI mode toggle with localStorage persistence
  - [ ] 5.1 Create `src/utils/aiStorage.ts` with getAIMode() and setAIMode() functions
  - [ ] 5.2 Create `src/hooks/useAIMode.ts` hook with mode state and toggleMode function
  - [ ] 5.3 Create `AIModeToggle.tsx` component with switch UI (Auto/Confirm labels)
  - [ ] 5.4 Add toggle to chat panel header (between info button and close button)
  - [ ] 5.5 Implement visual feedback for toggle (blue for Auto, orange/amber for Confirm)
  - [ ] 5.6 Add tooltip explaining the difference between modes
  - [ ] 5.7 Load AI mode preference from localStorage on panel open (default: "auto")
  - [ ] 5.8 Save mode changes to localStorage with key "ai-mode-preference"
  - [ ] 5.9 Implement Auto mode behavior (execute tools immediately)
  - [ ] 5.10 Implement Confirm mode behavior (show confirmation panel, wait for approval)
  - [ ] 5.11 Handle "Apply Changes" button click in confirm mode (execute tools)
  - [ ] 5.12 Handle "Cancel" button click in confirm mode (abort without executing)
  - [ ] 5.13 Clear confirmation panel after apply or cancel

- [ ] 6.0 Testing, polish, and optimization
  - [ ] 6.1 Write unit tests for all 14 AI tools in `tests/ai.test.tsx`
  - [ ] 6.2 Write unit tests for rate limiting logic
  - [ ] 6.3 Write unit tests for focal point calculation
  - [ ] 6.4 Write component tests for AI chat panel in `tests/ai-panel.test.tsx`
  - [ ] 6.5 Test extensively with local Firebase Emulator (no deployment needed)
  - [ ] 6.6 Test Cloud Function endpoint with authenticated requests (local emulator)
  - [ ] 6.7 Test Cloud Function authentication rejection (local emulator)
  - [ ] 6.8 Test Cloud Function error handling (invalid inputs, OpenAI failures)
  - [ ] 6.9 Test Auto mode: commands execute immediately
  - [ ] 6.10 Test Confirm mode: confirmation panel appears and approve/cancel work
  - [ ] 6.11 Test localStorage persistence (mode saves and loads correctly)
  - [ ] 6.12 Test info modal: opens, shows examples, click-to-copy works
  - [ ] 6.13 Test AI Assistant button disabled state when Cloud Function unavailable
  - [ ] 6.14 Test all example commands manually (basic, manipulation, layout, complex)
  - [ ] 6.15 Test "Create login form" complex command (6+ elements)
  - [ ] 6.16 Test "Create navigation bar" complex command
  - [ ] 6.17 Test "Arrange in 3x3 grid" layout command
  - [ ] 6.18 Test error handling (empty command, gibberish, timeout)
  - [ ] 6.19 Test rate limiting (11th request shows error)
  - [ ] 6.20 Verify emulator hot-reload works (edit function code, see changes immediately)
  - [ ] 6.21 Test auto-selection (AI-created shapes are selected after execution)
  - [ ] 6.22 Verify API keys are NEVER exposed in client code or network requests
  - [ ] 6.23 Verify `functions/.env.local` is in `.gitignore`
  
  **⚡ CRITICAL PERFORMANCE TESTING (Rubric Requirements):**
  - [ ] 6.24 **Response Time Testing**: Test 20+ diverse commands, record actual response times
  - [ ] 6.25 **Response Time Testing**: Verify 90%+ complete in <2 seconds (18+ out of 20 must pass)
  - [ ] 6.26 **Response Time Testing**: Document any commands exceeding 2 seconds with reasons
  - [ ] 6.27 **Response Time Testing**: Test in both Auto and Confirm modes (confirm mode should still process in <2s)
  - [ ] 6.28 **Response Time Testing**: Include simple (1 shape), medium (5-10 shapes), and complex (login form) commands
  - [ ] 6.29 **Success Rate Testing**: Test 20+ commands and record success/failure for each
  - [ ] 6.30 **Success Rate Testing**: Verify 90%+ execute correctly (18+ out of 20 must work as intended)
  - [ ] 6.31 **Success Rate Testing**: Document any failed commands and reasons for failure
  - [ ] 6.32 **Success Rate Testing**: Include all 4 categories: creation, manipulation, layout, complex
  - [ ] 6.33 **Real-Time Sync Testing**: Open two browser windows, one user invokes AI, measure sync time
  - [ ] 6.34 **Real-Time Sync Testing**: Verify sync happens in <100ms (use performance.now() to measure)
  - [ ] 6.35 **Real-Time Sync Testing**: Test with simple (1 shape) and complex (10+ shapes) commands
  - [ ] 6.36 **Test Documentation**: Create `AI_PERFORMANCE_TESTS.md` with all test results
  - [ ] 6.37 **Test Documentation**: Include: command text, expected behavior, response time, success/failure, notes
  - [ ] 6.38 **Test Documentation**: Summary showing X/20 commands <2s (X%) and Y/20 successful (Y%)
  
  **Additional Performance & Polish:**
  - [ ] 6.39 Test performance with 100+ shapes created (maintain 60 FPS)
  - [ ] 6.40 Test rapid-fire 5 commands in a row (verify no rate limiting issues)
  - [ ] 6.41 Test multi-user scenario (two users invoking AI simultaneously, verify both sync correctly)
  - [ ] 6.42 Deploy Cloud Functions to staging: `firebase deploy --only functions --project staging`
  - [ ] 6.43 Test in staging environment with real Firebase (not emulator)
  - [ ] 6.44 Test Cloud Function cold start times in staging (first request after idle)
  - [ ] 6.45 Monitor Cloud Function logs in Firebase Console for errors and performance
  - [ ] 6.46 Verify OpenAI usage tracking in OpenAI dashboard
  - [ ] 6.47 Style all components to match app theme (dark theme, proper spacing)
  - [ ] 6.48 Add keyboard shortcut (Cmd+/) to open AI panel (optional)
  - [ ] 6.49 Fix any bugs discovered during testing
  - [ ] 6.50 Deploy Cloud Functions to production: `firebase deploy --only functions --project production`
  - [ ] 6.51 Update README with AI Assistant feature documentation and local development setup
  - [ ] 6.52 Document emulator setup and usage in README
  - [ ] 6.53 Include `AI_PERFORMANCE_TESTS.md` in project submission as proof of rubric compliance

