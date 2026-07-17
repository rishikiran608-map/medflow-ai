-- ==========================================
-- MedFlow AI Operating System Database Migrations
-- Run these commands in your Supabase SQL Editor
-- ==========================================

-- 1. Enable vector extension for Agentic RAG semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create Knowledge Documents table for RAG
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL, -- 'SOP', 'Guideline', 'Medicine', 'Patient Record', etc.
  role_access text[] NOT NULL DEFAULT '{Patient, Doctor, Hospital Admin, Pharmacist, Clinic Owner}',
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES doctors(id) ON DELETE SET NULL,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for similarity search
CREATE INDEX IF NOT EXISTS knowledge_documents_embedding_idx 
  ON knowledge_documents 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

-- 3. Create Chat Messages for multi-agent conversation memory and history
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id text NOT NULL, -- usually patient_id or agent session key
  sender_id uuid, -- optional, if authenticated user
  sender_role text NOT NULL, -- 'Patient', 'Doctor', 'Pharmacist', 'Hospital Admin', 'Clinic Owner', 'System'
  message text NOT NULL,
  agent_role text NOT NULL, -- 'Patient Assistant', 'Doctor Assistant', 'Reception Assistant', etc.
  is_audit_logged boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index on conversation_id for quick loading of chat history
CREATE INDEX IF NOT EXISTS chat_messages_conversation_idx ON chat_messages(conversation_id);

-- 4. Create Audit Logs table for logging and compliance (HIPAA)
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid, -- user id executing the command
  actor_role text NOT NULL,
  action text NOT NULL, -- 'Query RAG', 'OCR Upload', 'Prescription Written', 'Approved Booking'
  target_resource text NOT NULL, -- table name or resource URL
  metadata jsonb DEFAULT '{}'::jsonb,
  confidence_score float, -- AI confidence score
  requires_approval boolean DEFAULT false,
  is_approved boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Clinical Approvals table for the human approval flow
CREATE TABLE IF NOT EXISTS clinical_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  requester_role text NOT NULL,
  approver_role text NOT NULL, -- e.g., 'Doctor'
  approver_id uuid, -- will be populated when approved
  status text NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
  action_type text NOT NULL, -- 'Write Prescription', 'Book Override'
  action_payload jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Update Prescriptions table for medicine tracking and refill notifications
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS medication_schedule jsonb DEFAULT '{}'::jsonb;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS remaining_doses integer DEFAULT 30;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS refill_date date;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS interaction_warnings text;

-- 7. Update Doctors table for consult duration predictions
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS avg_consultation_time integer DEFAULT 15;

-- 8. Create PGVector Match Documents RPC Function
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_category text DEFAULT NULL,
  filter_role_access text DEFAULT NULL
) RETURNS TABLE (
  id uuid,
  title text,
  content text,
  category text,
  role_access text[],
  similarity float
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    kd.id,
    kd.title,
    kd.content,
    kd.category,
    kd.role_access,
    1 - (kd.embedding <=> query_embedding) AS similarity
  FROM knowledge_documents kd
  WHERE (1 - (kd.embedding <=> query_embedding)) > match_threshold
    AND (filter_category IS NULL OR kd.category = filter_category)
    AND (filter_role_access IS NULL OR filter_role_access = ANY(kd.role_access))
  ORDER BY kd.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
