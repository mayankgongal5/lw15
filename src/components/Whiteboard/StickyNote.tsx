import React, { useState, useRef, useEffect } from 'react';
import { X, RotateCw } from 'lucide-react';
import { useBoardStore, Element } from '../../stores/useBoardStore';

interface StickyNoteProps {
  element: Element;
  disabled?: boolean;
}

export function StickyNote({ element, disabled = false }: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(element.content);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  
  const { updateElement, deleteElement } = useBoardStore();

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing || disabled) return;
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - element.x,
      y: e.clientY - element.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      updateElement(element.id, { x: newX, y: newY });
    } else if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      const newWidth = Math.max(100, resizeStart.width + deltaX);
      const newHeight = Math.max(80, resizeStart.height + deltaY);
      
      updateElement(element.id, { width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart]);

  const handleDoubleClick = () => {
    if (disabled) return;
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (content !== element.content) {
      updateElement(element.id, { content });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleBlur();
    } else if (e.key === 'Escape') {
      setContent(element.content);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (disabled) return;
    deleteElement(element.id);
  };

  const handleRotate = () => {
    if (disabled) return;
    const newRotation = (element.rotation + 15) % 360;
    updateElement(element.id, { rotation: newRotation });
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: element.width,
      height: element.height,
    });
  };

  return (
    <div
      ref={noteRef}
      className={`absolute group select-none ${isDragging ? 'z-50' : 'z-10'}`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        transform: `rotate(${element.rotation}deg)`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="w-full h-full rounded-lg shadow-lg border border-gray-200 relative overflow-hidden"
        style={{ backgroundColor: element.background_color }}
      >
        {/* Controls */}
        {!disabled && (
          <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            onClick={handleRotate}
            className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <RotateCw className="w-3 h-3 text-gray-600" />
          </button>
          <button
            onClick={handleDelete}
            className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center hover:bg-red-50 transition-colors"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <X className="w-3 h-3 text-red-600" />
          </button>
          </div>
        )}

        {/* Content */}
        <div className="p-3 h-full">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full h-full bg-transparent border-none outline-none resize-none"
              style={{
                color: element.color,
                fontSize: element.font_size,
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              className="w-full h-full overflow-hidden whitespace-pre-wrap break-words"
              style={{
                color: element.color,
                fontSize: element.font_size,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {element.content || 'Double-click to edit'}
            </div>
          )}
        </div>

        {/* Resize Handle */}
        {!disabled && (
          <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={handleResizeStart}
        >
          <div className="absolute bottom-1 right-1 w-0 h-0 border-l-4 border-b-4 border-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
}