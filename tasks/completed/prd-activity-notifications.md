# Feature PRD: Real-Time Activity Notifications

## Introduction/Overview

This feature adds real-time awareness of collaborator actions within CollabCanvas. Currently, when multiple users work on the same canvas, changes happen silently without any indication of who did what. This can be disorienting and makes collaboration feel disconnected.

**Problem Solved:** Users are unaware when collaborators join, leave, create objects, or delete objects, leading to a disconnected collaboration experience and potential confusion about changes appearing on the canvas.

**Target Users:** All CollabCanvas collaborators working on shared canvases who need awareness of team activity.

## Goals

1. Provide real-time notifications when collaborators join or leave the canvas
2. Show notifications when collaborators create or delete objects
3. ~~Group rapid actions to prevent notification spam~~ **[DEFERRED]**
4. Display notifications in a non-intrusive way that doesn't block workflow
5. Include visual indicators (user colors, icons) to make notifications scannable
6. Limit maximum visible notifications to maintain clean UI

**Implementation Note:** Goal #3 (action grouping/debouncing) has been deferred to a future phase due to complexity risk. Initial implementation will show individual notifications for each action.

## User Stories

**As a canvas collaborator, I want to:**
- Be notified when someone joins the canvas, so I know who I'm working with
- Be notified when someone leaves, so I understand who is still active
- See when someone creates an object, so I'm aware of new additions to the canvas
- See when someone deletes objects, so I understand what was removed
- Not be overwhelmed by notification spam during rapid actions
- Quickly identify who performed an action by their color indicator

**As a canvas user, I want to:**
- See notifications positioned where they don't block my work
- Have notifications automatically dismiss after a reasonable time
- Be able to dismiss notifications manually if needed
- Not see notifications for my own actions (that would be redundant)

## Functional Requirements

### FR1: User Join Notifications
- When another user joins the canvas, the system MUST show a toast notification
- Notification format: "[User email] joined the canvas"
- Icon: User icon with the user's assigned color
- Duration: 3 seconds
- The system MUST NOT show notification for the current user's own join

### FR2: User Leave Notifications
- When another user leaves the canvas, the system MUST show a toast notification
- Notification format: "[User email] left the canvas"
- Icon: User icon (grayed out or with exit indicator)
- Duration: 3 seconds
- The system MUST NOT show notification for the current user's own leave

### FR3: Object Creation Notifications
- When another user creates an object, the system MUST show a toast notification
- Notification format: "[User email] created a [shape type]"
- Icon: Shape icon (rectangle/circle/line/text) with user's color
- Duration: 2 seconds
- The system MUST NOT show notification for the current user's creations

### FR4: Object Deletion Notifications
- When another user deletes an object, the system MUST show a toast notification
- Notification format: "[User email] deleted an object"
- Icon: Trash icon with user's color
- Duration: 2 seconds
- The system MUST NOT show notification for the current user's deletions

### FR5: Bulk Deletion Notifications **[DEFERRED]**
- ~~When another user deletes multiple objects (3+), the system MUST show a grouped notification~~
- ~~Notification format: "[User email] deleted [count] objects"~~
- ~~Icon: Multiple trash icons or single trash icon with count badge~~
- ~~Duration: 3 seconds~~
- ~~Threshold: 3 or more objects deleted within 2-second window~~
- **Deferred to future phase - will show individual notifications instead**

### FR6: Action Grouping **[DEFERRED]**
- ~~The system MUST group similar actions by the same user within a 2-second window~~
- ~~For creation: "[User email] created 3 rectangles" instead of 3 separate notifications~~
- ~~For deletion: "[User email] deleted 5 objects" instead of 5 separate notifications~~
- ~~Grouped notifications MUST show only after the action window closes (2 seconds of inactivity)~~
- **Deferred to future phase - will show individual notifications instead**

