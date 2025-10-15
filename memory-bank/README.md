# Memory Bank

This directory contains the comprehensive documentation for CollabCanvas that persists across AI sessions. When starting any new session, read ALL of these files to understand the project completely.

## 📁 Core Files

### Required Reading (Start Here)
Read these files in order when beginning a new session:

1. **`projectbrief.md`** - Foundation document
   - Project overview and purpose
   - Core requirements and constraints
   - Success criteria and current status
   - Known limitations

2. **`techContext.md`** - Technical stack
   - Technologies and versions
   - Development setup instructions
   - Dependencies and configuration
   - Build and deployment process

3. **`systemPatterns.md`** - Architecture patterns
   - High-level system architecture
   - Key technical decisions and rationale
   - Design patterns in use
   - Component relationships and data flow

4. **`productContext.md`** - Product understanding
   - Why this project exists
   - Problems it solves
   - User journeys and experiences
   - Future enhancement roadmap

5. **`activeContext.md`** - Current state
   - Recent changes and completions
   - Active work and focus areas
   - Open questions and decisions
   - Known issues

6. **`progress.md`** - Detailed progress
   - Complete feature checklist
   - What's working vs. what's left
   - Test status and results
   - Performance metrics

## 🎯 Quick Reference

### When to Read What

**Starting any new task:**
→ Read ALL files to get complete context

**Need architecture info:**
→ `systemPatterns.md`

**Need tech stack details:**
→ `techContext.md`

**Understanding user needs:**
→ `productContext.md`

**Current status check:**
→ `activeContext.md` + `progress.md`

**Project overview:**
→ `projectbrief.md`

## 🔄 Keeping Memory Bank Updated

### When to Update

Update the Memory Bank when:
- Implementing significant features
- Making architectural decisions
- Discovering new patterns
- Completing milestones
- Identifying issues or limitations
- User requests with **update memory bank**

### What to Update

**After completing a feature:**
- `progress.md` - Mark feature complete
- `activeContext.md` - Update current focus

**After architectural changes:**
- `systemPatterns.md` - Document new patterns
- `techContext.md` - Update if tech stack changed

**After user feedback:**
- `productContext.md` - Update user journey
- `activeContext.md` - Note new considerations

**When user says "update memory bank":**
- Review ALL files (even if no changes needed)
- Update what's relevant
- Focus on `activeContext.md` and `progress.md`

## 📊 Document Hierarchy

```
projectbrief.md (Foundation)
    ↓
├── productContext.md (Why & What)
├── systemPatterns.md (How - Architecture)
└── techContext.md (How - Technology)
    ↓
├── activeContext.md (Current State)
└── progress.md (Detailed Status)
```

## 🎨 Project at a Glance

**CollabCanvas** is a real-time collaborative canvas application where multiple users can create and manipulate shapes together, with instant synchronization and multiplayer presence.

**Status:** ✅ Complete (MVP + Enhancements)  
**Version:** v1.1  
**Live:** https://collab-canvas-2ba2e.web.app/

**Tech Stack:**
- React 19 + TypeScript + Vite
- Konva.js for canvas rendering
- Firebase (Auth + Realtime DB + Hosting)
- Tailwind CSS v4
- React Router

**Key Features:**
- Multiple canvases with URL-based sharing
- Real-time sync (<100ms latency)
- Multiplayer cursors and presence
- Pan/zoom canvas (60 FPS)
- Mode switching (Pan vs Rectangle)
- Complete authentication system

## 🔍 Additional Resources

### Related Documentation
- `../README.md` - User-facing documentation
- `../planning/` - Original planning documents (PRD, architecture, tasklist)
- `../.cursor/rules/` - AI coding rules and patterns
- `../tests/` - Test files and coverage

### Project Rules
Also read `.cursor/rules/` for coding standards:
- `base.mdc` - Core project patterns
- `firebase.mdc` - Firebase-specific patterns
- `react-components.mdc` - React component patterns

## 💡 Tips for AI Usage

1. **Always read Memory Bank first** - Don't guess, read the docs
2. **Check activeContext.md** for current focus
3. **Refer to systemPatterns.md** for architectural decisions
4. **Use progress.md** to avoid redoing completed work
5. **Update Memory Bank** after significant changes

## 📝 Maintenance

This Memory Bank is the source of truth for the project. Keep it:
- **Accurate** - Reflect current reality
- **Complete** - All important context captured
- **Clear** - Easy to understand and navigate
- **Updated** - Changed when project evolves

---

**Last Updated:** October 15, 2025  
**Memory Bank Version:** 1.0

