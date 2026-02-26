-- =====================================================
-- CodeSketch Database Setup for Supabase
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- Dashboard > SQL Editor > New Query
-- =====================================================

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE user_profiles IS 'Stores additional profile information for authenticated users';

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running script)
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Create policy to allow users to read their own profile
CREATE POLICY "Users can view their own profile"
    ON user_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile"
    ON user_profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
    ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON user_profiles(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS user_profiles_created_at_idx ON user_profiles(created_at DESC);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Optional: Room History Table (for future features)
-- =====================================================
-- Uncomment if you want to track room creation history


CREATE TABLE IF NOT EXISTS room_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    creator_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    participant_count INTEGER DEFAULT 1,
    code_snapshot TEXT,
    language TEXT DEFAULT 'cpp'
);

-- Enable RLS for room_history
ALTER TABLE room_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view rooms they created or participated in
CREATE POLICY "Users can view their room history"
    ON room_history
    FOR SELECT
    USING (created_by = auth.uid());

-- Policy: Users can insert room records
CREATE POLICY "Users can create room history"
    ON room_history
    FOR INSERT
    WITH CHECK (created_by = auth.uid());

-- Create indexes for room_history
CREATE INDEX IF NOT EXISTS room_history_room_id_idx ON room_history(room_id);
CREATE INDEX IF NOT EXISTS room_history_created_by_idx ON room_history(created_by);
CREATE INDEX IF NOT EXISTS room_history_created_at_idx ON room_history(created_at DESC);


-- =====================================================
-- Verification Queries
-- =====================================================
-- Run these to verify everything is set up correctly

-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
) AS table_exists;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_profiles';

-- Check policies
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Configure Google OAuth in Supabase Authentication';
    RAISE NOTICE '2. Add redirect URLs to Supabase URL Configuration';
    RAISE NOTICE '3. Set up environment variables in your application';
    RAISE NOTICE '4. Test the authentication flow';
END $$;
