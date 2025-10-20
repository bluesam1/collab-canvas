# Feature PRD: Connection State & User Presence Management

## Introduction/Overview

This feature addresses critical stability issues in CollabCanvas related to network connectivity and user presence tracking. Currently, users have no indication when Firebase disconnects, which can lead to confusion, lost edits, and inconsistent presence data. This PRD covers two interconnected features that form the foundation of reliable real-time collaboration:

1. **Connection State Management** - Visual feedback and graceful degradation when network issues occur
2. **User Presence Polish** - Consistent, accurate tracking of user online status and persistent user colors

**Problem Solved:** Users experience confusion and data loss when network connections fail, and presence indicators show inaccurate information about who is online.

**Target Users:** All CollabCanvas collaborators who need reliable real-time editing and presence awareness.

## Goals

1. Provide clear visual feedback about connection status at all times
2. Allow Firebase to handle offline operations gracefully with automatic queueing
3. Automatically recover from network issues using Firebase's built-in reconnection
4. Ensure user colors persist consistently across all sessions
5. Accurately reflect online/offline status using Firebase's ~30 second heartbeat
6. Clean up presence data properly when users disconnect

## User Stories

### Connection State Management

**As a canvas user, I want to:**
- Know when my connection to Firebase is lost, so I'm aware my changes are queued
- Have Firebase automatically queue my changes when offline, so I don't lose work
- See automatic reconnection happen transparently, so I can continue my work seamlessly
- Have a manual reconnect option if automatic reconnection doesn't work

### User Presence

**As a canvas collaborator, I want to:**
- Keep the same color indicator across all sessions, so other users can recognize me consistently
- See accurate online status for all collaborators, so I know who is currently active
- Stop seeing cursors for users who have disconnected, so I'm not confused by stale presence data
- Have my presence automatically cleaned up when I close the browser, so I don't appear online when I'm not

## Functional Requirements

### Connection State Management

#### FR1: Connection State Monitoring
- The system MUST monitor Firebase's `.info/connected` status in real-time
- The system MUST track connection/disconnection timestamps
- The system MUST use Firebase's built-in reconnection (~30 second heartbeat)

#### FR2: Visual Connection Indicator
- The system MUST display a connection indicator in the bottom-right corner of the canvas
- When **connected**: Show green icon with "Connected." label at 50% opacity (subtle)
- When **disconnected**: Show red icon with "Disconnected." label and "Reconnect" button at 100% opacity
- The indicator MUST be visible at all times and not dismissible

#### FR3: Offline Operations (IMPLEMENTED VIA FIREBASE)
- Firebase automatically queues writes when offline
- Firebase automatically syncs queued changes when reconnected
- Users can continue editing while offline - changes sync automatically
- No read-only mode needed - Firebase handles graceful degradation

#### FR4: Reconnection Logic
- Firebase handles automatic reconnection via its built-in heartbeat (~30 seconds)
- Manual "Reconnect" button available in the connection indicator when disconnected
- Reconnect button provides user sense of control but reconnection happens automatically
- On successful reconnection, the system MUST show toast: "Reconnected! Your changes are syncing..."

#### FR5: Connection State Notifications
- On disconnect: Show toast "Connection lost." (duration: 5 seconds)
- On reconnect: Show toast "Reconnected! Your changes are syncing..." (duration: 3 seconds)
- No toasts shown on initial page load to avoid spam
- Toasts MUST be dismissible by the user

### User Presence Polish

#### FR6: Persistent User Colors
- The system MUST store user color in `/users/{userId}` on first login
- The system MUST check for existing user color before assignment
- Once assigned, user color MUST never change automatically
- User color MUST be from the existing 5-color palette
- New users MUST receive the next available color in rotation

#### FR7: Accurate Online Status
- The system MUST set `isOnline: true` when user joins a canvas
- The system MUST use Firebase `onDisconnect()` to set `isOnline: false` automatically
- The system MUST update online status within 5 seconds of actual state change
- The system MUST remove users from online users list when `isOnline: false`

#### FR8: Cursor Visibility Management
- The system MUST only render cursors for users where `isOnline: true`
- The system MUST hide cursors immediately when user status changes to offline
- The system MUST show cursors within 2 seconds of user coming online

#### FR9: Presence Data Structure
- The system MUST maintain the following structure in Firebase:
  ```
  /users/{userId}
    - id: string
    - email: string
    - color: string (permanent)
    - createdAt: timestamp
    - lastSeenAt: timestamp

  /presence/{canvasId}/{userId}
    - userId: string
    - email: string
    - color: string (copied from /users)
    - isOnline: boolean
    - lastActive: timestamp
    - cursor: { x: number, y: number }
  ```

#### FR10: Disconnection Cleanup
- When user disconnects, the system MUST:
  - Set `isOnline: false` via `onDisconnect()`
  - Update `lastSeenAt` timestamp
  - Keep presence record for 30 seconds before removal
  - Remove cursor from canvas immediately

## Non-Goals (Out of Scope)

1. **Read-only mode during disconnect** - SKIPPED: Firebase handles offline operations gracefully with automatic queueing, so blocking user input is unnecessary
2. **Reconnection attempt limits** - SKIPPED: Firebase handles automatic reconnection indefinitely, no need for manual retry limits
3. **Connection quality indicators** - Only binary online/offline status, no latency or quality metrics
4. **Custom user color selection** - Users receive assigned colors only; manual selection is out of scope for this phase
5. **Historical presence data** - No tracking of "last seen" or presence history beyond current session
6. **Conflict resolution for simultaneous edits** - Firebase's last-write-wins is sufficient for this phase

