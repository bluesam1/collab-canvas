# Tech Context

## Technology Stack

### Frontend Framework
- **React 19.1.1**: UI component library with latest features
- **TypeScript 5.9**: Type safety and developer experience
- **Vite 7.1**: Lightning-fast build tool with HMR

### Canvas Rendering
- **Konva 10.0.2**: High-performance 2D canvas library
- **React-Konva 19.0.10**: React wrapper for Konva
- Renders at 60 FPS with 100+ shapes
- Scene graph API simplifies shape management

### Backend & Database
- **Firebase 12.4.0**: Backend-as-a-service platform
  - **Firebase Authentication**: Email link (passwordless) + Google Sign-In
  - **Firebase Realtime Database**: Real-time data sync (<100ms latency)
  - **Firebase Hosting**: Static site hosting with CDN
- WebSocket-based real-time updates
- Built-in presence system

### Routing
- **React Router DOM 7.9.4**: Client-side routing
  - `/` → Canvas List Page
  - `/canvas/:canvasId` → Canvas Editor Page
  - Catch-all redirects to home

### Styling
- **Tailwind CSS v4.1.14**: Utility-first CSS framework
- **PostCSS 4.1.14**: CSS processing
- No custom CSS architecture needed
- Responsive design utilities

### Icons
- **Lucide React 0.545.0**: Icon library
- Clean, consistent icon set
- Tree-shakeable for optimal bundle size

### Testing
- **Vitest 3.2.4**: Fast unit test framework (Vite-native)
- **React Testing Library 16.3.0**: Component testing utilities
- **@testing-library/jest-dom 6.9.1**: DOM matchers
- **@testing-library/user-event 14.6.1**: User interaction simulation
- **JSDOM 27.0.0**: DOM implementation for tests

### Development Tools
- **ESLint 9.36.0**: Code linting
- **TypeScript ESLint 8.45.0**: TypeScript-specific linting rules
- **@vitejs/plugin-react 5.0.4**: React plugin for Vite

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase account (free tier)
- Git for version control
- Modern browser (Chrome, Firefox, Safari, Edge)

### Local Development
```bash
# Install dependencies
npm install

# Create .env file with Firebase credentials
cp .env.example .env
# Edit .env with your Firebase project details

# Run development server
npm run dev
# Open http://localhost:5173
```

### Environment Variables
Required in `.env` file (all prefixed with `VITE_`):
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_DATABASE_URL
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

### Firebase Setup
1. Create project in Firebase Console
2. Enable Realtime Database
3. Enable Authentication (Email/Password + Google)
4. Copy configuration to `.env`
5. Deploy security rules: `firebase deploy --only database`

## Technical Constraints

### Browser Support
- **Primary**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Not Supported**: IE11
- **Mobile**: Basic functionality (no touch optimizations)

### Performance Limits
- **Target**: 60 FPS during pan/zoom
- **Load Test**: 100+ rectangles with 3 concurrent users
- **Latency**: <100ms for shape sync, <50ms for cursor sync
- **Assumption**: Users have <50 canvases

### Firebase Limits (Free Tier)
- **Realtime Database**: 1GB storage, 10GB/month download
- **Authentication**: Unlimited email/password + Google Sign-In
- **Hosting**: 10GB storage, 360MB/day transfer
- **Sufficient for**: Development and small-scale demos

### Canvas Constraints
- **Workspace**: 5000×5000px virtual canvas
- **Min Shape**: 10×10px (prevents invisible rectangles)
- **Max Shape**: 2000×2000px (prevents performance issues)
- **Colors**: 5-color palette (cycles for 6+ users)

## Dependencies

### Core Dependencies
```json
{
  "firebase": "^12.4.0",
  "konva": "^10.0.2",
  "lucide-react": "^0.545.0",
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "react-konva": "^19.0.10",
  "react-router-dom": "^7.9.4"
}
```

### Dev Dependencies
```json
{
  "@eslint/js": "^9.36.0",
  "@tailwindcss/postcss": "^4.1.14",
  "@testing-library/jest-dom": "^6.9.1",
  "@testing-library/react": "^16.3.0",
  "@testing-library/user-event": "^14.6.1",
  "@types/node": "^24.6.0",
  "@types/react": "^19.2.2",
  "@types/react-dom": "^19.2.2",
  "@vitejs/plugin-react": "^5.0.4",
  "@vitest/ui": "^3.2.4",
  "eslint": "^9.36.0",
  "eslint-plugin-react-hooks": "^5.2.0",
  "eslint-plugin-react-refresh": "^0.4.22",
  "globals": "^16.4.0",
  "jsdom": "^27.0.0",
  "tailwindcss": "^4.1.14",
  "typescript": "~5.9.3",
  "typescript-eslint": "^8.45.0",
  "vite": "^7.1.7",
  "vitest": "^3.2.4"
}
```

