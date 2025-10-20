# Task List: Real-Time Activity Notifications

Based on PRD: `prd-activity-notifications.md`

## Relevant Files

**Phase 1 (Completed):**
- `src/contexts/NotificationContext.tsx` - Core notification state management and context provider
- `src/hooks/useNotification.ts` - Hook for consuming notification context
- `src/components/common/NotificationContainer.tsx` - Container component for displaying notifications
- `src/components/common/NotificationItem.tsx` - Individual notification display component
- `src/types/index.ts` - Notification type definitions
- `src/contexts/CanvasContext.tsx` - Emits object creation/deletion notifications
- `src/contexts/PresenceContext.tsx` - Emits user join/leave notifications
- `src/pages/CanvasEditorPage.tsx` - Displays NotificationContainer

**Phase 2 (Object Modifications - Requires Database Changes):**
- `src/types/index.ts` - Add `updatedBy` field to all shape interfaces
- `src/contexts/CanvasContext.tsx` - Detect modifications, emit notifications, set `updatedBy`
- `src/components/common/NotificationItem.tsx` - Add Pencil icon for modifications
- Firebase Database - Migrate existing objects to include `updatedBy` field

### Notes

- Notifications are displayed as toast-style popups in the top-right corner
- Maximum 3 notifications visible at once (oldest auto-dismisses when 4th arrives)
- No tests required initially - manual testing will be performed
- **Phase 2 requires database schema changes and data migration**

## Tasks

- [x] 1.0 Create Notification System Infrastructure
  - [x] 1.1 Add Notification type definitions to `src/types/index.ts`
  - [x] 1.2 Create `src/contexts/NotificationContext.tsx` with state management
  - [x] 1.3 Create `src/hooks/useNotification.ts` hook
  - [x] 1.4 Add NotificationContextProvider to app provider tree in `src/App.tsx`
- [x] 2.0 Integrate Object Action Notifications (CanvasContext)
  - [x] 2.1 Import and use useNotification hook in CanvasContext
  - [x] 2.2 Add notification emission for object creation (via Firebase listener)
  - [x] 2.3 Add notification emission for object deletion (via Firebase listener)
  - [x] 2.4 Ensure notifications only fire for other users' actions (not current user)
- [x] 3.0 Integrate User Presence Notifications (PresenceContext)
  - [x] 3.1 Import and use useNotification hook in PresenceContext
  - [x] 3.2 Track previous presence state to detect joins/leaves
  - [x] 3.3 Add notification emission when user joins (isOnline changes to true)
  - [x] 3.4 Add notification emission when user leaves (isOnline changes to false)
  - [x] 3.5 Ensure notifications only fire for other users (not current user)
- [x] 4.0 Build Notification UI Components
  - [x] 4.1 Create `src/components/common/NotificationItem.tsx` with user color, icon, message, and dismiss button
  - [x] 4.2 Add slide-in/out animations using Tailwind CSS
  - [x] 4.3 Create `src/components/common/NotificationContainer.tsx` to manage notification list
  - [x] 4.4 Implement max 3 visible notifications logic in container
  - [x] 4.5 Add NotificationContainer to `src/pages/CanvasEditorPage.tsx`
  - [x] 4.6 Add appropriate icons for each notification type (User, UserMinus, Square, Circle, Minus, Type, Trash2)
- [ ] 5.0 Implement Action Grouping and Debouncing ⚠️ **DEFERRED - Not implementing due to risk**
- [x] 6.0 **[PHASE 2 - DISABLED]** Add Object Modification Notifications **[NOTIFICATION DETECTION DISABLED DUE TO TECHNICAL ISSUES]**
  - [x] 6.1 Add `updatedBy: string` field to all shape type interfaces in `src/types/index.ts`
  - [x] 6.2 Update `updateObject` function in CanvasContext to set `updatedBy` to current user UID
  - [x] 6.3 Update `updateObjectsBatch` function in CanvasContext to set `updatedBy`
  - [x] 6.4 ~~Modify Firebase listener to detect object modifications~~ **[DISABLED]**
  - [x] 6.5 ~~Add notification emission for object modifications~~ **[DISABLED]**
  - [x] 6.6 Add 'object-modified' to NotificationType in types
  - [x] 6.7 Update NotificationItem component to handle 'object-modified' type with Pencil icon
  - [x] 6.8 Update Firebase database rules to allow `updatedBy` field
  - [ ] 6.9 **[FUTURE]** Fix and re-enable modification detection - detection logic needs debugging
