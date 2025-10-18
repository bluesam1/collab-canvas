import { Check, X } from 'lucide-react';

interface AIConfirmPanelProps {
  summary: string;
  operations: string[];
  onApply: () => void;
  onCancel: () => void;
}

export const AIConfirmPanel = ({
  summary,
  operations,
  onApply,
  onCancel,
}: AIConfirmPanelProps) => {
  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
      {/* Summary */}
      <div>
        <p className="font-semibold text-blue-900 mb-2">
          AI wants to make these changes:
        </p>
        {summary && (
          <p className="text-sm text-blue-800 mb-2">{summary}</p>
        )}
      </div>

      {/* Operations List */}
      {operations.length > 0 && (
        <ul className="space-y-1 text-sm text-blue-800">
          {operations.map((operation, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>{operation}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Cancel</span>
        </button>
        <button
          onClick={onApply}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Check className="w-4 h-4" />
          <span>Apply Changes</span>
        </button>
      </div>
    </div>
  );
};

