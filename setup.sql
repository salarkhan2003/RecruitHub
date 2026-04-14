-- SQL Setup for Supabase
-- Run this in your Supabase SQL Editor

-- 1. Create User table
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create Test table
CREATE TABLE IF NOT EXISTS "Test" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "duration" INTEGER NOT NULL,
  "category" TEXT DEFAULT 'General',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "creatorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE
);

-- 3. Create Question table
CREATE TABLE IF NOT EXISTS "Question" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "text" TEXT NOT NULL,
  "options" TEXT NOT NULL, -- JSON stringified array
  "correctAnswer" INTEGER NOT NULL,
  "testId" TEXT NOT NULL REFERENCES "Test"("id") ON DELETE CASCADE
);

-- 4. Create Submission table
CREATE TABLE IF NOT EXISTS "Submission" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "score" DOUBLE PRECISION,
  "status" TEXT NOT NULL, -- "COMPLETED", "IN_PROGRESS"
  "startedAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "testId" TEXT NOT NULL REFERENCES "Test"("id") ON DELETE CASCADE,
  "answers" TEXT NOT NULL, -- JSON stringified map
  "recruitmentStatus" TEXT DEFAULT 'PENDING', -- 'PENDING', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFER_SENT', 'REJECTED'
  "interviewLink" TEXT,
  "recruiterNotes" TEXT
);

-- Enable RLS (Optional but recommended)
-- For this demo, we'll keep it simple, but you should configure policies in Supabase UI.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Test" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Question" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Submission" ENABLE ROW LEVEL SECURITY;

-- Simple "Allow All" policies for demo purposes (NOT FOR PRODUCTION)
DROP POLICY IF EXISTS "Allow all on User" ON "User";
CREATE POLICY "Allow all on User" ON "User" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on Test" ON "Test";
CREATE POLICY "Allow all on Test" ON "Test" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on Question" ON "Question";
CREATE POLICY "Allow all on Question" ON "Question" FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on Submission" ON "Submission";
CREATE POLICY "Allow all on Submission" ON "Submission" FOR ALL USING (true) WITH CHECK (true);
