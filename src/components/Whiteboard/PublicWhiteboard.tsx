import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useBoardStore } from '../../stores/useBoardStore';
import { StickyNote } from './StickyNote';
import { PresenceCursors } from './PresenceCursors';
import { Eye, ExternalLink } from 'lucide-react';

export function PublicWhiteboard() {
  const { token } = useParams<{ token: string }>();
  const {
    currentBoard,
    elements,
    drawings,
    activeSessions,
    loading,
    loadBoardByToken,
    unsubscribeFromBoard,
  } = useBoardStore();

  useEffect(() => {
    if (token) {
      loadBoardByToken(token).catch(() => {
        // Error handling is done in the store
      });
    }
    
    return () => unsubscribeFromBoard();
  }, [token, loadBoardByToken, unsubscribeFromBoard]);

  useEffect(() => {
    const canvas = document.getElementById('public-canvas') as HTMLCanvasElement;
    if (!canvas) return;

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
  }, [drawings]);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared board...</p>
        </div>
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Board Not Found</h1>
          <p className="text-gray-600 mb-6">This share link is invalid or has expired.</p>
          <a
            href="/"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-teal-600 transition-all"
          >
            <span>Go to CollabBoard</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{currentBoard.title}</h1>
              {currentBoard.description && (
                <p className="text-sm text-gray-600">{currentBoard.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
              <Eye className="w-4 h-4" />
              <span>Public View</span>
            </div>
            
            <a
              href="/"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-teal-600 transition-all"
            >
              <span>Create Your Own</span>
            </a>
          </div>
        </div>
      </header>

      {/* Public Notice */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
        <div className="flex items-center justify-center space-x-2 text-blue-700 text-sm">
          <Eye className="w-4 h-4" />
          <span>You're viewing a shared board. Sign up to create your own collaborative whiteboards!</span>
        </div>
      </div>

      {/* Whiteboard Canvas */}
      <div className="relative" style={{ height: 'calc(100vh - 140px)' }}>
        <canvas
          id="public-canvas"
          width={window.innerWidth}
          height={window.innerHeight}
          className="absolute inset-0"
        />

        {/* Sticky Notes */}
        {elements.map(element => (
          <StickyNote key={element.id} element={element} disabled={true} />
        ))}

        {/* Presence Cursors */}
        <PresenceCursors sessions={activeSessions} currentUserId={undefined} />
      </div>
    </div>
  );
}