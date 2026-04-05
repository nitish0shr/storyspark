-- Add audio_url column to book_pages table for TTS narration
alter table public.book_pages add column if not exists audio_url text;