### FR7: Debouncing Rules **[PARTIALLY IMPLEMENTED]**
- The system MUST NOT show notifications for:
  - Cursor movements ✅
  - Object drag operations (position updates) ✅
  - Object resize operations ✅
  - Object color changes (considered updates, not creates) ✅
- The system MUST only notify on completed actions:
  - Object creation (after mouseup/object added to Firebase) ✅
  - Object deletion (after delete confirmation) ✅
- **Note:** Basic debouncing is implemented (no notifications for non-create/delete actions), but time-window grouping is deferred

### FR5: Notification Positioning & Behavior
- Notifications MUST appear in the top-right corner of the canvas
- Position: Below connection indicator (if present)
- Stack vertically with 8px gap between notifications
- Maximum visible notifications: 3 at a time
- When 4th notification arrives, oldest MUST be dismissed automatically
- Notifications MUST auto-dismiss after their duration
- Notifications MUST be manually dismissible via close button (×)

### FR6: Notification Visual Design
- Each notification MUST include:
  - User color indicator (8px dot or border)
  - Icon representing action type
  - Text message describing the action
  - Close button (×)
- Background: White with subtle shadow
- Border-radius: 8px
- Padding: 12px 16px
- Animation: Slide in from right, slide out to right

### FR7: User Attribution
- All notifications MUST display the acting user's email
- If user email is too long (>30 chars), truncate with ellipsis
- Notifications MUST use the user's assigned presence color
- Color MUST be consistent with cursor and online users list

### FR8: Object Modification Notifications **[PHASE 2 - DISABLED - INFRASTRUCTURE ONLY]**
- ~~When another user modifies an object, the system MUST show a toast notification~~
- ~~Notification format: "[User email] modified a [shape type]"~~
- ~~Icon: Edit icon (Pencil) with user's color~~
- ~~Duration: 2 seconds~~
- ~~The system MUST NOT show notification for the current user's modifications~~
- **Status**: Infrastructure implemented (`updatedBy` field, UI components, Firebase rules), but detection logic disabled due to technical issues
- **What Works**: `updatedBy` field is being set on all updates, ready for future re-enable
- **What's Disabled**: Notification triggering logic is commented out in code pending debugging
- Modifications that WOULD be detected (when re-enabled):
  - Position changes (drag)
  - Size changes (resize/radius)
  - Color changes (fill/stroke)
  - Rotation changes
  - Text content changes (for text objects)

## Non-Goals (Out of Scope)

1. **Notification history or log** - Notifications are ephemeral, no persistent history
2. **User preference settings** - All users see same notifications, no opt-out in this phase
3. **Sound notifications** - Visual only, no audio alerts
4. **Desktop push notifications** - Browser tab only, no system-level notifications
5. **Notification for AI actions** - Only human collaborator actions
6. **Detailed change descriptions** - Simple "modified," not "moved from X to Y" or "changed color from red to blue"
7. **@mentions or direct notifications** - Broadcast only, no targeted notifications
8. **Notification persistence across refresh** - Reset on page load
9. **Action grouping and time-windowed debouncing** - Deferred to future phase (see FR5-FR6)

## Design Considerations

### Visual Design Specs

**Notification Container:**
```
Position: fixed
Top: 80px (below connection indicator)
Right: 24px
Width: 320px
Z-index: 40 (below modals, above canvas)
```

**Individual Notification:**
```
Background: white
Border: 1px solid gray-200
Border-radius: 8px
Box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1)
Padding: 12px 16px
Display: flex (icon + text + close button)
```

**User Color Indicator:**
- 8px colored dot next to icon
- Uses user's assigned presence color
- Helps quickly identify who performed action

**Icons:**
- User join: User icon (from lucide-react)
- User leave: UserMinus icon
- Object created: Shape icon (Square, Circle, Minus, Type)
- Object deleted: Trash2 icon
- **[PHASE 2]** Object modified: Pencil icon
- Size: 20px × 20px