## Build Configuration

### Vite Config (`vite.config.ts`)
- React plugin enabled
- Vitest integration for testing
- Source maps in development
- Optimized bundle in production

### TypeScript Config
- **Strict mode**: Enabled
- **Target**: ES2020
- **Module**: ESNext
- **JSX**: React
- Separate configs for app and node code

### ESLint Config
- React hooks rules enforced
- React refresh plugin for HMR
- TypeScript-specific rules
- Globals configured for browser environment

### Tailwind Config
- **Version 4**: No config file needed for basic setup
- PostCSS plugin handles compilation
- Import in `src/index.css`: `@import "tailwindcss";`

## Testing Configuration

### Vitest Setup (`tests/setup.ts`)
- JSDOM environment for DOM testing
- @testing-library/jest-dom matchers
- Firebase mocks (if needed)
- Global test utilities

### Test Scripts
```bash
npm test              # Run all tests
npm test -- --ui      # Run with UI
npm test -- --watch   # Watch mode
npm test -- --coverage # Coverage report
```

### Test Coverage Target
- **Goal**: >70% coverage
- **Focus**: Critical paths (auth, CRUD, sync)
- **Manual Tests**: Multi-user scenarios, performance

## Deployment

### Build Process
```bash
npm run build
# Output: dist/ directory
# Contains: index.html, assets/*, optimized bundles
```

### Firebase Deployment
```bash
firebase deploy
# Deploys: hosting + database rules
# URL: https://collab-canvas-2ba2e.web.app/
```

### Deployment Checklist
- [ ] Build completes without errors
- [ ] Environment variables set correctly
- [ ] Database rules deployed
- [ ] Authentication providers configured
- [ ] Test deployed URL
- [ ] Multi-user testing in production

## File Structure
```
collab-canvas/
├── src/
│   ├── main.tsx                 # App entry
│   ├── App.tsx                  # Root with routing
│   ├── config/
│   │   └── firebase.ts          # Firebase initialization
│   ├── contexts/                # State management
│   │   ├── UserContext.tsx
│   │   ├── CanvasContext.tsx
│   │   ├── CanvasListContext.tsx
│   │   ├── PresenceContext.tsx
│   │   └── ToastContext.tsx
│   ├── components/              # UI components
│   │   ├── auth/
│   │   ├── canvas/
│   │   ├── canvas-list/
│   │   ├── common/
│   │   ├── presence/
│   │   └── toolbar/
│   ├── pages/                   # Route pages
│   │   ├── CanvasListPage.tsx
│   │   ├── CanvasEditor.tsx
│   │   └── CanvasEditorPage.tsx
│   ├── hooks/                   # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useCanvas.ts
│   │   ├── useCanvasList.ts
│   │   ├── usePresence.ts
│   │   └── useToast.ts
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   ├── utils/
│   │   ├── firebase.ts          # Firebase helpers
│   │   ├── colors.ts            # Color utilities
│   │   └── canvases.ts          # Canvas operations
│   └── index.css                # Global styles
├── tests/                       # Test files
│   ├── setup.ts
│   ├── auth.test.tsx
│   ├── canvas.test.tsx
│   ├── sync.test.tsx
│   └── presence.test.tsx
├── firebase.json                # Firebase config
├── database.rules.json          # Security rules
├── vite.config.ts               # Build config
├── tsconfig.json                # TypeScript config
└── package.json                 # Dependencies
```

## Development Workflow

### Starting Development
1. Pull latest code
2. `npm install` (if dependencies changed)
3. Ensure `.env` file exists
4. `npm run dev`
5. Open `http://localhost:5173`

### Making Changes
1. Create feature branch
2. Make changes
3. Test locally (manual + unit tests)
4. Commit with descriptive message
5. Push and create PR

### Testing
1. Run `npm test` before committing
2. Test in multiple browsers
3. Test multi-user scenarios manually
4. Check console for errors
5. Verify Firebase operations

### Deployment
1. Merge to main branch
2. `npm run build` (verify success)
3. `firebase deploy`
4. Test deployed URL
5. Monitor for errors

## Troubleshooting

### Common Issues

**Build fails**
- Check TypeScript errors: `npm run lint`
- Clear cache: `rm -rf node_modules dist` → `npm install`
- Verify environment variables

**Firebase connection errors**
- Check `.env` file exists and is correct
- Verify Firebase project is active
- Check security rules allow authenticated access

**Hot reload not working**
- Restart dev server
- Check Vite config
- Clear browser cache

**Tests failing**
- Verify test setup is correct
- Check Firebase mocks
- Run tests individually to isolate issue

### Getting Help
- Check README.md for setup instructions
- Review planning documents in `/planning`
- Check Firebase Console for errors
- Browser console for client-side errors

