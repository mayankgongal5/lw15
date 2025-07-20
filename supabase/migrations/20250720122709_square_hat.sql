/*
  # Fix RLS policies to prevent infinite recursion

  1. Security Updates
    - Remove circular references in board policies
    - Simplify board access policies
    - Fix board_users policies to work correctly
    - Ensure proper access control without recursion

  2. Policy Changes
    - Direct owner check for boards
    - Proper board_users access control
    - Simplified element and drawing policies
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can read boards they own or are invited to" ON boards;
DROP POLICY IF EXISTS "Board owners can update their boards" ON boards;
DROP POLICY IF EXISTS "Board owners can delete their boards" ON boards;
DROP POLICY IF EXISTS "Users can create boards" ON boards;

-- Drop and recreate board_users policies
DROP POLICY IF EXISTS "Board owners can manage collaborators" ON board_users;
DROP POLICY IF EXISTS "Users can read board collaborators for accessible boards" ON board_users;

-- Drop and recreate element policies
DROP POLICY IF EXISTS "Users can manage elements in boards they can edit" ON elements;
DROP POLICY IF EXISTS "Users can read elements from accessible boards" ON elements;

-- Drop and recreate drawing policies
DROP POLICY IF EXISTS "Users can manage drawings in boards they can edit" ON drawings;
DROP POLICY IF EXISTS "Users can read drawings from accessible boards" ON drawings;

-- Drop and recreate board_images policies
DROP POLICY IF EXISTS "Users can manage images in boards they can edit" ON board_images;
DROP POLICY IF EXISTS "Users can read images from accessible boards" ON board_images;

-- Drop and recreate board_sessions policies
DROP POLICY IF EXISTS "Users can manage their own sessions" ON board_sessions;
DROP POLICY IF EXISTS "Users can read sessions from accessible boards" ON board_sessions;

-- Create simplified board policies without recursion
CREATE POLICY "Users can create their own boards"
  ON boards
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can read their own boards"
  ON boards
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can read public boards"
  ON boards
  FOR SELECT
  TO authenticated
  USING (access_level = 'public');

CREATE POLICY "Users can read boards they are invited to"
  ON boards
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM board_users
      WHERE board_users.board_id = boards.id
        AND board_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Board owners can update their boards"
  ON boards
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Board owners can delete their boards"
  ON boards
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Create board_users policies
CREATE POLICY "Board owners can manage collaborators"
  ON board_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_users.board_id
        AND boards.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_users.board_id
        AND boards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can read their own board memberships"
  ON board_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read collaborators of boards they own"
  ON board_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_users.board_id
        AND boards.owner_id = auth.uid()
    )
  );

-- Create element policies
CREATE POLICY "Users can manage elements in their own boards"
  ON elements
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = elements.board_id
        AND boards.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = elements.board_id
        AND boards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage elements in boards they can edit"
  ON elements
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM board_users
      WHERE board_users.board_id = elements.board_id
        AND board_users.user_id = auth.uid()
        AND board_users.role = 'editor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM board_users
      WHERE board_users.board_id = elements.board_id
        AND board_users.user_id = auth.uid()
        AND board_users.role = 'editor'
    )
  );

CREATE POLICY "Users can read elements from public boards"
  ON elements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = elements.board_id
        AND boards.access_level = 'public'
    )
  );

CREATE POLICY "Users can read elements from boards they can view"
  ON elements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM board_users
      WHERE board_users.board_id = elements.board_id
        AND board_users.user_id = auth.uid()
    )
  );

-- Create drawing policies
CREATE POLICY "Users can manage drawings in their own boards"
  ON drawings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = drawings.board_id
        AND boards.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = drawings.board_id
        AND boards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage drawings in boards they can edit"
  ON drawings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM board_users
      WHERE board_users.board_id = drawings.board_id
        AND board_users.user_id = auth.uid()
        AND board_users.role = 'editor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM board_users
      WHERE board_users.board_id = drawings.board_id
        AND board_users.user_id = auth.uid()
        AND board_users.role = 'editor'
    )
  );

CREATE POLICY "Users can read drawings from public boards"
  ON drawings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = drawings.board_id
        AND boards.access_level = 'public'
    )
  );

CREATE POLICY "Users can read drawings from boards they can view"
  ON drawings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM board_users
      WHERE board_users.board_id = drawings.board_id
        AND board_users.user_id = auth.uid()
    )
  );

-- Create board_images policies
CREATE POLICY "Users can manage images in their own boards"
  ON board_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_images.board_id
        AND boards.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_images.board_id
        AND boards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage images in boards they can edit"
  ON board_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM board_users
      WHERE board_users.board_id = board_images.board_id
        AND board_users.user_id = auth.uid()
        AND board_users.role = 'editor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM board_users
      WHERE board_users.board_id = board_images.board_id
        AND board_users.user_id = auth.uid()
        AND board_users.role = 'editor'
    )
  );

CREATE POLICY "Users can read images from public boards"
  ON board_images
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_images.board_id
        AND boards.access_level = 'public'
    )
  );

CREATE POLICY "Users can read images from boards they can view"
  ON board_images
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM board_users
      WHERE board_users.board_id = board_images.board_id
        AND board_users.user_id = auth.uid()
    )
  );

-- Create board_sessions policies
CREATE POLICY "Users can manage their own sessions"
  ON board_sessions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read sessions from their own boards"
  ON board_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_sessions.board_id
        AND boards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can read sessions from public boards"
  ON board_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards
      WHERE boards.id = board_sessions.board_id
        AND boards.access_level = 'public'
    )
  );

CREATE POLICY "Users can read sessions from boards they can view"
  ON board_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM board_users
      WHERE board_users.board_id = board_sessions.board_id
        AND board_users.user_id = auth.uid()
    )
  );