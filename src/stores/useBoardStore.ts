import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export interface Board {
  id: string;
  title: string;
  description: string;
  owner_id: string;
  access_level: 'private' | 'public' | 'team';
  background_color: string;
  created_at: string;
  updated_at: string;
}

export interface Element {
  id: string;
  board_id: string;
  type: 'sticky_note' | 'shape' | 'text';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  background_color: string;
  font_size: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Drawing {
  id: string;
  board_id: string;
  path_data: string;
  stroke_color: string;
  stroke_width: number;
  tool_type: 'pen' | 'line' | 'rectangle' | 'circle';
  created_by: string;
  created_at: string;
}

export interface PublicShare {
  id: string;
  board_id: string;
  share_token: string;
  expires_at: string | null;
  view_only: boolean;
  created_by: string;
  created_at: string;
}

export interface BoardSession {
  id: string;
  board_id: string;
  user_id: string;
  cursor_x: number;
  cursor_y: number;
  last_seen: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

interface BoardState {
  boards: Board[];
  currentBoard: Board | null;
  elements: Element[];
  drawings: Drawing[];
  activeSessions: BoardSession[];
  selectedTool: 'select' | 'sticky_note' | 'pen' | 'line' | 'rectangle' | 'circle';
  selectedColor: string;
  strokeWidth: number;
  loading: boolean;
  isPublicView: boolean;
  shareToken: string | null;
  
  // Actions
  fetchBoards: () => Promise<void>;
  createBoard: (title: string, description?: string) => Promise<Board>;
  loadBoard: (boardId: string) => Promise<void>;
  updateBoardTitle: (boardId: string, title: string) => Promise<void>;
  
  // Elements
  addElement: (element: Omit<Element, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateElement: (elementId: string, updates: Partial<Element>) => Promise<void>;
  deleteElement: (elementId: string) => Promise<void>;
  
  // Drawings
  addDrawing: (drawing: Omit<Drawing, 'id' | 'created_at'>) => Promise<void>;
  deleteDrawing: (drawingId: string) => Promise<void>;
  
  // Tools
  setSelectedTool: (tool: 'select' | 'sticky_note' | 'pen' | 'line' | 'rectangle' | 'circle') => void;
  setSelectedColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  
  // Presence
  updateCursorPosition: (boardId: string, x: number, y: number) => Promise<void>;
  subscribeToBoard: (boardId: string) => void;
  unsubscribeFromBoard: () => void;
  
  // Public sharing
  createPublicShare: (boardId: string, viewOnly?: boolean, expiresAt?: string) => Promise<PublicShare>;
  deletePublicShare: (shareId: string) => Promise<void>;
  getPublicShares: (boardId: string) => Promise<PublicShare[]>;
  loadBoardByToken: (token: string) => Promise<void>;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  currentBoard: null,
  elements: [],
  drawings: [],
  activeSessions: [],
  selectedTool: 'select',
  selectedColor: '#000000',
  strokeWidth: 2,
  loading: false,
  isPublicView: false,
  shareToken: null,

  fetchBoards: async () => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      set({ boards: data || [] });
    } catch (error: any) {
      toast.error('Failed to fetch boards');
      console.error('Error fetching boards:', error);
    } finally {
      set({ loading: false });
    }
  },

  createBoard: async (title: string, description = '') => {
    try {
      console.log('Starting board creation...', { title, description });
      
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      if (!user) throw new Error('Not authenticated');

      const boardData = {
        title,
        description,
        owner_id: user.id,
        access_level: 'private' as const,
        background_color: '#ffffff',
      };
      console.log('Board data to insert:', boardData);

      const { data, error } = await supabase
        .from('boards')
        .insert(boardData)
        .select()
        .single();

      console.log('Supabase response:', { data, error });
      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }
      
      set(state => ({ boards: [data, ...state.boards] }));
      toast.success('Board created successfully!');
      console.log('Board created successfully:', data);
      return data;
    } catch (error: any) {
      console.error('Error creating board:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      toast.error(`Failed to create board: ${error.message}`);
      throw error;
    }
  },

