-- Founder Note Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- First, drop existing tables if they exist (careful in production!)
DROP TABLE IF EXISTS public.todos CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table for onboarding and preferences
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  usage_preferences TEXT[] DEFAULT '{}',
  ai_style_preferences TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notes table with TEXT user_id for flexibility
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Note',
  transcription TEXT NOT NULL,
  smartified_text TEXT,
  summary TEXT,
  key_points JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  folder TEXT,
  starred BOOLEAN DEFAULT FALSE,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create todos table
CREATE TABLE public.todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_notes_created_at ON public.notes(created_at DESC);
CREATE INDEX idx_notes_folder ON public.notes(folder);
CREATE INDEX idx_todos_user_id ON public.todos(user_id);
CREATE INDEX idx_todos_note_id ON public.todos(note_id);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for MVP (in production, use proper auth)
CREATE POLICY "Allow all operations on user_profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on notes" ON public.notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on todos" ON public.todos FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.user_profiles TO anon, authenticated, service_role;
GRANT ALL ON public.notes TO anon, authenticated, service_role;
GRANT ALL ON public.todos TO anon, authenticated, service_role;

-- If you already have data and just need to add the user_profiles table:
-- CREATE TABLE IF NOT EXISTS public.user_profiles (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   user_id UUID UNIQUE NOT NULL,
--   full_name TEXT,
--   email TEXT,
--   onboarding_completed BOOLEAN DEFAULT FALSE,
--   usage_preferences TEXT[] DEFAULT '{}',
--   ai_style_preferences TEXT[] DEFAULT '{}',
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );
-- ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all operations on user_profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);
-- GRANT ALL ON public.user_profiles TO anon, authenticated, service_role;
