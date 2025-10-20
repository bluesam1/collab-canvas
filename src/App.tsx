import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { UserContextProvider } from './contexts/UserContext';
import { CanvasContextProvider } from './contexts/CanvasContext';
import { PresenceContextProvider } from './contexts/PresenceContext';
import { CanvasListProvider } from './contexts/CanvasListContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConnectionProvider } from './contexts/ConnectionContext';
import { NotificationContextProvider } from './contexts/NotificationContext';
import { AuthProvider } from './components/auth/AuthProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CanvasListPage } from './pages/CanvasListPage';
import { CanvasEditorPage } from './pages/CanvasEditorPage';
import './App.css';



// Canvas Editor Route Component (extracts canvasId from URL)
function CanvasEditorRoute() {
  const { canvasId } = useParams<{ canvasId: string }>();
  
  if (!canvasId) {
    return <Navigate to="/" replace />;
  }

  return (
    <PresenceContextProvider canvasId={canvasId}>
      <CanvasContextProvider canvasId={canvasId}>
        <CanvasEditorPage />
      </CanvasContextProvider>
    </PresenceContextProvider>
  );
}

// Root App component
function App() {
  return (
    <ErrorBoundary>
      <UserContextProvider>
        <AuthProvider>
          <ToastProvider>
            <ConnectionProvider>
              <NotificationContextProvider>
                <Router>
                  <CanvasListProvider>
                    <Routes>
                    {/* Canvas List Route */}
                    <Route path="/" element={<CanvasListPage />} />
                    
                    {/* Canvas Editor Route */}
                    <Route 
                      path="/canvas/:canvasId" 
                      element={<CanvasEditorRoute />} 
                    />
                    
                    {/* Catch-all route - redirect to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </CanvasListProvider>
                </Router>
              </NotificationContextProvider>
            </ConnectionProvider>
          </ToastProvider>
        </AuthProvider>
      </UserContextProvider>
    </ErrorBoundary>
  );
}

export default App;
