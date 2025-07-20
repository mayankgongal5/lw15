import React, { useState, useEffect } from 'react';
import { X, Copy, Share2, Clock, Eye, Edit, Trash2, ExternalLink } from 'lucide-react';
import { useBoardStore, PublicShare } from '../../stores/useBoardStore';
import toast from 'react-hot-toast';

interface ShareModalProps {
  boardId: string;
  onClose: () => void;
}

export function ShareModal({ boardId, onClose }: ShareModalProps) {
  const [shares, setShares] = useState<PublicShare[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [viewOnly, setViewOnly] = useState(true);
  const [expiresIn, setExpiresIn] = useState<string>('never');
  
  const { createPublicShare, deletePublicShare, getPublicShares } = useBoardStore();

  useEffect(() => {
    loadShares();
  }, [boardId]);

  const loadShares = async () => {
    setLoading(true);
    try {
      const data = await getPublicShares(boardId);
      setShares(data);
    } catch (error) {
      console.error('Error loading shares:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShare = async () => {
    setCreating(true);
    try {
      let expiresAt: string | undefined;
      
      if (expiresIn !== 'never') {
        const now = new Date();
        switch (expiresIn) {
          case '1hour':
            now.setHours(now.getHours() + 1);
            break;
          case '1day':
            now.setDate(now.getDate() + 1);
            break;
          case '1week':
            now.setDate(now.getDate() + 7);
            break;
          case '1month':
            now.setMonth(now.getMonth() + 1);
            break;
        }
        expiresAt = now.toISOString();
      }

      await createPublicShare(boardId, viewOnly, expiresAt);
      await loadShares();
    } catch (error) {
      console.error('Error creating share:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteShare = async (shareId: string) => {
    try {
      await deletePublicShare(shareId);
      await loadShares();
    } catch (error) {
      console.error('Error deleting share:', error);
    }
  };

  const copyToClipboard = (token: string) => {
    const url = `${window.location.origin}/shared/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Share link copied to clipboard!');
  };

  const openInNewTab = (token: string) => {
    const url = `${window.location.origin}/shared/${token}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Share Board</h2>
              <p className="text-sm text-gray-600">Create public links to share this board</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Create New Share */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <h3 className="font-medium text-gray-900">Create New Share Link</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permission Level
                </label>
                <div className="flex space-x-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={viewOnly}
                      onChange={() => setViewOnly(true)}
                      className="mr-2"
                    />
                    <Eye className="w-4 h-4 mr-1" />
                    <span className="text-sm">View Only</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!viewOnly}
                      onChange={() => setViewOnly(false)}
                      className="mr-2"
                    />
                    <Edit className="w-4 h-4 mr-1" />
                    <span className="text-sm">Can Edit</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expires
                </label>
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="never">Never</option>
                  <option value="1hour">1 Hour</option>
                  <option value="1day">1 Day</option>
                  <option value="1week">1 Week</option>
                  <option value="1month">1 Month</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCreateShare}
              disabled={creating}
              className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-teal-600 transition-all disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Share Link'}
            </button>
          </div>

          {/* Existing Shares */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Active Share Links</h3>
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : shares.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Share2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No share links created yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {shares.map((share) => (
                  <div key={share.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          {share.view_only ? (
                            <Eye className="w-4 h-4 text-gray-500" />
                          ) : (
                            <Edit className="w-4 h-4 text-blue-500" />
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {share.view_only ? 'View Only' : 'Can Edit'}
                          </span>
                          {share.expires_at && (
                            <>
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-500">
                                Expires {new Date(share.expires_at).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded truncate">
                          {window.location.origin}/shared/{share.share_token}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => copyToClipboard(share.share_token)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Copy link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openInNewTab(share.share_token)}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteShare(share.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete share"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}