import React, { useEffect, useState } from 'react';
import { Plus, Search, Grid, List, Users, Globe, Lock } from 'lucide-react';
import { useBoardStore } from '../../stores/useBoardStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { CreateBoardModal } from './CreateBoardModal';

interface DashboardProps {
  onBoardSelect: (boardId: string) => void;
}

export function Dashboard({ onBoardSelect }: DashboardProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { boards, loading, fetchBoards } = useBoardStore();
  const { signOut, profile } = useAuthStore();

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const filteredBoards = boards.filter(board =>
    board.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    board.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAccessIcon = (accessLevel: string) => {
    switch (accessLevel) {
      case 'public':
        return <Globe className="w-4 h-4" />;
      case 'team':
        return <Users className="w-4 h-4" />;
      default:
        return <Lock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">CollabBoard</h1>
              <div className="hidden sm:block w-px h-6 bg-gray-300" />
              <p className="hidden sm:block text-gray-600">Welcome back, {profile?.full_name || 'User'}</p>
            </div>
            <button
              onClick={signOut}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Boards</h2>
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
              {filteredBoards.length}
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search boards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Create Board */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-600 hover:to-teal-600 transition-all transform hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>New Board</span>
            </button>
          </div>
        </div>

        {/* Boards Grid/List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredBoards.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Grid className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No boards found' : 'No boards yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Create your first board to start collaborating'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-teal-600 transition-all transform hover:scale-[1.02]"
              >
                <Plus className="w-5 h-5" />
                <span>Create Your First Board</span>
              </button>
            )}
          </div>
        ) : (
          <div className={
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-3'
          }>
            {filteredBoards.map((board) => (
              <div
                key={board.id}
                onClick={() => onBoardSelect(board.id)}
                className={`
                  bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-all transform hover:scale-[1.02] group
                  ${viewMode === 'list' ? 'flex items-center space-x-4' : ''}
                `}
              >
                <div className={`
                  w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center flex-shrink-0
                  ${viewMode === 'list' ? '' : 'mb-4'}
                `}>
                  <Grid className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className={`flex items-center justify-between ${viewMode === 'list' ? '' : 'mb-2'}`}>
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {board.title}
                    </h3>
                    <div className="flex items-center space-x-1 text-gray-400">
                      {getAccessIcon(board.access_level)}
                    </div>
                  </div>
                  
                  {board.description && (
                    <p className={`text-gray-600 text-sm ${viewMode === 'list' ? 'truncate' : 'line-clamp-2'}`}>
                      {board.description}
                    </p>
                  )}
                  
                  <div className={`text-xs text-gray-500 ${viewMode === 'list' ? 'mt-1' : 'mt-3'}`}>
                    Updated {new Date(board.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Board Modal */}
      {showCreateModal && (
        <CreateBoardModal
          onClose={() => setShowCreateModal(false)}
          onBoardCreated={(board) => {
            console.log('Board created in Dashboard:', board);
            setShowCreateModal(false);
            onBoardSelect(board.id);
          }}
        />
      )}
    </div>
  );
}