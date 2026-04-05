-- Add audio_url column to book_pages table for TTS narration
alter table public.book_pages add column if not exists audio_url text;

-- Add audio_status column to books table to track narration generation outcome
alter table public.books add column if not exists audio_status text
  check (audio_status in ('complete', 'failed', 'skipped'));