**Animation:**
```
Enter: slide-in-right (200ms ease-out)
Exit: slide-out-right (150ms ease-in)
Auto-dismiss: fade-out (100ms) then slide-out
```

### Accessibility
- Notifications should be aria-live="polite" for screen readers
- Close button should have aria-label="Dismiss notification"
- Color indicators should not be the only way to identify users (email is primary)
- Sufficient color contrast for text (WCAG AA)

## Technical Considerations

### Context Integration

**CanvasContext Changes:**
- Monitor object creation in `createObject()` function
- Monitor object deletion in `deleteObject()` function
- **[PHASE 2]** Monitor object updates in Firebase listener (detect changes to existing objects)
- Check if action is by current user (skip notification)
- Emit notification event with action details

**Database Schema Changes (Phase 2):**
All shape types need to add:
```typescript
updatedBy: string; // User ID of last user who modified this object
```

This affects:
- `Rectangle` interface
- `Circle` interface
- `Line` interface
- `Text` interface

Update operations must set:
- `updatedBy` to current user's UID
- `updatedAt` to current timestamp

**PresenceContext Changes:**
- Monitor user join (new user in presence with isOnline: true)
- Monitor user leave (existing user changes to isOnline: false)
- Emit notification event with user details

### Notification Management

**Create NotificationContext:**
```typescript
interface Notification {
  id: string;
  type: 'user-join' | 'user-leave' | 'object-created' | 'object-deleted' | 'object-modified'; // [PHASE 2: added object-modified]
  userEmail: string;
  userColor: string;
  message: string;
  timestamp: number;
  shapeType?: 'rectangle' | 'circle' | 'line' | 'text'; // For object-created/modified notifications
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
}
```

**~~Grouping Logic:~~** *(Deferred to future phase)*

### Performance Considerations

- Use useCallback for notification handlers to prevent unnecessary re-renders
- Limit notification array to max 10 items (even if only showing 3)
- Clean up old notifications after 30 seconds
- Debounce rapid Firebase listener updates (they already fire frequently)
- Use React.memo for NotificationItem component

### Firebase Listener Strategy

**Object Creation Detection:**
```typescript
// In CanvasContext
useEffect(() => {
  const unsubscribe = onValue(objectsRef, (snapshot) => {
    const newObjects = parseSnapshot(snapshot);
    
    // Compare with previous state to find new objects
    const addedObjects = findAdded(prevObjects, newObjects);
    
    addedObjects.forEach(obj => {
      if (obj.createdBy !== currentUserId) {
        notifyObjectCreated(obj);
      }
    });
  });
  
  return unsubscribe;
}, [canvasId]);
```

**User Presence Detection:**
```typescript
// In PresenceContext
useEffect(() => {
  const unsubscribe = onValue(presenceRef, (snapshot) => {
    const newPresence = parseSnapshot(snapshot);
    
    // Compare with previous state
    const joined = findJoined(prevPresence, newPresence);
    const left = findLeft(prevPresence, newPresence);
    
    joined.forEach(user => notifyUserJoined(user));
    left.forEach(user => notifyUserLeft(user));
  });
  
  return unsubscribe;
}, [canvasId]);
```

## Success Metrics

### Functional Success
- ✅ Notifications appear for all user actions (join/leave/create/delete)
- ✅ No notifications shown for current user's own actions
- ~~✅ Grouped notifications work correctly (3+ actions in 2 seconds)~~ *(Deferred)*
- ✅ Maximum 3 notifications visible at once
- ✅ Auto-dismiss after correct duration (2-3 seconds)
- ✅ Manual dismiss works immediately

### User Experience
- ✅ Notifications feel helpful, not annoying (user feedback)
- ✅ No reports of notification spam or excessive noise
- ✅ Users report better awareness of collaborator activity
- ✅ Collaboration feels more connected and real-time
- ✅ Notifications don't obstruct canvas work

