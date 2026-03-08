-- Supabase Schema for "What Time Is Salah? (Allahabad)"

-- 1. Mosques Table
CREATE TABLE public.mosques (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  area text NOT NULL,
  address text NOT NULL,
  latitude double precision,
  longitude double precision,
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE public.mosques ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view approved mosques" ON public.mosques FOR SELECT USING (is_approved = true);

-- 2. Prayers Table
CREATE TABLE public.prayers (
  mosque_id uuid REFERENCES public.mosques(id) ON DELETE CASCADE PRIMARY KEY,
  fajr_adhan text,
  fajr_iqamah text,
  dhuhr_adhan text,
  dhuhr_iqamah text,
  asr_adhan text,
  asr_iqamah text,
  maghrib_adhan text,
  maghrib_iqamah text,
  isha_adhan text,
  isha_iqamah text,
  jumuah_khutbah text,
  jumuah_iqamah text,
  ramadan_taraweeh text,
  ramadan_announcements text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.prayers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view prayers" ON public.prayers FOR SELECT USING (true);


-- 3. Facilities Table
CREATE TABLE public.facilities (
  mosque_id uuid REFERENCES public.mosques(id) ON DELETE CASCADE PRIMARY KEY,
  has_womens_area boolean DEFAULT false,
  has_wudu_area boolean DEFAULT false,
  has_ac boolean DEFAULT false,
  has_wheelchair_access boolean DEFAULT false,
  has_parking boolean DEFAULT false,
  has_library boolean DEFAULT false
);

ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view facilities" ON public.facilities FOR SELECT USING (true);

-- 4. Admin Profiles
CREATE TABLE public.mosque_admins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  mosque_id uuid REFERENCES public.mosques(id) ON DELETE CASCADE,
  is_platform_admin boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, mosque_id)
);

ALTER TABLE public.mosque_admins ENABLE ROW LEVEL SECURITY;
-- Admins can view everything, they will be given more permissions via logic
CREATE POLICY "Admins can view their own roles" ON public.mosque_admins FOR SELECT USING (auth.uid() = user_id);
