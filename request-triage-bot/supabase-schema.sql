-- ============================================
-- Request Triage Bot — Supabase Schema
-- Combined best practices from both versions
-- ============================================

-- Step 1: Enable pgvector extension
create extension if not exists vector;

-- Step 2: Create the requests table
create table public.requests (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  requester_name text not null,
  requester_email text not null,
  department text,

  -- AI-classified fields
  category text,
  urgency text check (urgency in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  routed_team text,
  ai_summary text,
  status text default 'NEW' check (status in ('NEW', 'IN_PROGRESS', 'COMPLETED', 'REJECTED')),

  -- Embedding for similarity search
  embedding vector(1536),

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Step 3: Index for vector similarity search
-- lists = 10 is appropriate for small-to-medium datasets
create index on public.requests using ivfflat (embedding vector_cosine_ops)
  with (lists = 10);

-- Step 4: Indexes for dashboard filtering
create index idx_requests_status on public.requests(status);
create index idx_requests_urgency on public.requests(urgency);

-- Step 5: Auto-update updated_at on row changes
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger requests_updated_at
  before update on public.requests
  for each row
  execute function update_updated_at();

-- Step 6: Similarity search function
-- Uses `language sql stable` for better query planner optimization
create or replace function match_requests(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id uuid,
  title text,
  description text,
  category text,
  urgency text,
  routed_team text,
  status text,
  ai_summary text,
  similarity float
)
language sql stable
as $$
  select
    requests.id,
    requests.title,
    requests.description,
    requests.category,
    requests.urgency,
    requests.routed_team,
    requests.status,
    requests.ai_summary,
    1 - (requests.embedding <=> query_embedding) as similarity
  from requests
  where 1 - (requests.embedding <=> query_embedding) > match_threshold
  order by (requests.embedding <=> query_embedding)
  limit match_count;
$$;

-- Step 7: Enable Row Level Security
alter table public.requests enable row level security;

-- Step 8: Permissive policy for development (tighten in production)
create policy "Allow all operations on requests"
  on public.requests for all
  using (true)
  with check (true);
