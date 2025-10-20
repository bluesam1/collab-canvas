# Feature PRD: State Management, Notifications & Enhanced Canvas Tools

**Project:** CollabCanvas - Phase 2 Enhancements  
**Target Completion:** Friday Evening (Early Submission)  
**Estimated Time:** 8-10 hours  
**Risk Level:** 🟡 **MEDIUM-HIGH** (affects core collaboration stability)

---

## Executive Summary

This PRD addresses critical stability issues and adds high-value features to strengthen our submission for the Friday deadline. We're focusing on:

1. **Connection State Management** - Making the app resilient to network issues
2. **User Presence Polish** - Fixing inconsistencies in online user tracking
3. **Activity Notifications** - Real-time awareness of collaborator actions
4. **Export Functionality** - PNG export for sharing work
5. **Copy/Paste** - Standard editing workflow
6. **Lasso Selection** - Advanced selection tool

**Rubric Impact:**
- **Section 1 (Persistence & Reconnection):** Currently 4-5 points → Target 8-9 points (+4 points)
- **Section 2 (Canvas Functionality):** Currently 5-6 points → Target 7-8 points (+2 points)
- **Section 3 (Advanced Features):** Currently 6 points → Target 12 points (+6 points)
- **Section 5 (Architecture Quality):** Better error handling (+1 point)
- **Total Expected Impact:** +13 points (from ~75 to ~88 points)

---

## Problem Statement

### Current Issues

**1. Connection State (Critical)**
- No indication when Firebase disconnects
- Users can attempt edits while offline, causing confusion
- No automatic reconnection handling
- Lost edits when connection drops

**2. Presence Issues (High Priority)**
- User colors may not persist correctly across sessions
- Users may appear offline when they're actually online
- No cleanup when users disconnect ungracefully
- Inconsistent user indicators across components

**3. Collaboration Awareness (Medium Priority)**
- Users don't know when others are editing
- No feedback on who created/modified what
- Silent updates can be disorienting

**4. Missing Core Features (Medium Priority)**
- No way to export/share work outside the app
- No standard copy/paste workflow (users expect Cmd+C/V)
- Only rectangular selection available

---

## Feature Specifications

### Feature 1: Connection State Management

**Goal:** Make the app resilient to network disconnections with clear user feedback

#### User Experience

**Connected State (Normal)**
- Green dot indicator in top-right corner
- All canvas operations enabled
- Real-time sync active

**Disconnected State (Read-Only)**
- Red dot indicator with "Disconnected" label
- Canvas becomes read-only (semi-transparent overlay)
- Toolbar buttons disabled
- Toast notification: "Connection lost. Attempting to reconnect..."
- Show countdown timer for reconnection attempts

**Reconnecting State**
- Orange/yellow dot indicator with "Reconnecting..." label
- Spinner animation
- Canvas remains read-only
- Show attempt number (e.g., "Reconnecting... (attempt 2 of 5)")

**Reconnected State**
- Green dot indicator returns
- Toast notification: "Reconnected! Your changes are syncing..."
- Canvas operations re-enabled
- Sync any pending changes (if queued locally)

#### Technical Approach

**Connection Monitoring**
- Use Firebase's `.info/connected` special location
- Listen for connection state changes
- Track connection/disconnection timestamps
- Count reconnection attempts (max 5 attempts, 30 seconds apart)

**Read-Only Mode**
- Add semi-transparent overlay to canvas when disconnected
- Prevent rectangle creation, movement, deletion
- Show tooltip: "Canvas is read-only while offline"
- Disable all toolbar buttons
- Prevent keyboard shortcuts

**Reconnection Strategy**
- Auto-retry connection every 30 seconds
- Max 5 attempts before showing "Manual reconnect required"
- Button to force reconnection
- On successful reconnect, sync any local pending changes

**State Preservation**
- Queue local changes during disconnect (optional enhancement)
- On reconnect, apply queued changes in order
- If conflicts occur, use last-write-wins
- Show toast for each synced change

---

### Feature 2: User Presence Polish

**Goal:** Fix inconsistencies in user presence tracking and make colors persistent

#### Issues to Fix

**1. Color Persistence**
- **Problem:** User colors may change between sessions
- **Solution:** Store user color in `/users/{userId}` on first login
- **Behavior:** Once assigned, color never changes (unless manually reset)

**2. Online Status Accuracy**
- **Problem:** Users may appear offline when online
- **Solution:** Proper Firebase presence setup with onDisconnect()
- **Behavior:** Status updates within 5 seconds of actual state change