  loadBoard: async (boardId: string) => {
    try {
      set({ loading: true });
      
      // Load board details
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single();

      if (boardError) throw boardError;

      // Load elements
      const { data: elements, error: elementsError } = await supabase
        .from('elements')
        .select('*')
        .eq('board_id', boardId);

      if (elementsError) throw elementsError;

      // Load drawings
      const { data: drawings, error: drawingsError } = await supabase
        .from('drawings')
        .select('*')
        .eq('board_id', boardId);

      if (drawingsError) throw drawingsError;

      set({
        currentBoard: board,
        elements: elements || [],
        drawings: drawings || [],
      });

      // Subscribe to realtime updates
      get().subscribeToBoard(boardId);
    } catch (error: any) {
      toast.error('Failed to load board');
      console.error('Error loading board:', error);
    } finally {
      set({ loading: false });
    }
  },

  updateBoardTitle: async (boardId: string, title: string) => {
    try {
      const { error } = await supabase
        .from('boards')
        .update({ title })
        .eq('id', boardId);

      if (error) throw error;

      set(state => ({
        boards: state.boards.map(board =>
          board.id === boardId ? { ...board, title } : board
        ),
        currentBoard: state.currentBoard?.id === boardId
          ? { ...state.currentBoard, title }
          : state.currentBoard,
      }));
    } catch (error: any) {
      toast.error('Failed to update board title');
      console.error('Error updating board title:', error);
    }
  },

  addElement: async (element) => {
    try {
      const { data, error } = await supabase
        .from('elements')
        .insert(element)
        .select()
        .single();

      if (error) throw error;
      
      set(state => ({ elements: [...state.elements, data] }));
    } catch (error: any) {
      toast.error('Failed to add element');
      console.error('Error adding element:', error);
    }
  },

  updateElement: async (elementId, updates) => {
    try {
      const { error } = await supabase
        .from('elements')
        .update(updates)
        .eq('id', elementId);

      if (error) throw error;

      set(state => ({
        elements: state.elements.map(element =>
          element.id === elementId ? { ...element, ...updates } : element
        ),
      }));
    } catch (error: any) {
      console.error('Error updating element:', error);
    }
  },

  deleteElement: async (elementId) => {
    try {
      const { error } = await supabase
        .from('elements')
        .delete()
        .eq('id', elementId);

      if (error) throw error;

      set(state => ({
        elements: state.elements.filter(element => element.id !== elementId),
      }));
    } catch (error: any) {
      toast.error('Failed to delete element');
      console.error('Error deleting element:', error);
    }
  },

  addDrawing: async (drawing) => {
    try {
      const { data, error } = await supabase
        .from('drawings')
        .insert(drawing)
        .select()
        .single();

      if (error) throw error;
      
      set(state => ({ drawings: [...state.drawings, data] }));
    } catch (error: any) {
      toast.error('Failed to add drawing');
      console.error('Error adding drawing:', error);
    }
  },

  deleteDrawing: async (drawingId) => {
    try {
      const { error } = await supabase
        .from('drawings')
        .delete()
        .eq('id', drawingId);

      if (error) throw error;

      set(state => ({
        drawings: state.drawings.filter(drawing => drawing.id !== drawingId),
      }));
    } catch (error: any) {
      toast.error('Failed to delete drawing');
      console.error('Error deleting drawing:', error);
    }
  },

  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setSelectedColor: (color) => set({ selectedColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),

  updateCursorPosition: async (boardId, x, y) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('board_sessions')
        .upsert({
          board_id: boardId,
          user_id: user.id,
          cursor_x: x,
          cursor_y: y,
          last_seen: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error updating cursor position:', error);
    }
  },

  subscribeToBoard: (boardId) => {
    // Subscribe to elements changes
    const elementsSubscription = supabase
      .channel('elements')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'elements',
        filter: `board_id=eq.${boardId}`,
      }, (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        set(state => {
          switch (eventType) {
            case 'INSERT':
              return { elements: [...state.elements, newRecord as Element] };
            case 'UPDATE':
              return {
                elements: state.elements.map(element =>
                  element.id === newRecord.id ? newRecord as Element : element
                ),
              };
            case 'DELETE':
              return {
                elements: state.elements.filter(element => element.id !== oldRecord.id),
              };
            default:
              return state;
          }
        });
      })
      .subscribe();

