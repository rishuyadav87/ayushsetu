-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding vector(384) to StudentProfile
ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS embedding vector(384);

-- Add embedding vector(384) to PostedOpportunity
ALTER TABLE "PostedOpportunity" ADD COLUMN IF NOT EXISTS embedding vector(384);
