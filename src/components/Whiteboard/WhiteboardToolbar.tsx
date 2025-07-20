import React from 'react';
import { MousePointer, Square, Pen, Minus, Circle, Download, Undo, Redo } from 'lucide-react';
import { useBoardStore } from '../../stores/useBoardStore';

const tools = [
  { id: 'select', icon: MousePointer, label: 'Select' },
  { id: 'sticky_note', icon: Square, label: 'Sticky Note' },
  { id: 'pen', icon: Pen, label: 'Pen' },
  { id: 'line', icon: Minus, label: 'Line' },
  { id: 'rectangle', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
] as const;

const colors = [
  '#000000', '#dc2626', '#ea580c', '#ca8a04', '#65a30d',
  '#059669', '#0891b2', '#2563eb', '#7c3aed', '#c026d3'
];

const strokeWidths = [1, 2, 4, 8];

interface WhiteboardToolbarProps {
  disabled?: boolean;
}

export function WhiteboardToolbar({ disabled = false }: WhiteboardToolbarProps) {
  const {
    selectedTool,
    selectedColor,
    strokeWidth,
    setSelectedTool,
    setSelectedColor,
    setStrokeWidth,
  } = useBoardStore();

  const handleExport = () => {
    // This would implement board export functionality
    console.log('Export functionality would be implemented here');
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Tools */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {tools.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => !disabled && setSelectedTool(id)}
                className={`p-2 rounded-md transition-all ${
                  disabled 
                    ? 'text-gray-300 cursor-not-allowed'
                    : 
                  selectedTool === id
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                }`}
                title={label}
                disabled={disabled}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Colors */}
          {(selectedTool === 'pen' || selectedTool === 'line' || selectedTool === 'rectangle' || selectedTool === 'circle') && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Color:</span>
              <div className="flex items-center space-x-1">
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => !disabled && setSelectedColor(color)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      disabled
                        ? 'cursor-not-allowed opacity-50'
                        :
                      selectedColor === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                    disabled={disabled}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Stroke Width */}
          {(selectedTool === 'pen' || selectedTool === 'line' || selectedTool === 'rectangle' || selectedTool === 'circle') && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Size:</span>
              <div className="flex items-center space-x-1">
                {strokeWidths.map(width => (
                  <button
                    key={width}
                    onClick={() => !disabled && setStrokeWidth(width)}
                    className={`w-8 h-8 rounded-md border transition-all flex items-center justify-center ${
                      disabled
                        ? 'cursor-not-allowed opacity-50'
                        :
                      strokeWidth === width
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={disabled}
                  >
                    <div
                      className="rounded-full bg-gray-800"
                      style={{
                        width: Math.max(2, width),
                        height: Math.max(2, width),
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            className={`p-2 rounded-md transition-colors ${
              disabled
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Undo"
            disabled={disabled}
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            className={`p-2 rounded-md transition-colors ${
              disabled
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            title="Redo"
            disabled={disabled}
          >
            <Redo className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300" />
          <button
            onClick={handleExport}
            className={`inline-flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-colors ${
              disabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            disabled={disabled}
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>
    </div>
  );
}