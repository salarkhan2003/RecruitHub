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

-- 5. Create Job table
CREATE TABLE IF NOT EXISTS "Job" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "requirements" TEXT,
  "location" TEXT,
  "type" TEXT DEFAULT 'Full-time',
  "salaryRange" TEXT,
  "creatorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "status" TEXT DEFAULT 'OPEN',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Create JobField table
CREATE TABLE IF NOT EXISTS "JobField" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "jobId" TEXT NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
  "label" TEXT NOT NULL,
  "type" TEXT DEFAULT 'text',
  "isRequired" BOOLEAN DEFAULT true,
  "options" TEXT
);

-- 7. Create Application table
CREATE TABLE IF NOT EXISTS "Application" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "jobId" TEXT NOT NULL REFERENCES "Job"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "status" TEXT DEFAULT 'APPLIED',
  "aiScore" INTEGER,
  "recruiterNotes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "answers" TEXT
);

-- 8. Create UserProfile table
CREATE TABLE IF NOT EXISTS "UserProfile" (
  "userId" TEXT PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
  "bio" TEXT,
  "skills" TEXT, -- JSON string
  "education" TEXT, -- JSON string
  "experience" TEXT, -- JSON string
  "resumeUrl" TEXT,
  "resumeText" TEXT,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. Create Company table
CREATE TABLE IF NOT EXISTS "Company" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "website" TEXT,
  "logo" TEXT,
  "industry" TEXT,
  "location" TEXT,
  "adminId" TEXT REFERENCES "User"("id"),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add companyId to User and Job
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyId" TEXT REFERENCES "Company"("id");
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "companyId" TEXT REFERENCES "Company"("id");

ALTER TABLE "Job" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "JobField" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Application" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Company" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on Job" ON "Job" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on JobField" ON "JobField" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on Application" ON "Application" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on UserProfile" ON "UserProfile" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on Company" ON "Company" FOR ALL USING (true) WITH CHECK (true);
