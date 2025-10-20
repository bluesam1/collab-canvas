import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { type CanvasListItem } from '../../types';
import { RenameCanvasModal } from './RenameCanvasModal';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface CanvasCardProps {
  canvas: CanvasListItem;
  onRename: (canvasId: string, newName: string) => Promise<boolean>;
  onDelete: (canvasId: string) => Promise<boolean>;
  onLeave: (canvasId: string) => Promise<boolean>;
  onCopyLink: (canvasId: string) => void;
  onClick?: (canvasId: string) => void;
}

export function CanvasCard({ canvas, onRename, onDelete, onLeave, onCopyLink, onClick }: CanvasCardProps) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleCanvasClick = () => {
    if (onClick) {
      onClick(canvas.id);
    } else {
      navigate(`/canvas/${canvas.id}`);
    }
  };

  const handleRename = async (newName: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await onRename(canvas.id, newName);
      if (success) {
        setShowRenameModal(false);
      }
      return success;
    } catch (error) {
      console.error('Failed to rename canvas:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const success = await onDelete(canvas.id);
      if (success) {
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error('Failed to delete canvas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeave = async () => {
    setIsLoading(true);
    try {
      const success = await onLeave(canvas.id);
      if (success) {
        setShowLeaveModal(false);
      }
    } catch (error) {
      console.error('Failed to leave canvas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    onCopyLink(canvas.id);
    setShowMenu(false);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <>
      <div
        onClick={handleCanvasClick}
        className={`bg-white rounded-xl border-2 ${
          canvas.isOwner ? 'border-blue-100 hover:border-blue-200' : 'border-gray-100 hover:border-gray-200'
        } p-5 hover:shadow-lg transition-all duration-200 cursor-pointer relative group`}
      >
        {/* Top-right menu button for owners */}
        {canvas.isOwner && (
          <div className="absolute top-3 right-3 z-10" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="opacity-40 group-hover:opacity-100 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 shadow-sm hover:shadow"
              title="Canvas options"
            >
              <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-xl shadow-xl z-20 min-w-[180px] overflow-hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRenameModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Rename
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyLink();
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Link
                </button>
                <div className="border-t border-gray-100"></div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        )}

        {/* Canvas Name */}
        <h3 className="font-semibold text-gray-900 mb-2 truncate text-lg pr-8">{canvas.name}</h3>
        
        {/* Last Opened Date */}
        <p className="text-sm text-gray-500 mb-4">
          {canvas.lastOpenedByMe 
            ? `Last opened ${formatDate(canvas.lastOpenedByMe)}`
            : `Created ${formatDate(canvas.createdAt)}`
          }
        </p>

        {/* Bottom section with badge or leave button */}
        <div className="flex items-center justify-between">
          {!canvas.isOwner && (
            <>
              <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                Shared with you
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLeaveModal(true);
                }}
                className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
              >
                Leave
              </button>
            </>
          )}
          {canvas.isOwner && (
            <span className="text-xs text-gray-400 font-medium">
              You own this canvas
            </span>
          )}
        </div>
      </div>

      {/* Rename Modal */}
      <RenameCanvasModal
        isOpen={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        onRename={handleRename}
        currentName={canvas.name}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Canvas"
        message={`This will permanently delete "${canvas.name}" and all its content. This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={isLoading}
      />

      {/* Leave Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        onConfirm={handleLeave}
        title="Leave Canvas"
        message={`Remove "${canvas.name}" from your list? You can access it again with the link.`}
        confirmText="Leave"
        cancelText="Cancel"
        isDestructive={false}
        isLoading={isLoading}
      />
    </>
  );
}
