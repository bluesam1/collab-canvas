import { useCanvas } from '../../hooks/useCanvas';

export function DeleteButton() {
  const { selectedIds, deleteObject } = useCanvas();
  
  const hasSelection = selectedIds.length > 0;

  const handleDelete = () => {
    if (hasSelection) {
      // Delete the first selected object (single selection only in MVP)
      deleteObject(selectedIds[0]);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={!hasSelection}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        hasSelection
          ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
      }`}
      title={hasSelection ? 'Delete selected shape' : 'No shape selected'}
      aria-label="Delete selected shape"
    >
      <span className="flex items-center gap-2">
        {/* Delete icon (trash can) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        Delete
      </span>
    </button>
  );
}

