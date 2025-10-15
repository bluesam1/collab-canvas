import { useParams } from 'react-router-dom';

export function CanvasEditor() {
  const { canvasId } = useParams<{ canvasId: string }>();
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Canvas Editor</h1>
      <p className="text-gray-600">Canvas ID: {canvasId}</p>
      <p className="text-gray-600">Canvas editor page - coming soon!</p>
    </div>
  );
}