## Design Considerations

### Connection Indicator Design (AS IMPLEMENTED)
- **Position:** Fixed bottom-right corner
- **Size:** Icon (20px) + label text + optional button
- **States:**
  - **Connected**: Green Wifi icon + "Connected." text at 50% opacity (subtle, unobtrusive)
  - **Disconnected**: Red WifiOff icon + "Disconnected." text + "Reconnect" button at 100% opacity
- **Styling:** White background, border, rounded corners, shadow
- **Z-index:** High (z-50) to always be visible
- **Transition:** Smooth opacity transition between states

### Presence Indicator Consistency
- Use existing `UserIndicator` component pattern
- Ensure color consistency across:
  - Online users list
  - Canvas cursors
  - User settings modal
  - Activity notifications

## Technical Considerations

### Firebase Connection Monitoring
```typescript
// Use Firebase's special .info/connected location
import { ref, onValue } from 'firebase/database';

const connectedRef = ref(database, '.info/connected');
onValue(connectedRef, (snapshot) => {
  const isConnected = snapshot.val() === true;
  // Update connection state
});
```

### OnDisconnect Setup
```typescript
import { ref, onDisconnect, set } from 'firebase/database';

const presenceRef = ref(database, `presence/${canvasId}/${userId}`);

// Set online
await set(presenceRef, { ...presenceData, isOnline: true });

// Setup disconnect handler
onDisconnect(presenceRef).update({ isOnline: false, lastActive: Date.now() });
```

### Context Architecture
- Create new `ConnectionContext` for connection state management
- Update existing `UserContext` to handle persistent color storage
- Update existing `PresenceContext` to use proper `onDisconnect()` hooks
- All contexts should clean up listeners properly in useEffect returns

### Performance Considerations
- Connection state checks should not trigger on every render
- Presence updates already throttled to 50ms (existing implementation)
- User color lookup should be cached after first read
- Minimize Firebase reads by using listeners efficiently

## Success Metrics

### Connection State
- ✅ Connection indicator visible and accurate 100% of the time
- ✅ Firebase queues offline operations and syncs automatically when reconnected
- ✅ Reconnection happens automatically via Firebase (~30 second heartbeat)
- ✅ Zero data loss incidents - Firebase handles offline gracefully
- ✅ Users feel informed about connection status without being intrusive

### User Presence
- ✅ User colors remain consistent across 100% of sessions
- ✅ Online status accuracy: 95% within 5 seconds of actual state
- ✅ Stale presence cleaned up within 30 seconds of disconnect
- ✅ Cursor visibility matches online status 100% of time
- ✅ Zero ghost users appearing online after disconnect

### User Experience
- ✅ No negative feedback about connection confusion
- ✅ Users report feeling confident about edit state
- ✅ Collaboration feels more reliable and trustworthy
- ✅ Positive feedback on connection state transparency

## Open Questions

1. **Q: Should we show connection quality/latency in addition to binary status?**
   - Decision: No, binary status is sufficient for MVP. Can add later if needed.

2. **Q: What happens to edits in progress when disconnect occurs?**
   - Decision: Current drag/edit completes optimistically, but subsequent edits blocked. Firebase listener will sync correct state.

3. **Q: Should we implement a "poor connection" warning state?**
   - Decision: Not in Phase 1. Binary online/offline is clearer and simpler.

4. **Q: How do we handle browser tab visibility (hidden tabs)?**
   - Decision: Hidden tabs remain connected. Browser will manage Firebase connection lifecycle.

5. **Q: Should manual color reset be available in user settings?**
   - Decision: Not in this phase. Colors are permanent once assigned.

6. **Q: What if all 5 colors are taken when a 6th user joins?**
   - Decision: Cycle back to first color. Color collision is acceptable with 5+ simultaneous users.

7. **Q: Should we persist connection state history for debugging?**
   - Decision: No, console logs are sufficient for debugging. No need for historical tracking.

## Testing Checklist (AS IMPLEMENTED)

### Connection State Testing
- [x] Connection indicator shows green icon + "Connected." at 50% opacity when online
- [x] Indicator turns red with "Disconnected." label and Reconnect button when offline
- [x] Manual reconnect button available when disconnected
- [x] Reconnection happens automatically via Firebase
- [x] Toast notifications appear at correct times (no spam on page load)
- [x] Firebase queues changes when offline and syncs when reconnected

### User Presence Testing
- [x] New user receives assigned color from Firebase
- [x] User color persists across browser refresh
- [x] User color persists across logout/login
- [x] User color matches across all presence indicators
- [x] User appears in online users list when joining
- [x] User removed from online users list when disconnecting
- [x] Cursor appears when user comes online
- [x] Cursor disappears immediately when user goes offline (isOnline check)
- [x] Multiple simultaneous users show correct colors
- [x] 6th user correctly receives cycled color

### Integration Testing
- [x] Firebase connection monitoring works reliably
- [x] OnDisconnect handler sets isOnline: false
- [x] Cursors filtered by both timeout AND isOnline status
- [x] No console errors or warnings
- [x] Multi-browser testing successful