    // Subscribe to drawings changes
    const drawingsSubscription = supabase
      .channel('drawings')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'drawings',
        filter: `board_id=eq.${boardId}`,
      }, (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        set(state => {
          switch (eventType) {
            case 'INSERT':
              return { drawings: [...state.drawings, newRecord as Drawing] };
            case 'DELETE':
              return {
                drawings: state.drawings.filter(drawing => drawing.id !== oldRecord.id),
              };
            default:
              return state;
          }
        });
      })
      .subscribe();

    // Subscribe to presence changes
    const presenceSubscription = supabase
      .channel('board_sessions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'board_sessions',
        filter: `board_id=eq.${boardId}`,
      }, async (payload) => {
        // Fetch updated sessions with profile data
        const { data } = await supabase
          .from('board_sessions')
          .select(`
            *,
            profiles (
              full_name,
              avatar_url
            )
          `)
          .eq('board_id', boardId)
          .gte('last_seen', new Date(Date.now() - 30000).toISOString()); // Active in last 30 seconds

        set({ activeSessions: data || [] });
      })
      .subscribe();
  },

  unsubscribeFromBoard: () => {
    supabase.removeAllChannels();
  },

  createPublicShare: async (boardId: string, viewOnly = true, expiresAt?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const shareData = {
        board_id: boardId,
        view_only: viewOnly,
        created_by: user.id,
        expires_at: expiresAt || null,
      };

      const { data, error } = await supabase
        .from('public_shares')
        .insert(shareData)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Share link created successfully!');
      return data;
    } catch (error: any) {
      toast.error('Failed to create share link');
      console.error('Error creating share:', error);
      throw error;
    }
  },

  deletePublicShare: async (shareId: string) => {
    try {
      const { error } = await supabase
        .from('public_shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;
      
      toast.success('Share link deleted');
    } catch (error: any) {
      toast.error('Failed to delete share link');
      console.error('Error deleting share:', error);
    }
  },

  getPublicShares: async (boardId: string) => {
    try {
      const { data, error } = await supabase
        .from('public_shares')
        .select('*')
        .eq('board_id', boardId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching shares:', error);
      return [];
    }
  },

  loadBoardByToken: async (token: string) => {
    try {
      set({ loading: true, isPublicView: true, shareToken: token });
      
      // First, verify the share token is valid
      const { data: share, error: shareError } = await supabase
        .from('public_shares')
        .select('*')
        .eq('share_token', token)
        .single();

      if (shareError) throw new Error('Invalid or expired share link');
      
      // Check if share has expired
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        throw new Error('Share link has expired');
      }

      // Load board details
      const { data: board, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .eq('id', share.board_id)
        .single();

      if (boardError) throw boardError;

      // Load elements
      const { data: elements, error: elementsError } = await supabase
        .from('elements')
        .select('*')
        .eq('board_id', share.board_id);

      if (elementsError) throw elementsError;

      // Load drawings
      const { data: drawings, error: drawingsError } = await supabase
        .from('drawings')
        .select('*')
        .eq('board_id', share.board_id);

      if (drawingsError) throw drawingsError;

      set({
        currentBoard: board,
        elements: elements || [],
        drawings: drawings || [],
      });

      // Subscribe to realtime updates for public view
      get().subscribeToBoard(share.board_id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load shared board');
      console.error('Error loading shared board:', error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));