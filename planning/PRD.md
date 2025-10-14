# CollabCanvas MVP - Product Requirements Document

**Project:** CollabCanvas - Real-Time Collaborative Design Tool  
**Deadline:** MVP due Tuesday evening (24 hours)  
**Version:** 1.0  
**Last Updated:** October 13, 2025

---

## Executive Summary

CollabCanvas is a real-time collaborative canvas application inspired by Figma. The MVP focuses exclusively on bulletproof multiplayer infrastructure with basic canvas functionality. The goal is to prove that real-time synchronization works flawlessly before adding complexity.

**Key Simplification:** Single global canvas shared by all users - no canvas routing or selection needed.

**Success Criteria:** 2+ users can simultaneously create and move rectangles with real-time sync, see each other's cursors, and have their work persist across sessions.

---

## User Stories

### Primary User: Designer/Collaborator

**As a designer**, I want to:
- Create an account and log in with email link or Google so I can save my work and be identified to other users
- See a large canvas that I can pan and zoom to explore my design space
- Create rectangles so I can start designing
- Move rectangles around the canvas by dragging them
- See who else is online and working on the canvas with me
- See other users' cursors with their names in real-time so I know where they're working
- Have my changes appear instantly for all other users
- Leave and return to find my work exactly as I left it

### Secondary User: Team Member

**As a team member**, I want to:
- Join a canvas that my colleague is already working on
- See all existing objects immediately when I join
- Make edits without worrying about conflicts or losing work
- Reconnect seamlessly if my connection drops temporarily

---

## Key Features for MVP

### 1. User Authentication
- Firebase Authentication with Email Link (passwordless) and Google Sign-In
- **Email Link Flow:** User enters email → receives authentication link/code → clicks link to authenticate
- **Google Flow:** User clicks "Sign in with Google" → authenticates via Google OAuth
- User's email serves as display name (from either auth method)
- Simple login flow with both options
- Persistent login state

### 2. Canvas Core
- Large workspace (minimum 5000x5000px)
- Smooth pan with mouse drag or trackpad (programmatically handled)
- Zoom in/out with mouse wheel or pinch gesture (scale: 0.1x to 5x, programmatically handled)
- Pan/zoom implemented in code with smooth animations
- Grid or background that moves with pan/zoom
- Canvas state persists in Firebase Realtime DB
- **Canvas Boundaries:** No visual indicators for canvas edges, shapes can extend beyond boundaries
- **Performance Target:** Handle 100+ rectangles with 3 concurrent users

### 2.5. User Interface Layout
- **Toolbar (Top Left):** Create button, 5-color palette, delete button
- **Online Users List (Top Right):** Display usernames with colored indicator dots
- **Canvas:** Main workspace area
- No properties panel or additional controls for MVP

### 3. Shape Creation & Manipulation
- Create rectangles (single shape type for MVP)
- Predefined color palette with 5 colors for rectangle fill (Color Palette Option 1: `#3B82F6`, `#EF4444`, `#10B981`, `#F59E0B`, `#8B5CF6`)
- Click and drag to define rectangle size (single clicks without dragging ignored)
- **Rectangle Size Constraints:**
  - Minimum size: 10×10px (prevents invisible rectangles)
  - Maximum size: 2000×2000px (prevents performance issues)
  - Rectangles can extend beyond canvas boundaries but remain selectable
- Color selected at creation time only (cannot be changed after)
- Click directly on rectangle to select
- Only one rectangle can be selected at a time
- Drag to move selected rectangle
- Visual feedback for selected state (intuitive border style)
- Deselect by clicking empty canvas area or pressing Escape key
- Delete selected rectangle via keyboard (Delete/Backspace) or toolbar button

### 4. Real-Time Synchronization
- All shape operations broadcast to Firebase Realtime DB
- Local state updates immediately for responsiveness
- Remote updates apply within 100ms
- Handle concurrent edits with "last write wins" strategy
- **Selection Conflict Resolution:**
  - Use Firebase server timestamps to determine "first" selection
  - If timestamps are identical, use lexicographic ordering of user IDs
  - Do not prevent second selection or show selection state to other users
- **Performance Limits:** No hard limit on rectangle count for MVP
- Conflict resolution documented in code comments

### 5. Multiplayer Cursors
- Track and broadcast cursor position for each user (throttled to 50ms updates using setTimeout debounce)
- Display other users' cursors with their name labels (email)
- **User Color Assignment:**
  - Assign colors in order of user arrival from 5-color palette
  - When more than 5 users online, cycle through colors (duplicates allowed)
  - Same user always gets same color during their session
- Smooth cursor movement (interpolation optional but nice)
- **Cursor Inactivity:** Cursor disappears after 30 seconds of no mouse movement
- **Note:** Do NOT show other users' selections - only show cursors

### 6. Presence Awareness
- Display list of currently online users in top-right corner
- Show user emails (used as display names)
- Show colored indicator dot next to each user (matches their cursor color)
- Update when users join/leave
- Use Firebase Realtime DB presence system
- **User Colors:** Use Color Palette Option 1: `#3B82F6` (blue), `#EF4444` (red), `#10B981` (green), `#F59E0B` (amber), `#8B5CF6` (purple)

