import React from 'react';
import { BoardSession } from '../../stores/useBoardStore';

interface PresenceCursorsProps {
  sessions: BoardSession[];
  currentUserId?: string;
}

export function PresenceCursors({ sessions, currentUserId }: PresenceCursorsProps) {
  const otherSessions = sessions.filter(session => session.user_id !== currentUserId);

  return (
    <>
      {otherSessions.map((session) => (
        <div
          key={session.id}
          className="absolute pointer-events-none z-50"
          style={{
            left: session.cursor_x,
            top: session.cursor_y,
            transform: 'translate(-2px, -2px)',
          }}
        >
          {/* Cursor */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            className="drop-shadow-sm"
          >
            <path
              d="M2 2L8 8L6 10L10 18L12 16L18 10L10 6L2 2Z"
              fill="#3B82F6"
              stroke="white"
              strokeWidth="1"
            />
          </svg>
          
          {/* Name Label */}
          <div className="absolute top-4 left-4 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            {session.profiles?.full_name || 'Anonymous'}
          </div>
        </div>
      ))}
    </>
  );
}