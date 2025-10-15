# Project Brief: CollabCanvas

## Project Overview
CollabCanvas is a real-time collaborative canvas application inspired by Figma, built as a learning project to demonstrate bulletproof multiplayer infrastructure. The MVP focuses on proving that real-time synchronization works flawlessly with basic canvas functionality.

## Core Purpose
Build a web application where multiple users can simultaneously create, move, and interact with shapes on a shared canvas with instant real-time synchronization.

## Key Requirements

### Essential Features
1. **Authentication**: Email link (passwordless) and Google Sign-In via Firebase Auth
2. **Canvas System**: Multiple canvases with URL-based sharing (anyone with link can access)
3. **Canvas Operations**: Large workspace (5000x5000px) with pan and zoom
4. **Shape Manipulation**: Create rectangles (click-and-drag), move, delete with 5-color palette
5. **Real-Time Sync**: All changes broadcast instantly (<100ms latency)
6. **Multiplayer Cursors**: See other users' cursor positions with name labels
7. **Presence System**: Online users list with colored indicators
8. **State Persistence**: All data persists in Firebase Realtime Database

### Technical Requirements
- React 19 + TypeScript + Vite
- Konva.js for canvas rendering (60 FPS target)
- Firebase Realtime Database for state sync
- Firebase Authentication for security
- Tailwind CSS v4 for styling
- React Router for navigation

### Performance Targets
- Shape updates sync in <100ms
- Cursor updates sync in <50ms (throttled)
- Canvas maintains 60 FPS during pan/zoom
- Handle 100+ rectangles with 3 concurrent users
- No crashes or memory leaks

## Success Criteria
- 2+ users can simultaneously create and move rectangles with real-time sync
- Users can see each other's cursors and presence
- Work persists across sessions
- Canvas isolation works correctly (objects/presence per canvas)
- Multiple canvases can be created and shared via URL
- Deployed and publicly accessible

## Design Decisions (MVP Simplifications)
1. Single shape type (rectangles only)
2. 5-color palette, chosen at creation (no color editing)
3. Single selection only (no multi-select)
4. Click-and-drag to create (minimum 10×10px, maximum 2000×2000px)
5. Last-write-wins conflict resolution
6. Programmatic pan/zoom with smooth animations
7. URL-based sharing (no explicit share buttons)
8. Cursor auto-hide after 30 seconds of inactivity

## Known Limitations (MVP)
- No undo/redo functionality
- No shape resizing or rotation
- Only rectangle shapes (no circles, text, etc.)
- No layers/z-index control
- No export/import functionality
- No mobile touch optimizations

## Project Status
- **Status**: ✅ Complete (MVP + Canvas Sharing implemented)
- **Deployed**: Yes (Firebase Hosting)
- **Live URL**: https://collab-canvas-2ba2e.web.app/
- **Version**: v1.1 (includes PR #15)
- **Last Updated**: October 15, 2025