**3. Disconnection Cleanup**
- **Problem:** Dead connections don't get cleaned up
- **Solution:** Firebase onDisconnect() to set isOnline: false
- **Behavior:** User removed from list within 30 seconds of disconnect

**4. Cursor Visibility**
- **Problem:** Cursors may linger after user disconnects
- **Solution:** Remove cursor when user goes offline
- **Behavior:** Cursor disappears immediately when status changes

#### Technical Approach

**Firebase Structure Updates:**
```
/users/{userId}
  id: string
  email: string
  color: string (assigned on first login, never changes)
  createdAt: timestamp
  lastSeenAt: timestamp

/presence/{canvasId}/{userId}
  userId: string
  email: string
  color: string (copied from /users/{userId})
  isOnline: boolean
  lastActive: timestamp
  cursor: { x, y }
```

**Color Assignment Strategy:**
- Check if user exists in `/users/{userId}`
- If new user, assign next available color from palette
- Store color permanently
- On subsequent logins, read existing color

**Presence Management:**
- Set online status when joining canvas
- Use onDisconnect() to automatically set offline on disconnect
- Filter offline users from cursor rendering
- Only show users where `isOnline: true` in online users list

---

### Feature 3: Activity Notifications

**Goal:** Show toast notifications when other users make changes

#### User Experience

**Notification Types:**

1. **User Joined**
   - Toast: "John joined the canvas"
   - Icon: User icon with color indicator
   - Duration: 3 seconds

2. **User Left**
   - Toast: "Sarah left the canvas"
   - Icon: User icon (grayed out)
   - Duration: 3 seconds

3. **Object Created**
   - Toast: "Mike created a rectangle"
   - Icon: Rectangle icon with user color
   - Duration: 2 seconds

4. **Object Deleted**
   - Toast: "Anna deleted an object"
   - Icon: Trash icon with user color
   - Duration: 2 seconds

5. **Canvas Cleared** (if multiple objects deleted at once)
   - Toast: "David cleared 5 objects"
   - Icon: Multiple trash icons
   - Duration: 3 seconds

