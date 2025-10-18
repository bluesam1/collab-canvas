import { Sparkles } from 'lucide-react';

interface AIAssistantButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const AIAssistantButton = ({ onClick, disabled = false }: AIAssistantButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors
        ${disabled 
          ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
          : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
        }
      `}
      title={disabled ? 'AI Assistant not available' : 'AI Assistant (Beta)'}
    >
      <Sparkles className="w-4 h-4" />
      <span className="text-sm font-medium">AI Assistant</span>
    </button>
  );
};

