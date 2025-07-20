/*
  # Add public sharing functionality

  1. New Tables
    - `public_shares` - stores shareable links for boards
      - `id` (uuid, primary key)
      - `board_id` (uuid, references boards)
      - `share_token` (text, unique token for sharing)
      - `expires_at` (timestamp, optional expiration)
      - `view_only` (boolean, whether guests can only view)
      - `created_by` (uuid, who created the share)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `public_shares` table
    - Add policies for managing shares
    - Update board policies to allow public access via share tokens

  3. Changes
    - Allow anonymous users to read boards with valid share tokens
    - Allow anonymous users to read elements/drawings from shared boards
</sql>

-- Create public_shares table
CREATE TABLE IF NOT EXISTS public_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  share_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64url'),
  expires_at timestamptz,
  view_only boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public_shares ENABLE ROW LEVEL SECURITY;

-- Policies for public_shares
CREATE POLICY "Board owners can manage shares"
  ON public_shares
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = public_shares.board_id 
      AND boards.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = public_shares.board_id 
      AND boards.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can read valid shares"
  ON public_shares
  FOR SELECT
  TO anon, authenticated
  USING (
    expires_at IS NULL OR expires_at > now()
  );

-- Update board policies to allow public access via share tokens
CREATE POLICY "Allow public access to shared boards"
  ON boards
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public_shares
      WHERE public_shares.board_id = boards.id
      AND (public_shares.expires_at IS NULL OR public_shares.expires_at > now())
    )
  );

-- Update elements policies for shared boards
CREATE POLICY "Allow reading elements from shared boards"
  ON elements
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public_shares
      WHERE public_shares.board_id = elements.board_id
      AND (public_shares.expires_at IS NULL OR public_shares.expires_at > now())
    )
  );

-- Update drawings policies for shared boards
CREATE POLICY "Allow reading drawings from shared boards"
  ON drawings
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public_shares
      WHERE public_shares.board_id = drawings.board_id
      AND (public_shares.expires_at IS NULL OR public_shares.expires_at > now())
    )
  );

-- Update board_images policies for shared boards
CREATE POLICY "Allow reading images from shared boards"
  ON board_images
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public_shares
      WHERE public_shares.board_id = board_images.board_id
      AND (public_shares.expires_at IS NULL OR public_shares.expires_at > now())
    )
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_public_shares_token ON public_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_public_shares_board_id ON public_shares(board_id);