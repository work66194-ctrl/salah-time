-- Run this in your Supabase SQL Editor to populate the database with initial Mosques

-- Jama Masjid
WITH new_mosque AS (
  INSERT INTO public.mosques (name, area, address, latitude, longitude, is_approved)
  VALUES ('Jama Masjid', 'Chowk', 'Chowk, Prayagraj, UP 211003', 25.4411, 81.8310, true)
  RETURNING id
)
, new_facilities AS (
  INSERT INTO public.facilities (mosque_id, has_wudu_area, has_womens_area, has_wheelchair_access, has_ac, has_parking, has_library)
  SELECT id, true, false, false, true, false, true FROM new_mosque
)
INSERT INTO public.prayers (
  mosque_id, fajr_adhan, fajr_iqamah, dhuhr_adhan, dhuhr_iqamah, asr_adhan, asr_iqamah, 
  maghrib_adhan, maghrib_iqamah, isha_adhan, isha_iqamah, jumuah_khutbah, jumuah_iqamah, 
  ramadan_taraweeh, ramadan_announcements
)
SELECT id, '05:05', '05:45', '12:25', '13:15', '15:45', '16:30', '18:15', '18:25', '19:35', '20:15', '13:00', '13:30', '20:30', 'Iftar arranged daily during Ramadan.'
FROM new_mosque;

-- Masjid e Umar
WITH new_mosque AS (
  INSERT INTO public.mosques (name, area, address, latitude, longitude, is_approved)
  VALUES ('Masjid e Umar', 'Civil Lines', 'MG Marg, Civil Lines, Prayagraj', 25.4526, 81.8331, true)
  RETURNING id
)
, new_facilities AS (
  INSERT INTO public.facilities (mosque_id, has_wudu_area, has_womens_area, has_wheelchair_access, has_ac, has_parking, has_library)
  SELECT id, true, true, true, true, true, false FROM new_mosque
)
INSERT INTO public.prayers (
  mosque_id, fajr_adhan, fajr_iqamah, dhuhr_adhan, dhuhr_iqamah, asr_adhan, asr_iqamah, 
  maghrib_adhan, maghrib_iqamah, isha_adhan, isha_iqamah, jumuah_khutbah, jumuah_iqamah
)
SELECT id, '05:10', '05:30', '12:25', '13:15', '15:50', '16:15', '18:15', '18:25', '19:35', '20:00', '13:15', '13:45'
FROM new_mosque;

-- Kareli Badi Masjid
WITH new_mosque AS (
  INSERT INTO public.mosques (name, area, address, latitude, longitude, is_approved)
  VALUES ('Kareli Badi Masjid', 'Kareli', 'Kareli, Prayagraj', 25.4215, 81.8105, true)
  RETURNING id
)
, new_facilities AS (
  INSERT INTO public.facilities (mosque_id, has_wudu_area, has_womens_area, has_wheelchair_access, has_ac, has_parking, has_library)
  SELECT id, true, true, false, true, true, true FROM new_mosque
)
INSERT INTO public.prayers (
  mosque_id, fajr_adhan, fajr_iqamah, dhuhr_adhan, dhuhr_iqamah, asr_adhan, asr_iqamah, 
  maghrib_adhan, maghrib_iqamah, isha_adhan, isha_iqamah, jumuah_khutbah, jumuah_iqamah
)
SELECT id, '05:00', '05:20', '12:25', '13:00', '15:45', '16:00', '18:15', '18:25', '19:35', '19:50', '13:00', '13:30'
FROM new_mosque;
