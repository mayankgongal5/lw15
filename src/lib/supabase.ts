import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      boards: {
        Row: {
          id: string;
          title: string;
          description: string;
          owner_id: string;
          access_level: 'private' | 'public' | 'team';
          background_color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title?: string;
          description?: string;
          owner_id: string;
          access_level?: 'private' | 'public' | 'team';
          background_color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          owner_id?: string;
          access_level?: 'private' | 'public' | 'team';
          background_color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      elements: {
        Row: {
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
        };
        Insert: {
          id?: string;
          board_id: string;
          type?: 'sticky_note' | 'shape' | 'text';
          content?: string;
          x?: number;
          y?: number;
          width?: number;
          height?: number;
          rotation?: number;
          color?: string;
          background_color?: string;
          font_size?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          type?: 'sticky_note' | 'shape' | 'text';
          content?: string;
          x?: number;
          y?: number;
          width?: number;
          height?: number;
          rotation?: number;
          color?: string;
          background_color?: string;
          font_size?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      drawings: {
        Row: {
          id: string;
          board_id: string;
          path_data: string;
          stroke_color: string;
          stroke_width: number;
          tool_type: 'pen' | 'line' | 'rectangle' | 'circle';
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          path_data: string;
          stroke_color?: string;
          stroke_width?: number;
          tool_type?: 'pen' | 'line' | 'rectangle' | 'circle';
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          path_data?: string;
          stroke_color?: string;
          stroke_width?: number;
          tool_type?: 'pen' | 'line' | 'rectangle' | 'circle';
          created_by?: string;
          created_at?: string;
        };
      };
      board_sessions: {
        Row: {
          id: string;
          board_id: string;
          user_id: string;
          cursor_x: number;
          cursor_y: number;
          last_seen: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          user_id: string;
          cursor_x?: number;
          cursor_y?: number;
          last_seen?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          user_id?: string;
          cursor_x?: number;
          cursor_y?: number;
          last_seen?: string;
          created_at?: string;
        };
      };
    };
    public_shares: {
      Row: {
        id: string;
        board_id: string;
        share_token: string;
        expires_at: string | null;
        view_only: boolean;
        created_by: string;
        created_at: string;
      };
      Insert: {
        id?: string;
        board_id: string;
        share_token?: string;
        expires_at?: string | null;
        view_only?: boolean;
        created_by: string;
        created_at?: string;
      };
      Update: {
        id?: string;
        board_id?: string;
        share_token?: string;
        expires_at?: string | null;
        view_only?: boolean;
        created_by?: string;
        created_at?: string;
      };
    };
  };
};