### 7. State Persistence
- Canvas state saves to Firebase Realtime DB on every change
- State loads when user joins
- Works correctly after refresh
- Handles disconnect/reconnect gracefully

### 8. Security Rules
- Firebase Realtime DB security rules to protect data
- Only authenticated users can read/write to canvas
- Users can create, read, update, and delete any rectangle (collaborative editing)
- Presence data readable by all authenticated users
- User profile data protected (users can only write their own profile)

### 9. Deployment & Configuration
- Deployed on Firebase Hosting or Vercel
- Publicly accessible URL
- Works on modern desktop browsers (Chrome, Firefox, Safari)
- **Environment Variables (.env file):**
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
- Include comprehensive .gitignore file (node_modules, .env, build files, etc.)
- **Error Handling for MVP:**
  - Show generic error messages for Firebase connection issues
  - Auto-retry authentication on failure
  - No sophisticated offline handling (show "connection lost" message)
  - Simple reconnection on Firebase disconnect

---

## Technical Stack

### Frontend
- **Framework:** Vite + React
- **Canvas Library:** Konva.js (React-Konva wrapper)
  - Handles rendering, transformations, events
  - Built-in support for shapes and layers
  - Good performance with many objects
- **Styling:** Tailwind CSS
- **State Management:** React Context API (useContext)
  - CanvasContext: manages shapes, selected objects
  - UserContext: manages auth state, current user
  - PresenceContext: manages online users, cursors

### Backend & Infrastructure
- **Authentication:** Firebase Authentication
  - Email Link (passwordless) provider
  - Google Sign-In provider
  - User management
  - Auth state persistence
- **Database:** Firebase Realtime Database
  - Real-time data synchronization
  - Presence system for online users
  - Low latency (<100ms)
- **Hosting:** Firebase Hosting
  - Free tier sufficient for MVP
  - Automatic SSL
  - CDN distribution

### Development Tools
- **Build Tool:** Vite (fast HMR, optimized builds)
- **Language:** TypeScript (for type safety and better IDE support)
- **Version Control:** Git + GitHub
- **Color Palette:** 5 colors for rectangles and user indicators
  - **Selected Palette:** `#3B82F6` (blue), `#EF4444` (red), `#10B981` (green), `#F59E0B` (amber), `#8B5CF6` (purple)
  - Used for both rectangle fills and user indicator colors

---

## Data Schema

### React Context Structure

**CanvasContext**
- `objects`: Array of shape objects on the canvas
- `selectedIds`: Array of selected object IDs
- `createObject`: Function to create new shape
- `updateObject`: Function to update shape properties
- `deleteObject`: Function to remove shape
- `selectObject`: Function to handle selection

**UserContext**
- `currentUser`: Current authenticated user (email as identifier)
- `isAuthenticated`: Boolean auth state
- `login`: Function to authenticate
- `logout`: Function to sign out
- `userColor`: Randomly assigned color for current user (from 5-color palette)

**PresenceContext**
- `onlineUsers`: Map of userId to user presence data
- `cursors`: Map of userId to cursor position
- `updateCursor`: Function to broadcast cursor position

### Firebase Realtime DB Structure
**Assumption: Single global canvas for all users (simplifies MVP)**

```
/objects
  /{objectId}
    - type: "rectangle"
    - x: number
    - y: number
    - width: number
    - height: number
    - rotation: number
    - fill: string (color)
    - createdBy: userId
    - createdAt: timestamp
    - updatedAt: timestamp

/presence
  /{userId}
    - email: string (used as display name)
    - cursor: { x: number, y: number }
    - color: string (randomly assigned from 5-color palette)
    - lastActive: timestamp
    - isOnline: boolean

/users
  /{userId}
    - email: string (serves as display name)
    - createdAt: timestamp
```

**Note:** All users share the same canvas workspace. No canvas routing or canvas selection needed for MVP.