- [x] 7.0 Testing and Refinement **[PHASE 1 TESTED AND WORKING]**
  - [x] 7.1 Manual test: User join/leave notifications appear correctly
  - [x] 7.2 Manual test: Object create/delete notifications appear correctly
  - [x] 7.3 Manual test: No notifications for current user's own actions
  - [x] 7.4 Manual test: Maximum 3 notifications enforced
  - [x] 7.5 Manual test: Auto-dismiss and manual dismiss work correctly
  - [x] 7.6 Manual test: User colors match presence colors
  - [x] 7.7 Manual test: Animations are smooth and non-intrusive
  - [ ] 7.8 **[PHASE 2 - DISABLED]** Manual test: Object modification notifications appear correctly
  - [ ] 7.9 **[PHASE 2 - DISABLED]** Manual test: Modifications only notify for other users' changes

---

## Implementation Status

### Phase 1: ✅ Complete and Ready for Testing!

All code for Phase 1 (user join/leave, object create/delete) is complete and ready for manual testing.

### Phase 2: ⚠️ PARTIALLY IMPLEMENTED - MODIFICATION NOTIFICATIONS DISABLED

The infrastructure for Phase 2 was implemented (updatedBy field, update functions, UI components), but the modification detection logic is not working reliably. **Modification notifications are currently DISABLED** in the code pending further debugging.

### What was implemented:

**Phase 1:**
1. ✅ Notification type definitions and context infrastructure
2. ✅ Object creation/deletion notifications (detected via Firebase listener in CanvasContext)
3. ✅ User join/leave notifications (detected via presence changes in PresenceContext)
4. ✅ Notification UI components with animations and icons
5. ✅ Auto-dismiss after 2-3 seconds
6. ✅ Manual dismiss via close button
7. ✅ Max 3 visible notifications enforced
8. ✅ Notifications only for OTHER users' actions (current user excluded)
9. ✅ Notifications show actual user email and color (looked up from presence data)

**Phase 2 (Infrastructure Only - Notifications Disabled):**
10. ✅ Added `updatedBy` field to all shape types (Rectangle, Circle, Line, Text)
11. ✅ `updateObject` and `updateObjectsBatch` now set `updatedBy` to current user
12. ✅ Added 'object-modified' notification type and Pencil icon to UI
13. ✅ Updated Firebase security rules to allow `updatedBy` field
14. ⚠️ **DISABLED** Object modification detection - needs debugging before re-enabling

### What was deferred:
- Action grouping and time-windowed debouncing (Task 5.0) - Too complex for initial implementation

---

## Phase 2: ⚠️ Object Modification Notifications - DISABLED

### Database Schema Changes Implemented

The `updatedBy` field has been added to all shape types as an **optional field** for backward compatibility:
- ✅ `Rectangle.updatedBy?: string`
- ✅ `Circle.updatedBy?: string`
- ✅ `Line.updatedBy?: string`
- ✅ `Text.updatedBy?: string`

### Current Status: DISABLED

**Infrastructure is in place but notifications are disabled:**
1. ✅ **On Object Update:** System sets `updatedBy` to the user's ID (working)
2. ✅ **UI Components:** Pencil icon and notification type exist (ready)
3. ⚠️ **Detection Logic:** Modification detection is **commented out** in code (not working reliably)

**Why Disabled:**
- The Firebase listener detection logic was not reliably triggering modification notifications
- Issue appears to be in the comparison logic between previous and current object states
- Rather than ship a broken feature, it's disabled pending further debugging

### What Still Works

- ✅ User join/leave notifications
- ✅ Object create/delete notifications  
- ✅ `updatedBy` field is being set correctly (infrastructure ready for future re-enable)

### Future Work

To re-enable modification notifications, the detection logic in `CanvasContext.tsx` (currently commented out) needs debugging to understand why the modification checks aren't triggering.

---

### Next Steps - Testing:

Run the app and test with multiple users/browser tabs to verify:

**Phase 1 Features (Active):**
- ✅ Notifications appear when users join/leave
- ✅ Notifications appear when objects are created/deleted
- ✅ No notifications for your own actions
- ✅ Auto-dismiss and manual dismiss work
- ✅ User colors are consistent
- ✅ Maximum 3 notifications enforced

**Phase 2 Features (Disabled):**
- ⚠️ Modification notifications are currently DISABLED
- The infrastructure exists but needs debugging before re-enabling

---

**Note:** Task 5.0 (Action Grouping and Debouncing) is deferred and will not be implemented in this phase due to complexity risk. Initial implementation will show individual notifications without grouping.

