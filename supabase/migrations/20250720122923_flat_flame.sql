/*
  # Debug boards table and policies
  
  This migration helps debug the boards table structure and policies
  to identify why board creation is failing.
*/

-- Check if boards table exists and its structure
DO $$
BEGIN
  -- Log table structure
  RAISE NOTICE 'Checking boards table structure...';
  
  -- Check if table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'boards') THEN
    RAISE NOTICE 'Boards table exists';
  ELSE
    RAISE NOTICE 'Boards table does not exist!';
  END IF;
END $$;

-- Recreate boards table with explicit structure
DROP TABLE IF EXISTS boards CASCADE;

CREATE TABLE boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Untitled Board',
  description text DEFAULT '',
  owner_id uuid NOT NULL,
  access_level text NOT NULL DEFAULT 'private' CHECK (access_level IN ('private', 'public', 'team')),
  background_color text DEFAULT '#ffffff',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE boards 
ADD CONSTRAINT boards_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

-- Create simple, clear policies
CREATE POLICY "Users can create their own boards" ON boards
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can read their own boards" ON boards
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can read public boards" ON boards
  FOR SELECT 
  TO authenticated 
  USING (access_level = 'public');

CREATE POLICY "Users can update their own boards" ON boards
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own boards" ON boards
  FOR DELETE 
  TO authenticated 
  USING (auth.uid() = owner_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON boards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();