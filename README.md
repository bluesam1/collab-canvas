# CollabCanvas

A real-time collaborative canvas application where multiple users can create, move, and interact with shapes together. Built with React, TypeScript, Firebase, and Konva.

## Features

- 🎨 **Real-time Collaboration**: See other users' changes instantly
- 🖱️ **Multiplayer Cursors**: View other users' cursor positions with name labels
- 📦 **Shape Creation**: Click and drag to create colored rectangles
- 🎯 **Shape Manipulation**: Select, move, and delete shapes
- 👥 **Presence System**: See who's online with colored indicators
- 🔒 **Secure Authentication**: Email link and Google Sign-In support
- 📱 **Responsive Canvas**: Pan and zoom with smooth animations
- ⚡ **Optimized Performance**: Handles 100+ shapes with multiple concurrent users

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Canvas**: Konva, React-Konva
- **Backend**: Firebase Realtime Database
- **Authentication**: Firebase Auth (Email Link & Google Sign-In)
- **Styling**: Tailwind CSS v4
- **Testing**: Vitest, React Testing Library

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase account (free tier works)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd collab-canvas
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Realtime Database** in the Firebase console
3. Enable **Authentication** methods:
   - Email/Password (for email link authentication)
   - Google Sign-In
4. Copy your Firebase configuration

### 4. Environment Variables

Create a `.env` file in the root directory with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project_id.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Note**: Never commit the `.env` file to version control! Use `.env.example` as a template.

### 5. Firebase Security Rules

Set up Realtime Database security rules in the Firebase console:

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
    }
  }
}
```

### 6. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run test -- --ui # Run tests with UI
npm run lint         # Run ESLint
```

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm test -- --ui
```

## Project Structure

```
collab-canvas/
├── src/
│   ├── main.tsx                    # App entry point
│   ├── App.tsx                     # Root component
│   ├── config/
│   │   └── firebase.ts             # Firebase initialization
│   ├── contexts/
│   │   ├── UserContext.tsx         # Auth state management
│   │   ├── CanvasContext.tsx       # Canvas state management
│   │   └── PresenceContext.tsx     # Presence state management
│   ├── components/
│   │   ├── auth/                   # Authentication components
│   │   ├── canvas/                 # Canvas & shape components
│   │   ├── toolbar/                # Toolbar UI components
│   │   └── presence/               # Online users components
│   ├── hooks/                      # Custom React hooks
│   ├── types/                      # TypeScript type definitions
│   ├── utils/                      # Helper functions
│   └── styles/                     # Global styles
├── tests/                          # Test files
├── public/                         # Static assets
├── .env.example                    # Environment variables template
└── package.json                    # Dependencies
```

## How to Use

1. **Sign In**: Use email link authentication or Google Sign-In
2. **Create Shapes**: Click and drag on the canvas to create rectangles
3. **Select Colors**: Choose from 5 colors in the toolbar
4. **Move Shapes**: Click to select, then drag to move
5. **Delete Shapes**: Select a shape and click Delete button (or press Delete/Backspace)
6. **Pan Canvas**: Drag the canvas background to pan
7. **Zoom Canvas**: Use mouse wheel to zoom in/out
8. **See Collaborators**: View online users in the top-right corner
9. **See Cursors**: Watch other users' cursors move in real-time

## Features Details

### Canvas

- 5000x5000px workspace
- Programmatic pan and zoom with smooth animations
- 60 FPS performance target
- Grid background

### Shapes

- Click-and-drag to create (single clicks ignored)
- Size constraints: 10×10px minimum, 2000×2000px maximum
- 5-color palette
- Real-time synchronization (<100ms latency)

### Multiplayer

- Real-time shape updates (<100ms)
- Cursor position sync (<50ms with throttling)
- Presence indicators with user emails
- Color assignment (cycles through 5 colors for 6+ users)
- Cursor auto-hide after 30 seconds of inactivity

### Performance

- Handles 100+ rectangles with 3 concurrent users
- Optimistic updates for instant feedback
- Throttled cursor updates (50ms)
- Efficient Firebase listeners

## Deployment

### Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase hosting:
```bash
firebase init hosting
```

4. Build the project:
```bash
npm run build
```

5. Deploy:
```bash
firebase deploy
```

## Known Limitations (MVP)

- No undo/redo functionality
- Single-selection only (no multi-select)
- No shape resizing
- Only rectangle shapes (no circles, text, etc.)
- No layers/z-index control
- No export/import functionality

## Future Enhancements

See the planning documents for potential features in future iterations:
- Multiple shape types (circles, text, lines)
- Multi-selection and grouping
- Undo/redo
- Shape resizing
- Copy/paste
- Export to PNG/SVG
- Persistent workspaces

## Troubleshooting

### Firebase Connection Issues

- Check that your `.env` file has correct Firebase credentials
- Verify Firebase Realtime Database is enabled in Firebase Console
- Check that security rules allow authenticated access

### Authentication Not Working

- Verify authentication methods are enabled in Firebase Console
- For email link auth, ensure authorized domains are configured
- Check browser console for specific error messages

### Performance Issues

- Try reducing the number of shapes on canvas
- Check browser console for errors
- Ensure you're using a modern browser (Chrome, Firefox, Safari)

## Contributing

This is an MVP project built for learning purposes. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## License

MIT License - feel free to use this project for learning and development.

## Acknowledgments

- Built with [Vite](https://vitejs.dev/)
- Canvas rendering with [Konva](https://konvajs.org/)
- Real-time backend by [Firebase](https://firebase.google.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
