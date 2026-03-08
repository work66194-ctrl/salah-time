-- SQL Script to add the time_suggestions table

CREATE TABLE public.time_suggestions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  mosque_id uuid REFERENCES public.mosques(id) ON DELETE CASCADE,
  prayer_name text NOT NULL, -- The specific field being updated, e.g. 'fajr_adhan'
  suggested_time text NOT NULL, -- The new time in HH:mm format
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.time_suggestions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert a suggestion
CREATE POLICY "Anyone can insert time suggestions" ON public.time_suggestions FOR INSERT WITH CHECK (true);

-- Allow anyone to view suggestions (admins bypass RLS anyway via Service Role, but this handles edge cases)
CREATE POLICY "Anyone can view suggestions" ON public.time_suggestions FOR SELECT USING (true);