### Performance
- ✅ No noticeable performance impact with 5+ active users
- ✅ Notification rendering doesn't cause frame drops
- ✅ Memory usage stays stable with notifications active
- ✅ Firebase listener updates don't cause notification spam

### Technical Success
- ✅ Zero console errors related to notifications
- ✅ No memory leaks from notification timers
- ✅ Proper cleanup on component unmount
- ~~✅ Grouping logic works across different action types~~ *(Deferred)*

## Open Questions

1. **Q: Should we show notifications for object updates (move/resize/color)?**
   - ~~Decision: No, too noisy. Only create/delete for MVP.~~
   - **Updated Decision (Phase 2):** YES - Added as FR8. Requires database changes:
     - Add `updatedBy` field to all shape types
     - Track who modified each object
     - Detect modifications via Firebase listener
     - Show "modified a [shape type]" notifications
     - Estimated 2-3 hours including migration

2. **Q: Should there be a user preference to disable notifications?**
   - Decision: Not in this phase. Can add later if users request it.

3. **Q: What if a user creates many objects rapidly (10+ in a few seconds)?**
   - ~~Decision: Group them all into one notification. "Created 10 rectangles."~~
   - **Updated Decision:** Grouping deferred to future phase. Initial implementation will show individual notifications. If spam becomes an issue, we can add grouping later.

4. **Q: Should we differentiate between different shape types in notifications?**
   - Decision: Yes. "Created a rectangle" vs "Created a circle" is more informative.

5. **Q: Should notifications persist across page refresh?**
   - Decision: No. Notifications are ephemeral and session-only.

6. **Q: What if the canvas has 20+ active users?**
   - Decision: Notifications will be frequent but still valuable. If it becomes a problem, we can add user preference later.

7. **Q: Should AI agent actions trigger notifications?**
   - Decision: Not in this phase. AI actions are requested by the user, so they're aware of them.

8. **Q: Should we show different notification styles for different action types?**
   - Decision: No, consistent style is cleaner. Use icons and colors for differentiation.

## Testing Checklist

### Basic Functionality
- [ ] User join notification appears when another user joins
- [ ] User leave notification appears when another user leaves
- [ ] Object creation notification appears when another user creates object
- [ ] Object deletion notification appears when another user deletes object
- [ ] No notifications appear for current user's own actions

### Debouncing (Basic) **[Grouping Deferred]**
- [ ] ~~Multiple creates within 2 seconds grouped into one notification~~ *(Deferred)*
- [ ] ~~Multiple deletes within 2 seconds grouped into one notification~~ *(Deferred)*
- [ ] ~~Grouped notification shows correct count~~ *(Deferred)*
- [ ] No notifications for cursor movements ✅
- [ ] No notifications during object drag ✅
- [ ] No notifications during object resize ✅

### Visual & Behavior
- [ ] Notifications appear in top-right corner
- [ ] Maximum 3 notifications visible at once
- [ ] 4th notification causes oldest to dismiss
- [ ] Auto-dismiss after correct duration
- [ ] Manual dismiss (×) works immediately
- [ ] Slide-in/out animations smooth
- [ ] User color indicator matches presence color

### Multi-User Testing
- [ ] Test with 2 users: all actions notify correctly
- [ ] Test with 5+ users: notifications not overwhelming
- [ ] Rapid actions by multiple users handled gracefully
- [ ] User colors consistent across notifications and cursors

### Edge Cases
- [ ] User with very long email (>30 chars) truncates correctly
- [ ] Creating then immediately deleting object
- [ ] Multiple users joining simultaneously
- [ ] User disconnecting mid-action
- [ ] Page refresh clears all notifications
- [ ] Notifications don't stack infinitely in DOM

### Performance Testing
- [ ] No memory leaks from notification timers
- [ ] No console errors or warnings
- [ ] Canvas remains responsive with many notifications
- [ ] Firebase listener updates don't spam notifications