### Security Rules Structure
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "objects": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "presence": {
      ".read": "auth != null",
      "$uid": {
        ".write": "$uid === auth.uid"
      }
    },
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```
**Note:** Objects are fully collaborative - any authenticated user can CRUD any rectangle.

---

## Key Design Decisions

### Simplified Choices for MVP Speed
1. **Authentication:** Email serves as display name (no separate field), supports passwordless email link and Google Sign-In
2. **Shape Type:** Rectangles only
3. **Rectangle Creation:** Click-and-drag to define size (no size constraints)
4. **Color Selection:** 5 random colors, chosen at creation only (no color editing)
5. **Selection:** Single selection only, click directly on shape
6. **Deselection:** Click empty canvas or press Escape
7. **UI Layout:** 
   - Toolbar: Top-left (Create, Color Palette, Delete)
   - Online Users: Top-right with colored indicators
   - No properties panel or canvas control buttons
8. **Zoom/Pan:** Programmatically handled with smooth animations (mouse wheel, pinch, drag)
9. **Multiplayer Selection:** Don't show other users' selections, only cursors
10. **User Colors:** Randomly assigned from 5-color palette
11. **Security:** Firebase security rules - authenticated users only, full CRUD access on objects
12. **Configuration:** .env file for Firebase config, comprehensive .gitignore

## Success Metrics for MVP

### Functional Requirements
- [ ] User can create account and log in with passwordless email link or Google Sign-In
- [ ] User can create rectangles (click-and-drag required, single clicks ignored)
- [ ] User can move rectangles by dragging
- [ ] Two users see each other's changes in real-time (<100ms)
- [ ] Two users see each other's cursors with names
- [ ] Online users list shows who's present
- [ ] Canvas state persists after page refresh
- [ ] Firebase security rules prevent unauthenticated access
- [ ] Application is deployed and publicly accessible
- [ ] Canvas handles 100+ rectangles without performance degradation
- [ ] Cursor updates work smoothly with 3+ concurrent users
- [ ] User colors cycle appropriately with 6+ concurrent users
- [ ] Cursors disappear after 30 seconds of inactivity
- [ ] Pan and zoom work programmatically with smooth animations

### Performance Requirements
- [ ] Canvas maintains 60 FPS during pan/zoom
- [ ] Shape updates sync across users in <100ms
- [ ] Cursor updates sync in <50ms
- [ ] No crashes or data loss with 2-3 concurrent users (MVP target)
- [ ] Performance testing target: 100 rectangles with 3 concurrent users
- [ ] Smooth programmatic pan/zoom animations

### Testing Scenarios
1. Open app in two browsers, create rectangles in both - verify instant sync
2. Create rectangle, refresh page - verify rectangle persists
3. Move rectangles rapidly in both browsers - verify no lag or conflicts
4. Disconnect one user - verify other user continues working
5. Reconnect disconnected user - verify they see latest state
6. Attempt to access canvas without authentication - verify blocked by security rules

---

## Implementation Priority

### Phase 1: Foundation
1. Set up Vite project with React, TypeScript, and Konva
2. Initialize Git repository with comprehensive .gitignore
3. Configure Firebase (Auth + Realtime DB) with .env file
4. Set up Firebase Realtime DB security rules for authenticated access
5. Build authentication flow (passwordless email link and Google Sign-In)
6. Set up Context providers (UserContext, CanvasContext, PresenceContext)
7. Create basic canvas with pan/zoom (mouse wheel and drag)

### Phase 2: Core Canvas
1. Build toolbar UI (top-left: Create button, 5-color palette, Delete button)
2. Implement rectangle creation with click-and-drag
3. Add rectangle selection (click to select, visual border feedback)
4. Implement rectangle movement (drag selected rectangle)
5. Add deselection (click empty area or Escape key)
6. Add delete functionality (Delete/Backspace keys + toolbar button)
7. Connect to Firebase Realtime DB for shape persistence
8. Test basic sync between two browsers

### Phase 3: Multiplayer
1. Implement cursor position broadcasting (throttled to ~50ms)
2. Add cursor visualization with user emails as labels
3. Assign random colors to users from 5-color palette
4. Build online users list (top-right with colored indicator dots)
5. Implement Firebase presence system (join/leave detection)
6. Test with multiple users and verify cursor sync
7. Verify selection conflicts work correctly (first selection wins)

### Phase 4: Polish & Deploy
1. Add user color generation
2. Improve visual feedback
3. Test all MVP requirements
4. Deploy to Firebase Hosting
5. Final testing on deployed URL

---

## Technical Risks & Mitigation

### Risk 1: Firebase Realtime DB performance
- **Impact:** High - Core to multiplayer functionality
- **Mitigation:** Use throttling for cursor updates, batch shape updates where possible
- **Fallback:** Firestore as alternative (though higher latency)

### Risk 2: Konva.js learning curve
- **Impact:** Medium - Could slow development
- **Mitigation:** Use official React-Konva examples, start with basic rectangles only
- **Fallback:** HTML5 Canvas with manual rendering (more work)

### Risk 3: Synchronization conflicts
- **Impact:** Medium - Could break user experience
- **Mitigation:** Implement "last write wins", add timestamps to all updates
- **Fallback:** Document known issues, fix in next iteration

### Risk 4: Deployment issues
- **Impact:** Low but critical - Must be deployed to pass MVP
- **Mitigation:** Deploy early and test, use Firebase Hosting for simplicity
- **Fallback:** Vercel or Netlify as alternatives

---

## Notes

- **Focus on multiplayer infrastructure** - A simple canvas with bulletproof sync beats a feature-rich canvas with broken collaboration
- **Test continuously** - Use multiple browser windows throughout development
- **Document as you go** - Will need this for AI development log later
- **Deploy early** - Don't wait until last minute to deploy
- **Timebox features** - If something takes more than expected time, cut it and move on
- **Keep it simple** - All design decisions prioritize speed and reliability over features
- **Passwordless auth** - Email link authentication eliminates password management complexity
- **Email as display name** - Eliminates extra signup fields and user profile management
- **Single selection only** - Simplifies state management significantly
- **No selection sync** - Only cursors are visible to other users, not selections