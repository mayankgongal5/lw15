import React, { useEffect, useRef, useState } from 'react';
import { useBoardStore } from '../../stores/useBoardStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { WhiteboardToolbar } from './WhiteboardToolbar';
import { StickyNote } from './StickyNote';
import { PresenceCursors } from './PresenceCursors';
import { ArrowLeft, Share2, Eye } from 'lucide-react';
import { ShareModal } from './ShareModal';

interface WhiteboardProps {
  boardId: string;
  onBack: () => void;
}

export function Whiteboard({ boardId, onBack }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const {
    currentBoard,
    elements,
    drawings,
    activeSessions,
    selectedTool,
    selectedColor,
    strokeWidth,
    loadBoard,
    addElement,
    addDrawing,
    updateCursorPosition,
    unsubscribeFromBoard,
    isPublicView,
  } = useBoardStore();
  
  const { user } = useAuthStore();

  useEffect(() => {
    loadBoard(boardId);
    return () => unsubscribeFromBoard();
  }, [boardId, loadBoard, unsubscribeFromBoard]);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw all drawings
      drawings.forEach(drawing => {
        ctx.strokeStyle = drawing.stroke_color;
        ctx.lineWidth = drawing.stroke_width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (drawing.tool_type === 'pen') {
          const path = new Path2D(drawing.path_data);
          ctx.stroke(path);
        } else {
          // Handle shapes
          const coords = drawing.path_data.split(',').map(Number);
          if (coords.length >= 4) {
            const [x1, y1, x2, y2] = coords;
            
            switch (drawing.tool_type) {
              case 'line':
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
                break;
              case 'rectangle':
                ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
                break;
              case 'circle':
                const centerX = (x1 + x2) / 2;
                const centerY = (y1 + y2) / 2;
                const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) / 2;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            }
          }
        }
      });
    }
  }, [drawings]);

  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (selectedTool === 'select') return;
    
    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPos(pos);

    if (selectedTool === 'sticky_note') {
      handleAddStickyNote(pos);
      return;
    }

    if (selectedTool === 'pen') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      setCurrentPath(`M${pos.x},${pos.y}`);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    
    // Update cursor position for presence
    updateCursorPosition(boardId, pos.x, pos.y);

    if (!isDrawing || selectedTool === 'select' || selectedTool === 'sticky_note') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (selectedTool === 'pen') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setCurrentPath(prev => `${prev}L${pos.x},${pos.y}`);
    } else if (startPos) {
      // Clear and redraw for shapes
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Redraw existing drawings
      drawings.forEach(drawing => {
        ctx.strokeStyle = drawing.stroke_color;
        ctx.lineWidth = drawing.stroke_width;
        
        if (drawing.tool_type === 'pen') {
          const path = new Path2D(drawing.path_data);
          ctx.stroke(path);
        }
      });
      
      // Draw current shape
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = strokeWidth;
      
      switch (selectedTool) {
        case 'line':
          ctx.beginPath();
          ctx.moveTo(startPos.x, startPos.y);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
          break;
        case 'rectangle':
          ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
          break;
        case 'circle':
          const centerX = (startPos.x + pos.x) / 2;
          const centerY = (startPos.y + pos.y) / 2;
          const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2)) / 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          ctx.stroke();
          break;
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    
    if (selectedTool === 'pen' && currentPath) {
      addDrawing({
        board_id: boardId,
        path_data: currentPath,
        stroke_color: selectedColor,
        stroke_width: strokeWidth,
        tool_type: 'pen',
        created_by: user!.id,
      });
    } else if (startPos && ['line', 'rectangle', 'circle'].includes(selectedTool)) {
      const pos = getMousePos(e);
      const pathData = `${startPos.x},${startPos.y},${pos.x},${pos.y}`;
      
      addDrawing({
        board_id: boardId,
        path_data: pathData,
        stroke_color: selectedColor,
        stroke_width: strokeWidth,
        tool_type: selectedTool as 'line' | 'rectangle' | 'circle',
        created_by: user!.id,
      });
    }
    
    setCurrentPath('');
    setStartPos(null);
  };

  const handleAddStickyNote = (pos: { x: number; y: number }) => {
    if (isPublicView) return; // Prevent adding elements in public view
    
    addElement({
      board_id: boardId,
      type: 'sticky_note',
      content: 'New note',
      x: pos.x - 100,
      y: pos.y - 75,
      width: 200,
      height: 150,
      rotation: 0,
      color: '#000000',
      background_color: '#fef08a',
      font_size: 14,
      created_by: user!.id,
    });
  };

  if (!currentBoard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{currentBoard.title}</h1>
              {currentBoard.description && (
                <p className="text-sm text-gray-600">{currentBoard.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {activeSessions.length} active user{activeSessions.length !== 1 ? 's' : ''}
            </div>
            
            {isPublicView && (
              <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                <Eye className="w-4 h-4" />
                <span>Public View</span>
              </div>
            )}
            
            {!isPublicView && user && (
              <button
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-teal-600 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <WhiteboardToolbar disabled={isPublicView} />

      {/* Whiteboard Canvas */}
      <div className="relative flex-1" style={{ height: 'calc(100vh - 120px)' }}>
        <canvas
          ref={canvasRef}
          width={window.innerWidth}
          height={window.innerHeight}
          className="absolute inset-0 cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />

        {/* Sticky Notes */}
        {elements.map(element => (
          <StickyNote key={element.id} element={element} />
        ))}

        {/* Presence Cursors */}
        <PresenceCursors sessions={activeSessions} currentUserId={user?.id} />
      </div>
      
      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          boardId={boardId}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}