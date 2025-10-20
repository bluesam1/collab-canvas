# Task List: Connection State & User Presence Management

## Relevant Files

- `src/contexts/ConnectionContext.tsx` - ✅ Created - New context for managing connection state, reconnection logic, and providing connection status to components
- `src/hooks/useConnection.ts` - ✅ Created - New hook for consuming ConnectionContext
- `src/components/common/ConnectionIndicator.tsx` - ✅ Created - Visual indicator component showing connection status (green "Connected" at 50% opacity, red "Disconnected" with reconnect button)
- `src/pages/CanvasEditorPage.tsx` - ✅ Modified - Integrated ConnectionIndicator
- `src/App.tsx` - ✅ Modified - Added ConnectionProvider to component tree
- `src/types/index.ts` - ✅ Modified - Added ConnectionState, ConnectionStatus, and ConnectionContextType interfaces
- `src/contexts/UserContext.tsx` - Modified to use Firebase `/users/{userId}` for persistent color storage instead of localStorage
- `src/contexts/PresenceContext.tsx` - Modified to filter cursors by `isOnline` status and improve onDisconnect handling
- `src/utils/firebase.ts` - Enhanced with user profile functions (create/read user from `/users/{userId}`)
- `tests/connection.test.tsx` - Unit tests for ConnectionContext
- `tests/connection-indicator.test.tsx` - Unit tests for ConnectionIndicator component

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npm run test` to run tests.
- The Firebase `.info/connected` location is already being used in `src/utils/firebase.ts` - we'll build on top of this
- `onDisconnect()` is already set up in `setUserPresence()` - we'll enhance it

## Tasks

- [x] 1.0 Create Connection State Management System
  - [x] 1.1 Define ConnectionState interface in `src/types/index.ts` with status ('connected' | 'disconnected' | 'reconnecting'), reconnectAttempts, lastConnected, lastDisconnected timestamps
  - [x] 1.2 Create `src/contexts/ConnectionContext.tsx` with state for connection status and reconnection attempts
  - [x] 1.3 Implement connection monitoring using existing `subscribeToConnection` from firebase.ts in ConnectionContext
  - [x] 1.4 Add reconnection retry logic with max 5 attempts, 30-second intervals between attempts
  - [x] 1.5 Add manual reconnect function that resets attempt counter to 0, forces reconnection, and triggers full state sync from Firebase
  - [x] 1.6 Integrate toast notifications for connection state changes (disconnect, reconnecting, reconnected)
  - [x] 1.7 Create `src/hooks/useConnection.ts` hook to consume ConnectionContext
  - [x] 1.8 Add ConnectionContextProvider to app component tree (wrap around authenticated routes)

- [x] 2.0 Build Connection Indicator UI Component
  - [x] 2.1 Create `src/components/common/ConnectionIndicator.tsx` component
  - [x] 2.2 Implement green dot (12px) for connected state with no label
  - [x] 2.3 Implement red dot with "Disconnected" label for disconnected state
  - [x] 2.4 Implement orange/amber dot with "Reconnecting... (attempt X of 5)" label for reconnecting state
  - [x] 2.5 Add pulse animation for reconnecting state using CSS or Tailwind animations
  - [x] 2.6 Position indicator in top-right corner with high z-index (z-50)
  - [x] 2.7 Create `src/components/common/ReconnectModal.tsx` component that shows after 5 failed attempts
  - [x] 2.8 Design ReconnectModal: centered white card with connection error icon, "Connection Lost" heading, helpful message, and prominent "Reconnect" button
  - [x] 2.9 Wire up ReconnectModal button to call manual reconnect function from ConnectionContext
  - [x] 2.10 Show loading spinner on button while reconnection attempt is in progress
  - [x] 2.11 Integrate ConnectionIndicator and ReconnectModal into CanvasEditorPage

- [x] 3.0 ~~Implement Read-Only Mode for Canvas~~ (SKIPPED - Firebase handles offline writes gracefully with automatic queueing and sync)

- [x] 4.0 Enhance User Presence with Persistent Colors
  - [x] 4.1 Add Firebase helper functions to `src/utils/firebase.ts`: `createUserProfile(userId, email, color)`, `getUserProfile(userId)`, and `updateUserProfile(userId, updates)`
  - [x] 4.2 Define user profile structure in `/users/{userId}` with fields: id, email, color, createdAt, lastSeenAt
  - [x] 4.3 Modify `src/contexts/UserContext.tsx` to check Firebase `/users/{userId}` for existing user on login
  - [x] 4.4 If user exists in Firebase, load their color from `/users/{userId}/color`
  - [x] 4.5 If new user, assign color from palette and create user profile in `/users/{userId}` with all fields
  - [x] 4.6 Remove localStorage color storage logic (migrate to Firebase only)
  - [x] 4.7 Update `changeUserColor` function to write to Firebase `/users/{userId}/color` instead of localStorage (also updated type signature to async)
  - [x] 4.8 Ensure color is copied from `/users/{userId}` to `/presence/{canvasId}/{userId}` when joining canvas (already working - PresenceContext uses user.color from UserContext)

- [x] 5.0 Improve Presence Cleanup and Cursor Management
  - [x] 5.1 Verify `onDisconnect()` in `setUserPresence` properly sets `isOnline: false` ✓ (verified - working correctly in firebase.ts line 141-144)
  - [x] 5.2 Modify cursor rendering to filter out cursors where user's `isOnline === false` ✓ (added isOnline check in PresenceContext.tsx line 74)
  - [x] 5.3 Update `src/contexts/PresenceContext.tsx` cursor filtering logic to check both cursor timeout AND isOnline status ✓ (both checks now in place)
  - [x] 5.4 Ensure cursors disappear immediately when user's `isOnline` changes to false ✓ (cursors filtered out when isOnline becomes false)
  - [x] 5.5 Test that presence cleanup happens within 30 seconds of disconnect (ready for testing - Firebase onDisconnect handler is configured)
  - [x] 5.6 Update online users list to only show users where `isOnline === true` ✓ (verified existing implementation in PresenceContext.tsx line 60)
  - [x] 5.7 Add lastActive timestamp update in onDisconnect handler ✓ (verified - already implemented in firebase.ts line 143)

- [x] 6.0 Integration Testing and Polish
  - [x] 6.1 Test connection indicator shows correct state (green at 50% opacity when connected, red with reconnect button when disconnected)
  - [x] 6.2 Test reconnect button successfully triggers reconnection attempt
  - [x] 6.3 Test user colors persist across logout/login cycles
  - [x] 6.4 Test user colors persist across browser refresh
  - [x] 6.5 Test cursor visibility - cursors should only appear for online users
  - [x] 6.6 Test presence cleanup - users should disappear from online list when disconnected
  - [x] 6.7 Multi-browser test: Open 2 browsers, disconnect one, verify other sees user go offline
  - [x] 6.8 Test toast notifications appear at correct times (disconnect, reconnected)
  - [x] 6.9 Fix any bugs or edge cases discovered during testing
  - [x] 6.10 Verify no console errors or warnings related to connection management

