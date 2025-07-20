/*
  # Create Collaborative Whiteboard Schema

  1. New Tables
    - `profiles` - User profile information
      - `id` (uuid, references auth.users)
      - `email` (text)
      - `full_name` (text)
      - `avatar_url` (text)
      - `created_at` (timestamp)
    
    - `boards` - Whiteboard sessions
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `owner_id` (uuid, references profiles)
      - `access_level` (text: private/public/team)
      - `background_color` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `board_users` - Board collaboration permissions
      - `id` (uuid, primary key)
      - `board_id` (uuid, references boards)
      - `user_id` (uuid, references profiles)
      - `role` (text: viewer/editor)
      - `invited_by` (uuid, references profiles)
      - `created_at` (timestamp)
    
    - `elements` - Sticky notes and shapes on boards
      - `id` (uuid, primary key)
      - `board_id` (uuid, references boards)
      - `type` (text: sticky_note/shape)
      - `content` (text)
      - `x` (real)
      - `y` (real)
      - `width` (real)
      - `height` (real)
      - `rotation` (real)
      - `color` (text)
      - `background_color` (text)
      - `font_size` (integer)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `drawings` - Freehand drawings and lines
      - `id` (uuid, primary key)
      - `board_id` (uuid, references boards)
      - `path_data` (text)
      - `stroke_color` (text)
      - `stroke_width` (real)
      - `tool_type` (text: pen/line/rectangle/circle)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamp)
    
    - `board_images` - Images uploaded to boards
      - `id` (uuid, primary key)
      - `board_id` (uuid, references boards)
      - `file_path` (text)
      - `x` (real)
      - `y` (real)
      - `width` (real)
      - `height` (real)
      - `rotation` (real)
      - `created_by` (uuid, references profiles)
      - `created_at` (timestamp)
    
    - `board_sessions` - Active user sessions for presence
      - `id` (uuid, primary key)
      - `board_id` (uuid, references boards)
      - `user_id` (uuid, references profiles)
      - `cursor_x` (real)
      - `cursor_y` (real)
      - `last_seen` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for board-based access control
    - Ensure users can only access boards they own or are invited to
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Create boards table
CREATE TABLE IF NOT EXISTS boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Untitled Board',
  description text DEFAULT '',
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_level text NOT NULL DEFAULT 'private' CHECK (access_level IN ('private', 'public', 'team')),
  background_color text DEFAULT '#ffffff',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create board_users table
CREATE TABLE IF NOT EXISTS board_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
  invited_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(board_id, user_id)
);

-- Create elements table
CREATE TABLE IF NOT EXISTS elements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'sticky_note' CHECK (type IN ('sticky_note', 'shape', 'text')),
  content text DEFAULT '',
  x real NOT NULL DEFAULT 0,
  y real NOT NULL DEFAULT 0,
  width real NOT NULL DEFAULT 200,
  height real NOT NULL DEFAULT 150,
  rotation real DEFAULT 0,
  color text DEFAULT '#000000',
  background_color text DEFAULT '#fef08a',
  font_size integer DEFAULT 14,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create drawings table
CREATE TABLE IF NOT EXISTS drawings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  path_data text NOT NULL,
  stroke_color text DEFAULT '#000000',
  stroke_width real DEFAULT 2,
  tool_type text DEFAULT 'pen' CHECK (tool_type IN ('pen', 'line', 'rectangle', 'circle')),
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Create board_images table
CREATE TABLE IF NOT EXISTS board_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  x real NOT NULL DEFAULT 0,
  y real NOT NULL DEFAULT 0,
  width real NOT NULL DEFAULT 200,
  height real NOT NULL DEFAULT 200,
  rotation real DEFAULT 0,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Create board_sessions table for presence
CREATE TABLE IF NOT EXISTS board_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cursor_x real DEFAULT 0,
  cursor_y real DEFAULT 0,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(board_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Boards policies
CREATE POLICY "Users can read boards they own or are invited to"
  ON boards FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR
    access_level = 'public' OR
    EXISTS (
      SELECT 1 FROM board_users
      WHERE board_users.board_id = boards.id
        AND board_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create boards"
  ON boards FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Board owners can update their boards"
  ON boards FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Board owners can delete their boards"
  ON boards FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Board users policies
CREATE POLICY "Users can read board collaborators for accessible boards"
  ON board_users FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_users.board_id
        AND (boards.owner_id = auth.uid() OR boards.access_level = 'public')
    )
  );

CREATE POLICY "Board owners can manage collaborators"
  ON board_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_users.board_id
        AND boards.owner_id = auth.uid()
    )
  );

-- Elements policies
CREATE POLICY "Users can read elements from accessible boards"
  ON elements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = elements.board_id
        AND (
          boards.owner_id = auth.uid() OR
          boards.access_level = 'public' OR
          EXISTS (
            SELECT 1 FROM board_users
            WHERE board_users.board_id = boards.id
              AND board_users.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Users can manage elements in boards they can edit"
  ON elements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = elements.board_id
        AND (
          boards.owner_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM board_users
            WHERE board_users.board_id = boards.id
              AND board_users.user_id = auth.uid()
              AND board_users.role = 'editor'
          )
        )
    )
  );

-- Drawings policies (same pattern as elements)
CREATE POLICY "Users can read drawings from accessible boards"
  ON drawings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = drawings.board_id
        AND (
          boards.owner_id = auth.uid() OR
          boards.access_level = 'public' OR
          EXISTS (
            SELECT 1 FROM board_users
            WHERE board_users.board_id = boards.id
              AND board_users.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Users can manage drawings in boards they can edit"
  ON drawings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = drawings.board_id
        AND (
          boards.owner_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM board_users
            WHERE board_users.board_id = boards.id
              AND board_users.user_id = auth.uid()
              AND board_users.role = 'editor'
          )
        )
    )
  );

-- Board images policies (same pattern)
CREATE POLICY "Users can read images from accessible boards"
  ON board_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_images.board_id
        AND (
          boards.owner_id = auth.uid() OR
          boards.access_level = 'public' OR
          EXISTS (
            SELECT 1 FROM board_users
            WHERE board_users.board_id = boards.id
              AND board_users.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Users can manage images in boards they can edit"
  ON board_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_images.board_id
        AND (
          boards.owner_id = auth.uid() OR
          EXISTS (
            SELECT 1 FROM board_users
            WHERE board_users.board_id = boards.id
              AND board_users.user_id = auth.uid()
              AND board_users.role = 'editor'
          )
        )
    )
  );

-- Board sessions policies
CREATE POLICY "Users can read sessions from accessible boards"
  ON board_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_sessions.board_id
        AND (
          boards.owner_id = auth.uid() OR
          boards.access_level = 'public' OR
          EXISTS (
            SELECT 1 FROM board_users
            WHERE board_users.board_id = boards.id
              AND board_users.user_id = auth.uid()
          )
        )
    )
  );

CREATE POLICY "Users can manage their own sessions"
  ON board_sessions FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_elements_updated_at
  BEFORE UPDATE ON elements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create storage bucket for board images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('board-images', 'board-images', true);

-- Storage policies
CREATE POLICY "Users can upload images to their boards"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'board-images');

CREATE POLICY "Images are publicly accessible"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'board-images');

CREATE POLICY "Users can update their uploaded images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'board-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their uploaded images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'board-images' AND auth.uid()::text = (storage.foldername(name))[1]);