**Behavior Rules:**
- **Only show for other users' actions** (not for current user)
- **Debounce rapid actions** (e.g., dragging doesn't spam notifications)
- **Group similar actions** (e.g., "John created 3 rectangles")
- **Position:** Top-right corner, below connection indicator
- **Max visible:** 3 notifications at once (oldest auto-dismiss)

#### Technical Approach

**Action Tracking:**
- Monitor object creation/deletion in CanvasContext
- Monitor user join/leave in PresenceContext
- Check if action was by current user (skip notification)
- Get user info from presence data

**Debouncing & Grouping:**
- Don't notify for cursor movements or drag updates
- Only notify when action is complete (object created/deleted)
- Group actions within 2-second window
- Flush grouped actions after timeout

**Optional Settings:**
- User preference to disable notifications
- Stored in localStorage: `notificationsEnabled: boolean`
- Toggle in settings menu (future enhancement)

---

### Feature 4: Export Canvas as PNG

**Goal:** Allow users to export the current canvas view as a PNG image

#### User Experience

**UI Location:**
- Add "Export PNG" button to toolbar (new section at bottom)
- Icon: Download icon
- Tooltip: "Export canvas as PNG (Cmd+E)"

**Export Flow:**
1. User clicks "Export PNG" button (or presses Cmd+E)
2. Canvas is rendered to PNG (entire 5000x5000px workspace)
3. Browser download dialog opens with filename: `CollabCanvas_[timestamp].png`
4. Success toast: "Canvas exported successfully"

**Export Options (Simple):**
- Export entire canvas (5000x5000px)
- Export current viewport only (optional checkbox)
- Background: White (or transparent - checkbox)

#### Technical Approach

**Canvas Export with Konva:**
- Use Konva's built-in `toDataURL()` method
- Set pixelRatio to 2 for higher quality
- Generate PNG data URL
- Trigger browser download with temporary anchor element

**Keyboard Shortcut:**
- Listen for Cmd+E / Ctrl+E
- Prevent default browser behavior
- Call export function

**Quality Settings:**
- pixelRatio: 2 (Retina quality)
- mimeType: 'image/png'
- quality: 1 (maximum)

---

### Feature 5: Copy/Paste Functionality

**Goal:** Support standard copy/paste workflow for canvas objects

#### User Experience

**Keyboard Shortcuts:**
- `Cmd+C` / `Ctrl+C` - Copy selected object(s)
- `Cmd+V` / `Ctrl+V` - Paste copied object(s)
- `Cmd+X` / `Ctrl+X` - Cut selected object(s) (copy + delete)

**Behavior:**
- Copy: Selected object(s) copied to internal clipboard
- Paste: Copied object(s) pasted at offset position (+20x, +20y from original)
- Cut: Selected object(s) copied and deleted
- Pasted objects are automatically selected
- Paste works multiple times (each paste creates new objects at further offset)

**Visual Feedback:**
- Toast notification: "1 object copied" or "3 objects copied"
- Toast notification: "Pasted"
- No notification for cut (already covered by delete notification)

#### Technical Approach

**Internal Clipboard:**
- Use React state for clipboard (not browser clipboard)
- Store array of selected objects
- Track paste offset for stacking behavior

**Copy Function:**
- Filter objects by selected IDs
- Store in clipboard state
- Show toast with count

**Paste Function:**
- Clone objects from clipboard
- Generate new unique IDs
- Apply offset to x/y positions
- Create all new objects in Firebase
- Select pasted objects
- Increment offset for next paste

**Cut Function:**
- Call copy function
- Call delete function
- Single notification from delete

**Edge Cases:**
- Pasting with no clipboard → silent (no action)
- Pasting objects off canvas → allow (user can pan)
- Copying 0 objects → silent (no action)
- Reset offset when copying new objects

---

### Feature 6: Lasso Selection Tool

**Goal:** Add free-form selection tool for selecting multiple objects

#### User Experience

**Mode Activation:**
- Add "Lasso Select" button to toolbar (new section)
- Icon: Lasso/rope icon
- Tooltip: "Lasso Select (L)"
- Keyboard shortcut: `L` key toggles lasso mode

**Lasso Mode Behavior:**
1. Click "Lasso Select" button or press `L`
2. Cursor changes to crosshair with lasso icon
3. Click and drag on canvas to draw free-form path
4. Path shown as dashed line while dragging
5. On release, all objects within/intersecting path are selected
6. Mode automatically exits after selection (returns to Pan mode)

**Visual Feedback:**
- Active lasso path shown as animated dashed line
- Path color: Blue (#3B82F6)
- Line width: 2px
- Dash pattern: [5, 5]
- Objects within selection highlight in real-time (preview)

#### Technical Approach

**Lasso Mode State:**
- Add 'lasso' to CanvasMode type ('pan' | 'rectangle' | 'lasso')
- Track lasso path points as array of {x, y}
- Track isActive boolean for drawing state

**Drawing Logic:**
- On mousedown: Start path with initial point
- On mousemove: Append points to path array
- On mouseup: Complete path and select objects

**Selection Algorithm:**
- Use point-in-polygon algorithm (ray casting)
- Check if object center is within lasso path
- Alternative: Check if any corner is within path
- Select all objects that pass the test

**Visual Rendering:**
- Render lasso path as Konva Line component
- Dashed stroke style
- Blue color matching theme
- Remove path after selection complete

**Cursor Management:**
- Change cursor to crosshair in lasso mode
- Disable pan/zoom while in lasso mode
- Disable rectangle creation in lasso mode

**Edge Cases:**
- Lasso with < 3 points → no selection (need closed shape)
- Account for stage transform (pan/zoom)
- Optimize for complex paths if needed

---

## Implementation Phases

### Phase 1: Critical Stability (4 hours)

**Connection State Management (2.5 hours)**
- Create ConnectionContext with state tracking
- Add ConnectionIndicator visual component
- Implement read-only overlay on canvas
- Disable toolbar buttons when offline
- Add reconnection logic with retries
- Test disconnection/reconnection flow

**User Presence Polish (1.5 hours)**
- Update UserContext to store color on first login
- Fix PresenceContext with proper onDisconnect()
- Filter offline users from cursor rendering
- Update OnlineUsers component filtering
- Test presence across multiple sessions

### Phase 2: Enhanced Features (3 hours)

**Activity Notifications (1.5 hours)**
- Add notification triggers in CanvasContext
- Add notification triggers in PresenceContext
- Implement action grouping/debouncing logic
- Test notifications with multiple users

**Export Canvas as PNG (1.5 hours)**
- Create ExportButton component
- Implement export logic using Konva toDataURL
- Add keyboard shortcut (Cmd+E)
- Test export with various canvas sizes
- Verify PNG quality

### Phase 3: Advanced Tools (3 hours)

**Copy/Paste Functionality (1.5 hours)**
- Add clipboard state to CanvasContext
- Implement copy/paste/cut functions
- Add keyboard shortcuts (Cmd+C/V/X)
- Test copy/paste workflow with multiple objects

**Lasso Selection Tool (1.5 hours)**
- Add lasso mode to CanvasContext types
- Create LassoButton and LassoPath components
- Implement lasso drawing logic
- Implement point-in-polygon selection algorithm
- Add keyboard shortcut (L key)
- Test lasso with complex selections

---

## Testing Strategy

### Integration Testing (Critical)

**Connection State:**
- Connection state affects canvas operations correctly
- Read-only mode prevents all editing
- Toolbar buttons disabled appropriately
- Reconnection restores full functionality

**User Presence:**
- User colors persist across sessions
- Online status updates within 5 seconds
- Disconnected users removed from list
- Cursors hidden for offline users

**Activity Notifications:**
- Notifications show only for other users
- Actions are grouped appropriately
- No notification spam during rapid actions
- Max 3 notifications visible at once

**Export:**
- Export produces valid PNG file
- PNG includes all canvas objects
- Export quality is high (pixelRatio: 2)
- Keyboard shortcut works

**Copy/Paste:**
- Copy stores selected objects
- Paste creates new objects at offset
- Multiple pastes stack correctly
- Cut removes original objects

**Lasso Selection:**
- Lasso path draws correctly
- Point-in-polygon algorithm accurate
- Selected objects highlighted
- Mode exits after selection

### Manual Testing (Required)

**Multi-User Testing:**
- Open in 2+ browsers
- Test all features with multiple users
- Verify real-time sync still works
- Check notifications appear correctly

**Network Testing:**
- Simulate disconnect (Chrome DevTools → Offline)
- Verify read-only mode activates
- Test reconnection flow
- Ensure no data loss

**Keyboard Shortcuts:**
- Test all shortcuts (Cmd+C/V/X/E, L, Delete, Escape)
- Verify no conflicts with browser shortcuts
- Test on both Mac (Cmd) and Windows (Ctrl)

**Export Quality:**
- Export canvas with 50+ objects
- Verify PNG quality is good
- Test with different object colors
- Check file size is reasonable

**Edge Cases:**
- Paste with empty clipboard
- Lasso with very few points
- Export very large canvas
- Copy/paste during disconnect

---

## Success Criteria

### Must Have (For Friday Submission)
- ✅ Connection state indicator working
- ✅ Read-only mode during disconnect
- ✅ User colors persist across sessions
- ✅ User presence accurately reflects online status
- ✅ Activity notifications for user actions
- ✅ Export canvas as PNG working
- ✅ Copy/paste functionality working
- ✅ Lasso selection tool working

### Should Have (Polish)
- ✅ Reconnection with retry logic
- ✅ Notification grouping for rapid actions
- ✅ Export with quality settings
- ✅ Cursor cleanup on disconnect

### Nice to Have (If Time Permits)
- ⭕ Queue local changes during disconnect
- ⭕ Export viewport only option
- ⭕ User preference for notifications
- ⭕ Lasso path simplification for performance

---

## Risk Assessment & Mitigation

### High Risk Items

**1. Connection State Management**
- **Risk:** Firebase `.info/connected` may not work as expected
- **Mitigation:** Test extensively in Chrome DevTools offline mode
- **Fallback:** Use periodic heartbeat pings instead

**2. User Presence OnDisconnect**
- **Risk:** onDisconnect() may not trigger in all scenarios
- **Mitigation:** Add timestamp-based cleanup (remove users inactive > 2 mins)
- **Fallback:** Manual refresh clears stale presence

**3. Lasso Selection Performance**
- **Risk:** Point-in-polygon algorithm slow with many objects
- **Mitigation:** Only check objects in bounding box first
- **Fallback:** Simplify algorithm to bounding box intersection only

### Medium Risk Items

**4. Export Quality**
- **Risk:** Large canvas (5000x5000) may cause memory issues
- **Mitigation:** Use pixelRatio: 2 max, warn for very large canvases
- **Fallback:** Export viewport only

**5. Notification Spam**
- **Risk:** Too many notifications overwhelm users
- **Mitigation:** Aggressive grouping and debouncing
- **Fallback:** Add user preference to disable

---

## Rubric Scoring Impact

### Section 1: Core Collaborative Infrastructure (+4 points)

**Persistence & Reconnection (4-5 → 8-9 points)**
- ✅ Connection state management with visual feedback
- ✅ Read-only mode during disconnect
- ✅ Auto-reconnection with retry logic
- ✅ Presence cleanup on disconnect
- ✅ Clear UI indicators for connection status

**Justification:** Moving from "Satisfactory" (state inconsistencies, requires refresh) to "Excellent" (seamless reconnection, no data loss)

### Section 2: Canvas Features & Performance (+2 points)

**Canvas Functionality (5-6 → 7-8 points)**
- ✅ Export as PNG (Tier 1 feature - 2 points)
- ✅ Copy/paste functionality (Tier 1 feature - 2 points)
- ✅ Lasso selection tool (Tier 2 feature - 3 points)

**Justification:** Adding 3 significant features that are expected in modern design tools

### Section 3: Advanced Figma-Inspired Features (+6 points)

**Current Features (6 points):**
- Keyboard shortcuts (Delete, Arrow keys) - Tier 1: 2 points
- Color picker - Tier 1: 2 points
- Canvas modes (Pan/Rectangle) - Tier 1: 2 points

**New Features (+6 points):**
- ✅ Export as PNG - Tier 1: +2 points
- ✅ Copy/paste - Tier 1: +2 points
- ✅ Lasso selection - Tier 2: +3 points (partial, counts as selection enhancement)

**Total:** 5 Tier 1 + 1 partial Tier 2 = 12 points

**Justification:** Moving from minimal features to comprehensive feature set

### Section 5: Architecture Quality (+1 point)

**Current:** 4 points (solid structure, minor issues)  
**Target:** 5 points (excellent with proper error handling)

**Improvements:**
- Robust connection state management
- Proper error boundaries
- Graceful degradation (read-only mode)
- Clean separation of concerns

### Total Expected Score

**Before:** ~75 points (C+ / B- range)
- Section 1: 17/30 (4+9+4)
- Section 2: 14/20 (5+9)
- Section 3: 6/15
- Section 4: 25/25 (assumed AI agent complete)
- Section 5: 8/10 (4+4)
- Section 6: 5/5

**After:** ~88 points (solid B+ / A- range)
- Section 1: 21/30 (8+9+4)
- Section 2: 16/20 (7+9)
- Section 3: 12/15
- Section 4: 25/25
- Section 5: 9/10 (5+4)
- Section 6: 5/5

**Impact:** +13 points

---

## Future Enhancements (Post-Friday)

### Phase 3 Features (If Time After Friday)

**Undo/Redo System** (Tier 1: +2 points)
- Command pattern for all operations
- Keyboard shortcuts: Cmd+Z, Cmd+Shift+Z
- History stack with size limit

**Alignment Tools** (Tier 2: +3 points)
- Align left/right/center/top/bottom
- Distribute horizontally/vertically
- Align to canvas center

**Snap-to-Grid** (Tier 1: +2 points)
- Toggle grid visibility
- Snap objects to grid during movement
- Configurable grid size

**Object Grouping** (Tier 1: +2 points)
- Group/ungroup selected objects
- Transform groups together
- Nested groups support

**Layer Panel** (Tier 2: +3 points)
- Visual hierarchy of objects
- Drag to reorder
- Z-index management
- Show/hide layers

### Sunday Polish (Final Submission)
- Performance optimization for 100+ objects
- Cross-browser testing
- Mobile responsive improvements
- Demo video preparation
- Documentation polish
- AI agent enhancements

---

## Questions & Decisions Log

### Q1: Should notifications persist across page refreshes?
**Decision:** No, notifications are ephemeral and session-only  
**Reason:** Keeps implementation simple, not critical for UX

### Q2: Should lasso tool support additive selection (Shift+Lasso)?
**Decision:** No, single selection only for MVP  
**Reason:** Time constraint, can add in future iteration

### Q3: Should export include grid/background?
**Decision:** No, export canvas content only (transparent or white background)  
**Reason:** Cleaner export, more useful for sharing

### Q4: Should we support Cmd+D for duplicate (in addition to copy/paste)?
**Decision:** Not in this PR, may add later  
**Reason:** Copy/paste is more standard and versatile

### Q5: Should connection indicator be dismissible?
**Decision:** No, always visible  
**Reason:** Critical information, should not be hidden

### Q6: Should we debounce presence updates to reduce Firebase costs?
**Decision:** Yes, already throttled to 50ms (existing implementation)  
**Reason:** Good balance of responsiveness and cost

### Q7: Should lasso selection clear on Escape?
**Decision:** Yes, consistent with other selections  
**Reason:** Standard behavior, expected by users

---

## Demo Preparation (For Friday Video)

### 3-5 Minute Demo Structure

**1. Connection Management (30 seconds)**
- Show green connection indicator
- Simulate disconnect (go offline)
- Show red indicator and read-only mode
- Reconnect and show recovery

**2. Activity Notifications (30 seconds)**
- Open second browser window
- Create/delete objects in second window
- Show notifications appearing in first window
- Demonstrate grouping for rapid actions

**3. Export Canvas (30 seconds)**
- Show canvas with multiple objects
- Click "Export PNG" button (or Cmd+E)
- Show downloaded PNG file
- Open PNG to verify quality

**4. Copy/Paste Workflow (1 minute)**
- Create rectangle
- Select and copy (Cmd+C)
- Paste multiple times (Cmd+V)
- Show offset stacking behavior
- Demonstrate cut (Cmd+X)

**5. Lasso Selection (1 minute)**
- Press L to activate lasso mode
- Draw lasso around multiple objects
- Show all objects selected
- Move selection together
- Exit lasso mode

**6. Architecture Explanation (1 minute)**
- Brief overview of implementation approach
- Highlight connection state management
- Mention Firebase presence system
- Explain optimistic updates

---

## Deployment Checklist

### Before Deploying
- [ ] All manual tests pass
- [ ] Connection state tested with network throttling
- [ ] Export tested on large canvases (100+ objects)
- [ ] Copy/paste tested with multiple objects
- [ ] Lasso tested with complex selections
- [ ] No console errors or warnings
- [ ] Performance acceptable (60 FPS maintained)

### After Deploying
- [ ] Test on production URL with multiple devices
- [ ] Verify Firebase presence cleanup working
- [ ] Check export quality on production
- [ ] Test all keyboard shortcuts
- [ ] Monitor Firebase usage/costs
- [ ] Test notifications across browsers
- [ ] Verify connection state indicator

---

## Documentation Updates

### README.md Updates

Add to features section:
- ✅ **Connection State Management** - Visual indicator with auto-reconnection
- ✅ **Real-time Activity Notifications** - See when collaborators make changes
- ✅ **Export Canvas as PNG** - High-quality export with Cmd+E shortcut
- ✅ **Copy/Paste Objects** - Standard workflow with Cmd+C, Cmd+V, Cmd+X
- ✅ **Lasso Selection Tool** - Free-form selection with L key

### Keyboard Shortcuts Reference

Add comprehensive shortcuts section:
- **Cmd/Ctrl + C** - Copy selected objects
- **Cmd/Ctrl + V** - Paste copied objects
- **Cmd/Ctrl + X** - Cut selected objects
- **Cmd/Ctrl + E** - Export canvas as PNG
- **L** - Toggle lasso selection mode
- **V** - Switch to pan mode
- **R** - Switch to rectangle mode
- **Delete/Backspace** - Delete selected objects
- **Escape** - Deselect all objects

---

## Rollback Plan

### If Features Break Production

**Immediate Response:**
1. Revert to last stable commit
2. Identify which feature caused issue
3. Debug and patch specific feature
4. Test thoroughly before redeploying

### Feature-Specific Rollback

**Connection State:** Can disable indicator, app still works  
**Notifications:** Can disable toast calls, app still works  
**Export:** Can remove button, no impact on core functionality  
**Copy/Paste:** Can remove shortcuts, no impact on canvas  
**Lasso:** Can hide button, other selection methods work

### Isolation Strategy

Each feature is designed to be independently toggleable:
- Comment out ConnectionIndicator component
- Remove notification calls
- Hide export button
- Disable keyboard shortcuts
- Hide lasso button

---

## Sign-Off

**Document Author:** AI Assistant  
**Reviewed By:** [Your Name]  
**Approved By:** [Your Name]  
**Date:** [Current Date]  
**Version:** 1.0

**Next Review:** After Friday submission (retrospective on what worked/didn't)

---

## Changelog

### Version 1.0 (Initial)
- Complete PRD for 6 features
- Implementation phases with time estimates
- Testing strategy and success criteria
- Rubric impact analysis (+13 points)
- Risk assessment and mitigation plans
- Demo preparation guidelines
- Deployment and rollback procedures