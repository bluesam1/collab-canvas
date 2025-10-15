# Product Context

## Why This Project Exists
CollabCanvas demonstrates the core concepts of real-time collaborative editing, inspired by tools like Figma and Miro. It serves as a learning project to master:
- Real-time database synchronization
- Multiplayer presence and cursor tracking
- Conflict resolution strategies
- Canvas rendering performance
- Firebase infrastructure

## Problems It Solves

### For Users
1. **Instant Collaboration**: Multiple people can work on the same canvas simultaneously without conflicts
2. **Visual Communication**: See exactly where team members are working via cursor tracking
3. **Zero Setup**: No installation required - just share a URL
4. **Persistent Workspace**: Work persists automatically across sessions
5. **Multiple Workspaces**: Create and organize multiple canvases with URL-based sharing

### For Developers (Learning Goals)
1. **Real-time Sync**: Understanding Firebase Realtime Database patterns
2. **Performance**: Rendering 100+ shapes at 60 FPS with Konva
3. **State Management**: React Context API with optimistic updates
4. **Multiplayer Systems**: Presence, cursor tracking, color assignment
5. **Security**: Firebase security rules for authenticated-only access

## How It Should Work

### User Journey - First Time User
1. Land on canvas list page
2. Sign in with email link or Google
3. See empty state with "Create your first canvas"
4. Click "New Canvas" button
5. Name the canvas (default: "Untitled Canvas")
6. Immediately navigate to canvas editor
7. Select a color from the palette
8. Switch to rectangle mode (click mode button or press R)
9. Click and drag to create a rectangle
10. See the rectangle appear instantly
11. Move, select, and delete shapes as needed

### User Journey - Collaborator
1. Receive canvas URL from team member
2. Open URL and sign in
3. Canvas automatically added to "Shared With Me" list
4. See all existing shapes immediately
5. See other users' cursors and names in real-time
6. Make changes that sync instantly to everyone
7. View who else is online in the top-right indicator

### Canvas List Experience
1. **My Canvases**: Canvases the user created
2. **Shared With Me**: Canvases shared via URL (only shown if user has any)
3. **Search**: Filter canvases by name (debounced 300ms)
4. **Sorting**: Most recently opened canvases appear first
5. **Actions**: 
   - Owners: Rename, Copy Link, Delete
   - Non-owners: View only (with "Shared" badge)

### Canvas Editor Experience
1. **Navigation Bar**: Back button, canvas name, online users
2. **Toolbar** (left): Pan mode, Rectangle mode, color palette, delete button
3. **Canvas Area**: 5000×5000px workspace with grid background
4. **Mode Switching**:
   - Pan Mode (default): Click and drag to move canvas
   - Rectangle Mode: Click and drag to create shapes
5. **Keyboard Shortcuts**:
   - V: Pan mode
   - R: Rectangle mode
   - Delete/Backspace: Delete selected shape
   - Escape: Deselect

## User Experience Goals

### Speed
- Changes appear instantly (optimistic updates)
- No loading spinners during normal operations
- Canvas maintains 60 FPS during interactions

### Simplicity
- Minimal UI - focus on canvas
- Clear visual feedback for all actions
- Obvious mode switching with visual cursors

### Reliability
- Work never gets lost (Firebase persistence)
- Graceful error handling with toast notifications
- Automatic reconnection on network issues

### Collaboration
- Always see who's online
- Cursor tracking shows what others are doing
- No conflicts - last write wins
- Canvas isolation - objects and presence stay separate

## Edge Cases Handled

### Canvas Access
- Invalid canvas ID → Show error and redirect to list
- Deleted canvas → Show "Canvas not found" message
- First-time access → Automatically add to user's list

### Collaboration
- User disconnects → Presence clears, cursor disappears
- Cursor inactive 30s → Cursor auto-hides
- Multiple edits simultaneously → Last write wins
- 6+ users → Colors cycle through palette

### Data Integrity
- Minimum shape size (10×10px) enforced
- Maximum shape size (2000×2000px) enforced
- Single clicks (no drag) don't create shapes
- Empty canvas names prevented (trimmed)

## Future Enhancements (Post-MVP)

### Phase 2: Enhanced Collaboration
- Multiple shape types (circles, lines, text)
- Multi-selection and grouping
- Undo/redo functionality
- Shape resizing and rotation

### Phase 3: Advanced Features
- Export to PNG/SVG/PDF
- Layers and z-index control
- Comments and annotations
- Version history

### Phase 4: Team Features
- User permissions and roles
- Private/public workspaces
- Real-time chat
- Activity feed

