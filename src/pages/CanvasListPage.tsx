import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCanvasList } from '../hooks/useCanvasList';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { CanvasCard } from '../components/canvas-list/CanvasCard';
import { CreateCanvasModal } from '../components/canvas-list/CreateCanvasModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Logo } from '../components/common/Logo';

export function CanvasListPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { 
    canvases, 
    isLoading, 
    searchQuery, 
    setSearchQuery, 
    createNewCanvas, 
    deleteCanvasById, 
    renameCanvasById, 
    leaveCanvasById,
    refreshCanvases 
  } = useCanvasList();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Refresh canvas list when navigating back to this page
  useEffect(() => {
    refreshCanvases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Ctrl/Cmd+K to focus search box
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      
      // Ctrl/Cmd+N to create new canvas
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setShowCreateModal(true);
      }
      
      // Escape to close modals or clear search
      if (e.key === 'Escape') {
        if (showCreateModal) {
          setShowCreateModal(false);
        } else if (searchQuery.trim()) {
          setSearchQuery('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCreateModal, searchQuery, setSearchQuery]);
  
  if (!user) {
    return null;
  }

  const handleCreateCanvas = async (name: string) => {
    try {
      const canvasId = await createNewCanvas(name);
      showSuccess('Canvas created successfully!');
      setSearchQuery(''); // Clear search when creating new canvas
      navigate(`/canvas/${canvasId}`);
    } catch (error) {
      console.error('Failed to create canvas:', error);
      showError('Failed to create canvas. Please try again.');
    }
  };

  const handleCanvasClick = (canvasId: string) => {
    setSearchQuery(''); // Clear search when navigating to a canvas
    navigate(`/canvas/${canvasId}`);
  };

  const handleCopyLink = (canvasId: string) => {
    const url = `${window.location.origin}/canvas/${canvasId}`;
    navigator.clipboard.writeText(url).then(() => {
      showSuccess('Link copied to clipboard!');
    }).catch((error) => {
      console.error('Failed to copy link:', error);
      showError('Failed to copy link. Please try again.');
    });
  };

  // Separate canvases into owned and shared
  const ownedCanvases = canvases.filter(canvas => canvas.isOwner);
  const sharedCanvases = canvases.filter(canvas => !canvas.isOwner);
  
  // Determine empty state type
  const hasSearchQuery = searchQuery.trim().length > 0;
  const hasOwnedCanvases = ownedCanvases.length > 0;
  const hasSharedCanvases = sharedCanvases.length > 0;
  const hasAnyCanvases = canvases.length > 0;

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Header with user info and logout button */}
      <header className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur-sm shadow-lg z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo size={32} className="flex-shrink-0" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Canvases</h1>
              <p className="text-xs text-gray-600">
                Signed in as <strong>{user.email}</strong>
                {user.color && (
                  <span className="inline-flex items-center gap-1 ml-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: user.color }}></span>
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm hover:shadow"
              title="Create new canvas (Ctrl+N)"
            >
              New Canvas
            </button>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-16 h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Bar - always visible */}
          {!isLoading && (
            <div className="mb-8">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search canvases... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    title="Clear search (Esc)"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="md" message="Loading canvases..." />
            </div>
          )}

          {/* Empty States */}
          {!isLoading && !hasAnyCanvases && (
            <EmptyState
              headline={hasSearchQuery ? `No canvases found matching "${searchQuery}"` : "No canvases yet"}
              subtitle={hasSearchQuery 
                ? "Try a different search term or create a new canvas" 
                : "Create your first canvas to get started"
              }
              actionButton={{
                text: hasSearchQuery ? "Clear Search" : "New Canvas",
                onClick: hasSearchQuery 
                  ? () => setSearchQuery('')
                  : () => setShowCreateModal(true)
              }}
            />
          )}

          {/* Canvas Lists */}
          {!isLoading && canvases.length > 0 && (
            <div className="space-y-8">
              {/* My Canvases Section */}
              {hasOwnedCanvases && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">My Canvases</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {ownedCanvases.map((canvas) => (
                      <CanvasCard
                        key={canvas.id}
                        canvas={canvas}
                        onRename={renameCanvasById}
                        onDelete={deleteCanvasById}
                        onLeave={leaveCanvasById}
                        onCopyLink={handleCopyLink}
                        onClick={handleCanvasClick}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Shared With Me Section - only show if there are shared canvases */}
              {hasSharedCanvases && (
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Shared With Me</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sharedCanvases.map((canvas) => (
                      <CanvasCard
                        key={canvas.id}
                        canvas={canvas}
                        onRename={renameCanvasById}
                        onDelete={deleteCanvasById}
                        onLeave={leaveCanvasById}
                        onCopyLink={handleCopyLink}
                        onClick={handleCanvasClick}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Canvas Modal */}
      <CreateCanvasModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateCanvas}
      />
    </div>
  );
}